var path = require('path');
var express = require('express');
var app = express();
var http = require('http');
var socket = require('socket.io');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var Timer = require('./timer');
var TimerHandlers = require('./timerHandler.js');
var Illephone = require('./illephone.js');
var GameObject = require('./gameObject.js');
const cors = require('cors');
// ToDo - 
// import the file system module
var fs = require('fs');

var messages = []; // Store all messages
var users = {}; // Stores client usernames
var clientsReady = {}; // Stores client ready signals
var roomInfo = {}; // Store the room information
var categoryNameToFn = {}; // Store the category name to file name mapping

// TODO: Can make new server files to hold schema, model, and endpoint implementation
// Connect to the MongoDB Server
//================== Mongo Section =====================
var db = mongoose.connect("mongodb://localhost:27017/illephone", (err, response) => {
    if(err){
        console.log(err)
    }
});

const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

// The schema for the room object in Mongo
const roomSchema = new Schema({
    id: {type: Number, required: true},
    name: { type: String, required: true },
    maxPlayers: { type: Number, required: true },
    timeLimit: { type: Number, required: true },
    category: {type: String, required: true},
    password: String,
    currentNumPlayers: Number,
}, {collection: 'rooms'});

var roomModel = mongoose.model('room', roomSchema);

// ToDo - 
// This schema is for the word list in Mongo
const wordListsSchema = new Schema ({
    name: { type: String, required: true },
    file: { type: String, required: true }
}, {collection: 'wordLists'})

var wordListModel = mongoose.model('wordList', wordListsSchema);
//======================================================

// Parser
app.use(bodyParser.json())
    .use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: false}));

// Enable coors
// app.use(cors({origin: 'http://localhost:4200'}));

// Serve home page
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
})

// REST API Endpoints
// ============================= REST API Endpoints ====================================
// Get a list of game rooms
app.get("/api/rooms", (req,res) => {
    console.log("Recieved a GET request at /api/rooms");
    let params = req.query.id ? {id : req.query.id} : {};
    roomModel.find(params, '-_id id name maxPlayers timeLimit category currentNumPlayers', function(err, games){
        if(err){
            return res.status(500).send(err);
        }else{
            // Store the properties of the room on the server
            for (var i = 0; i < games.length; i++) {
                roomInfo[games[0].id] = games[0];
            }
            return res.status(200).json(games);
        }
    });
});
// Create a game room
app.post("/api/rooms", (req,res) => {
    console.log("Recieved a POST request at /api/rooms with body");
    var data = new roomModel(req.body);
    data.save(function(err){
        if(err){
            return res.status(500).send(err);
        }else{
            delete req.body.password;
            for (var i = 0; i < req.body.length; i++) {
                roomInfo[req.body[0].id] = req.body[0];
            }
            // Store the properties of the room on the server
            return res.status(201).send(req.body);
        }
    });
});

// Get a list of categories
app.get("/api/categories", (req, res) => {
    console.log("Recieved a GET request at /api/categories");
    let params = {};
    wordListModel.find(params, '-_id name file', function (err, categories) {
        if (err) {
            return res.status(500).send(err);
        } else {
            for (var i = 0; i < categories.length; i++) {
                categoryNameToFn[categories[0].name] = categories[0].file;
            }
            return res.status(200).json(categories);
        }
    });
});
// ==============================================================================

// ========================== Server DB Functions ===============================
// params: roomId - id of room to update player count of
//         count - number to update player count with 
function updatePlayerCount(roomId, count){
    var query = { id: roomId};
    var data = { currentNumPlayers: count };
    roomModel.findOneAndUpdate(query, data, function(err){
        if (err){
            console.log(err);
        }
    });
}

// ToDo -
// This function will grab the words from our dictionary. 
function getPictionaryWord(roomId) {
    var index = Math.floor(Math.random() * illephoneGames.get(roomId).wordList.length);
    var word = illephoneGames.get(roomId).wordList[index];
    illephoneGames.get(roomId).wordList.splice(index, 1); // Remove word to avoid duplicates
    return word;
}

function getPictionaryWordList(category, roomId) {
    var wordList = fs.readFileSync("./src/assets/wordLists/" + categoryNameToFn[category], 'utf8');
    var wordListArr = wordList.split(/\r?\n/);
    wordListArr.forEach(function (word) {
        illephoneGames.get(roomId).wordList.push(word);
    });
    return wordListArr;
}

