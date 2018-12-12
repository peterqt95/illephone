/******************************************************************************************************
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING 
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING 
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING 
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING 
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING 
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING 
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING
 * THIS IS A REMIND FOR PETER THIS IS TELESTRATIONS AND NOT DRAW MY THING 
 *******************************************************************************************************/
var GameObject = require('./gameObject.js');

// Event handlers
var TimerHandlers = {
	
	// Emit tick value
	onTick: function (time) {
		this.io.sockets.in(this.roomId).emit('timer-tick', time);
	},

	// Emit the change in draw phase, should also emit
	// change in player
	onStop: function() {
		var TimerStates = this.timerStates;
		switch (this.state) {
			case TimerStates.LOBBY:
				this.setTime(TimerStates.DRAW);
				break;
			case TimerStates.DRAW:
			case TimerStates.GUESS:
				this.previousState = this.state;
				this.setTime(TimerStates.DELAY);
				break;
			case TimerStates.DELAY:
				if (this.previousState == TimerStates.DRAW){
					this.setTime(TimerStates.GUESS);
				} else if (this.previousState == TimerStates.GUESS){
					this.setTime(TimerStates.DRAW);
				} else if (this.previousState == TimerStates.DELAY){
					this.setTime(TimerStates.JUDGE);
					this.previousState = TimerStates.DELAY;
				} else if (this.previousState == TimerStates.JUDGE){
					this.setTime(TimerStates.LOBBY);
					this.previousState = TimerStates.DELAY;
				}
				break;
			case TimerStates.JUDGE:
				// If we exceed our round limit, reset back to the lobby
				// ToDo (Peter T. 3/26) - Temporary define to checkout reset function
				this.previousState = this.state;
				if (this.round > 1) {
					// Probably show some sort of winner screen 
					// During this phase
					this.resetGame(TimerStates.ENDGAME);
				} else {
					// Continue the game
					this.resetRound(TimerStates.DELAY);
				}
				break;
			case TimerStates.ENDGAME:
				// Reset back to lobby after game ends
				this.setTime(TimerStates.LOBBY);
				this.
				break;
			default:
				break;
		}

		// Make sure there are clients connected 
		var room = this.io.sockets.adapter.rooms[this.roomId];
		if(room !== undefined) {
			// Give player state (single client connected to only one room)
			var clients = Object.keys(room.sockets);	

			// If the number of turns has gone through all the players,
			// then that means your card is coming back to you
			// if(this.turns == clients.length && (this.state == TimerStates.DRAW || this.state == TimerStates.GUESS)){
			if (this.turns == clients.length && (this.state == TimerStates.DELAY)) {
				// Turn to a judging phase by setting the previous state to JUDGE.
				// This will be our indiciation in our state check that after this delay we should set to JUDGE
				this.round += 1;
				this.previousState = TimerStates.DELAY;

			} else if(this.state == TimerStates.DRAW || this.state == TimerStates.GUESS || this.state == TimerStates.JUDGE){
				// Signal action to display drawable canvas board 
				for(i = 0; i < clients.length; i++){
					// Client that we're sending the drawing object to
					var client = clients[i];

					// Figure out what turn we're on to send appropriate board
					// to correct person. We will always receive the board that 
					// the client before us had.
					var index = (i + this.turns) % clients.length;
					var board = this.illephone[index];
		
					// Send the appropriate board to the client
					this.io.sockets.in(this.roomId).sockets[client].emit('newBoard', board);
				}
			} else if (this.state == TimerStates.ENDGAME){
				// Set the game back to lobby state but don't start until everyone is ready
				this.isReady = false;

				// Send updated scores
				var clientIds = Array.from(this.results.keys());
				var clientValues = Array.from(this.results.values());
				this.io.sockets.in(this.roomId).emit('update-scores', clientIds, clientValues);

				// Send the client winner
				let winnerVal = clientValues[0];
				let winnerId = clientIds[0];
				for (let i = 0; i < clientValues.length; i++) {
					if (clientValues[i] > winnerVal) {
						winnerVal = clientValues[i];
						winnerId = clientIds[i];
					}
				}
				this.io.sockets.in(this.roomId).emit('update-winner', winnerId);

				// Let clients know game is over and put back in a waiting state.
				this.io.sockets.in(this.roomId).emit('toggle-game-start', true);
			} else if (this.previousState == TimerStates.DELAY && this.state == TimerStates.LOBBY){
				// If the previous state was the judge phase, send message to update
				// each client with the latest scores
				var clientIds = Array.from(this.results.keys());
				var clientValues = Array.from(this.results.values());
				this.io.sockets.in(this.roomId).emit('update-scores', clientIds, clientValues);

				// Need to reselect new values for the guess and reset the game objects
				this.illephone.length = 0;
				
				// Create new game object
				for (i = 0; i < clients.length; i++) {
					var client = clients[i];

					// Initialize each of the rooms stuff
					var gameObject = new GameObject();
					gameObject.artist[0] = client;
					gameObject.image[0] = 0;
					gameObject.guesser[0] = 0;
					
					// Restore the current wordlist if it's not long enough
					if (this.currentWordList.length < clients.length) {
						this.currentWordList = this.fullWordList.slice();
					}

					// Grab a random word from the word list
					var index = Math.floor(Math.random() * this.currentWordList.length);
					var word = this.currentWordList[index];
					this.currentWordList.splice(index, 1); // Remove word to avoid duplicates
					gameObject.guess[0] = word;

					// Append the object to our game
					this.illephone.push(gameObject);
				}
			}

			// Keep track of how many turns we've made
			if (this.state == TimerStates.DRAW || this.state == TimerStates.GUESS) {
				this.turns += 1;
			}

			// Start timer as long as players are in
			if(clients.length > 1 && this.isReady) {
				this.start();
			} else {
				// We're back in lobby
				this.setTime(TimerStates.LOBBY);
			}

			// Emit the state of the game
			this.io.sockets.in(this.roomId).emit('gameState', this.state);							

			console.log("Current Phase: " + this.state + "\tTurn: " + this.turns + "\tRound: " + this.round);
		}
	}

};


module.exports = TimerHandlers;