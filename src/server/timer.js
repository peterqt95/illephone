var util = require('util');
var events = require ('events');
var _ = require('underscore');

/******************************************
 *
 * Constructor
 *
 ******************************************/

function Timer(roomId, io) {
	if (false === (this instanceof Timer)){
		return new Timer();
	}
	// Enum define for all states
	this.timerStates = Object.freeze({
		"LOBBY": 10, "DRAW": 30, "DELAY": 5,
		"GUESS": 15, "JUDGE": 60, "ENDGAME": 20
	});

	// will be used to say if instance has started 
	this.interval = undefined; 
	this.time = this.timerStates.LOBBY;
	this.state = this.timerStates.LOBBY;

	// Keep track of room so we can emit to all clients in room
	this.io = io;
	this.roomId = roomId;

	// Keep track of the objects for the game
	this.illephone = undefined;

	// Keep track of current index in clients
	this.curPlayerIdx = 0;
	this.round = 0;
	this.turns = 0;

	// Keep track to see if game is ready
	this.isReady = true;

	// Keep track of results for the clients
	this.results = new Map();

	// Keep track of word list
	this.currentWordList = new Array();
	this.fullWordList = new Array();

	events.EventEmitter.call(this);

	// Underscore lets us bind all the class methods
	// to this instance of the object
	_.bindAll(this, 'start', 'stop', 'onTick');
}

// Inherit for EventEmitter, will be used
// to start events of our Timer
util.inherits(Timer, events.EventEmitter);

/******************************************
 *
 * Methods
 *
 ******************************************/
Timer.prototype.start = function(){
	if (this.instance){
		return;
	}

	// time = seconds
	this.interval = setInterval(this.onTick, 1000);
	this.emit('start:timer');
}

Timer.prototype.stop = function() {
	if(this.interval) {
		clearInterval(this.interval);
		this.interval = undefined;
		this.emit('stop:timer', this.io);
	}
}

Timer.prototype.setTime = function(time) {
	if(this.interval) {
		// Shouldn't set the time if it's running
		return;
	}

	this.time = time;
	this.state = time;
}

Timer.prototype.onTick = function() {
	this.time -= 1;

	// Emit the formatted time
	this.emit('tick:timer', this.formatTime(this.time));

	if (this.time === 0) {
		this.stop();
	}
}

// Resets parameters to default
Timer.prototype.resetGame = function (time) {
	this.resetRound(time);

	// Set rounds back to 0
	this.round = 0;
}

// Resets parameters to default
Timer.prototype.resetRound = function (time) {

	// Reset time back to lobby
	this.time = time;
	this.state = time;

	// Reset game trackers
	this.curPlayerIdx = 0;
	this.turns = 0;
}

Timer.prototype.formatTime = function(time){
	minutes = parseInt(time / 60, 10);
	seconds = parseInt(time % 60, 10);

	minutes = minutes < 10 ? "0" + minutes : minutes;
	seconds = seconds < 10 ? "0" + seconds : seconds;

	time = minutes + ":" + seconds;

	return time;
}

Timer.prototype.getTime = function() {
	return this.formatTime(this.time);
};


// Illephone game object setters/getters.
// ToDo (Peter T. ) - How do I split this away from this class?
Timer.prototype.setIllephone = function(illephone) {
	this.illephone = illephone;
}

Timer.prototype.setWordList = function(wordList) {
	this.currentWordList = wordList.slice();
}

Timer.prototype.setOriginalWordList = function(wordList) {
	this.fullWordList = wordList.slice();
}

module.exports = Timer;