// ==============================================================================
app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
})

// Get port and store in express
const port = process.env.PORT || '4200';
app.set('port', port);

// Create http server
const server = http.createServer(app);

server.listen(port, function () {
    console.log('listening on ' + port);
});


// ========================== Socket Helper Functions ===============================
// params: client - id of the client
//         clients - list of clients
function findClientIdx(clientId, clients) {
    var clientIdx = 0;
    for (i = 0; i < clients.length; i++) {
        var client = clients[i];
        if (client == clientId) {
            clientIdx = i;
        }
    }
    return clientIdx;
}

// params: client - id of the client to update value
function updateClientValue(roomId, clientId) {
    var currentValue = illephoneGames.get(roomId).timer.results.get(clientId);
    illephoneGames.get(roomId).timer.results.set(clientId, currentValue + 1);
}

// ========================== End Helper Functions ===============================


// Initialize timer to time delay before game starts
var illephoneGames = new Map();

// Socket handler
const io = socket(server);
io.sockets.on('connection', (socket) => {

    console.log('user connected');

    socket.on('join', function(roomId, user){

        socket.join(roomId);
        if(users[roomId] === undefined){
            users[roomId] = {};
        }
        users[roomId][socket.id] = user;
        updatePlayerCount(roomId, Object.keys(users[roomId]).length);

        socket.on('disconnect', function () {
            let currentNumPlayers = 0;
            if(users[roomId][socket.id] != undefined){
                delete users[roomId][socket.id];
                if(!Object.keys(users[roomId]).length){
                    delete users[roomId];
                }else{
                    currentNumPlayers = Object.keys(users[roomId]).length;
                }
            }
            io.sockets.in(roomId).emit('update-users', users[roomId]);
            io.sockets.in(roomId).emit('message', {
                user: "",
                text: user.name + " has disconnected.",
                src: "server"
            });
            updatePlayerCount(roomId, currentNumPlayers);
            console.log('user disconnected');
        });

        // In user-connected event, update list
        io.sockets.in(roomId).emit('message', {
            user: "", 
            text: user.name + " has joined the server.",
            src: "server"
        });

        // Update users list when joining
        io.sockets.in(roomId).emit('update-users', users[roomId]);

        // Update the users' status to what we currently have in the room
        if(clientsReady[roomId] != undefined){
            var room = io.sockets.adapter.rooms[roomId];
            var clients = Object.keys(room.sockets);
            for(var i = 0 ; i < clients.length; i++){
                var clientId = clients[i];
                var isReady = clientsReady[roomId][clientId]; 
                var userId = users[roomId][clientId].id;
                io.sockets.in(roomId).emit('update-user-ready', isReady, userId);   
            }
        }        

    });

    // Handle ready signals from board
    socket.on('client-ready', function(roomId, isReady, userId){
        // Create ready array if none exists
        if(clientsReady[roomId] === undefined){
            clientsReady[roomId] = {};
        }
        // Store if the client is ready for it's socket
        clientsReady[roomId][socket.id] = isReady;

        // Emit to the game to update the status of the player that's ready
        io.sockets.in(roomId).emit('update-user-ready', isReady, userId);

        // Check if all users are ready
        var allReady = true;
        var room = io.sockets.adapter.rooms[roomId];
        var clients = Object.keys(room.sockets);

        for(var i = 0; i < clients.length; i++){
            allReady &= clientsReady[roomId][clients[i]];
        }

        // Start the game if all users are ready
        if(allReady && clients.length >= 2){

            // Remove any exisiting objects if there was a previous game
            if(illephoneGames.get(roomId) != undefined){
                delete illephoneGames.get(roomId);
            }

            // Default gamestate to lobby
            illephoneGames.set(roomId, new Illephone(new Timer(roomId, io)));

            // Add handlers for timer
            illephoneGames.get(roomId).timer.on('tick:timer', TimerHandlers.onTick);
            illephoneGames.get(roomId).timer.on('stop:timer', TimerHandlers.onStop);

            // Initialize the objects for room
            var clients = Object.keys(room.sockets);
            illephoneGames.get(roomId).gameObject.length = 0;

            // ToDo -
            // Read in the room's category wordlist
            var roomProp = roomInfo[roomId];
            var category = roomProp.category;
            let wordListArr = getPictionaryWordList(category, roomId);

            // Save off the wordlist into the object
            illephoneGames.get(roomId).timer.setWordList(wordListArr);
            illephoneGames.get(roomId).timer.setOriginalWordList(wordListArr);

            // Create new game object
            for (i = 0; i < clients.length; i++) {
                var client = clients[i];

                // Initialize each of the rooms stuff
                var gameObject = new GameObject();
                gameObject.artist[0] = client;
                gameObject.image[0] = 0;
                gameObject.guesser[0] = 0;
                // ToDo -
                // Get the new word
                gameObject.guess[0] = getPictionaryWord(roomId);
                illephoneGames.get(roomId).gameObject.push(gameObject);

                // Initialize results
                illephoneGames.get(roomId).timer.results.set(client, 0);
            }

            // ToDo (Peter T. 4/22) - Can we decouple this timer stuff away from the game?
            illephoneGames.get(roomId).timer.setIllephone(illephoneGames.get(roomId).gameObject);

            // Should send that the game is starting, and disable ready button from screen
            io.sockets.in(roomId).emit('message', {
                user: "",
                text: "Game is now starting",
                src: "game"
            });
            io.sockets.in(roomId).emit('toggle-game-start', false);

            // Reset player ready tracker
            clientsReady[roomId] = {};

            // Send the client knowledge of clientId to name mapping
            io.sockets.in(roomId).emit("save-clientId-to-name", users[roomId]);

            // Start game
            illephoneGames.get(roomId).timer.start();
        }

    });

    socket.on('add-message', function(message) {
        var roomId = message.room;

        io.sockets.in(roomId).emit('message', message.message);                 
        // Function above that stores the message in the database
        //databaseStore(message)
        messages.push(message);
    });

    socket.on('clientDrawing', function(message) {
        var roomId = message.roomId;
        var clientId = message.clientId;
        var image = message.image;

        // Find which index the client is in
        var room = io.sockets.adapter.rooms[roomId];        
        if (room !== undefined){
            var clients = Object.keys(room.sockets);

            // Find the index of our client
            var clientIdx = findClientIdx(clientId, clients);
            
            // Grab the timer for this room to figure out the turn
            var roomTimer = illephoneGames.get(roomId).timer;
            var turn = roomTimer.turns - 1; // Should be the turn before...

            // Figure out what turn we're on to send appropriate board
            // to correct person. We will always receive the board that 
            // the client before us had.
            var index = (clientIdx + turn) % clients.length;

            // Save that image and artist off
            var drawIndex = roomTimer.illephone[index].drawIndex;
            roomTimer.illephone[index].artist[drawIndex] = clientId;
            roomTimer.illephone[index].image[drawIndex] = image;

            // Increment the drawIndex
            roomTimer.illephone[index].drawIndex += 1;
        }

    });

    socket.on('clientGuess', function (message) {
        var roomId = message.roomId;
        var clientId = message.clientId;
        var guess = message.guess;

        // Find which index the client is in
        var room = io.sockets.adapter.rooms[roomId];
        if (room !== undefined) {
            var clients = Object.keys(room.sockets);

            // Find the index of our client
            var clientIdx = findClientIdx(clientId, clients);

            // Grab the timer for this room to figure out the turn
            var roomTimer = illephoneGames.get(roomId).timer;
            var turn = roomTimer.turns - 1; // Should be the turn before...

            // Figure out what turn we're on to send appropriate board
            // to correct person. We will always receive the board that 
            // the client before us had.
            var index = (clientIdx + turn) % clients.length;

            // Increment the guessIndex
            roomTimer.illephone[index].guessIndex += 1;

            // Save that guess and guesser off
            var guessIndex = roomTimer.illephone[index].guessIndex;
            roomTimer.illephone[index].guesser[guessIndex] = clientId;
            roomTimer.illephone[index].guess[guessIndex] = guess;
        }

    });  
    
    // Assign the server values of what the current points are for each player
    socket.on('client-judge', function (message) {
        var roomId = message.roomId;
        var imageClientId = message.imageClientId;
        var guessClientId = message.guessClientId;

        // Assign judge window values, one point for each client
        var room = io.sockets.adapter.rooms[roomId];
        if (room !== undefined) {
            // Update selected image/guess clients value
            updateClientValue(roomId, imageClientId);
            updateClientValue(roomId, guessClientId);
        }

    });  
});


module.exports = app;
