export class IllephoneBoard {
    artist: Array<string>; // client id of the drawer
    image: Array<string>;   // Contains image url
    guesser: Array<string>; // client id of the guesser
    guess: Array<string>; // the guess of what the image is
    drawIndex: number; // index of what drawing we're on
    guessIndex: number; // index of what guess we're on
}