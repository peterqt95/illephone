function gameObject() {
	this.artist = new Array(); // Client id of drawer
	this.image = new Array();  // The drawing
	this.guesser = new Array(); // Client id of guesser
	this.guess = new Array(); // The word guessed

	// Index into array
	this.drawIndex = 0;
	this.guessIndex = 0;
}

module.exports = gameObject;