var gameObject = require('./gameObject.js');

function Illephone(timer) {
	this.timer = timer; // Timer
	this.gameObject = new Array(gameObject); // Game object
	this.wordList = new Array();
}

module.exports = Illephone;