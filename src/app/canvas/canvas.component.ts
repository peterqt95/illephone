import { Component, ViewChild, ElementRef, AfterViewInit, HostListener} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Game } from '../game';
import { GameService } from '../game.service';
import { Message } from '../message';
import { User } from '../user';
import { IllephoneBoard } from '../illephoneBoard';
import { COLORS } from '../colors';
import { JudgeWindowComponent } from '../judge-window/judge-window.component';


@Component({
  selector: 'game-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})

export class CanvasComponent implements AfterViewInit {
  // Element reference to canvas
  @ViewChild('canvas') canvas: ElementRef;
  
  // Element reference to judge window's values
  @ViewChild(JudgeWindowComponent)
  private judgeWindowComponenet: JudgeWindowComponent;

  @HostListener('window:resize')
  onResize(){
    
    // ToDo (Peter 7/2) - Include resizing of image here (of type PNG)

    // Resize on drawing phase so that canvas doesn't look bad
    if(this.GAME_STATES.get(this.gameState) == "DRAW") {

      // Grab the canvas element
      const canvasElement: HTMLCanvasElement = this.canvas.nativeElement;

      // Grab the new window size
      canvasElement.width = window.innerWidth * .85;
      canvasElement.height = window.innerHeight * .8;

      // Re-image the canvas 
      for (let pos of this.canvasHistory) {
        this.editCanvas(pos.prevPos, pos.curPos);
      }
    }
  }

  // 2d context of canvas
  private context: CanvasRenderingContext2D;

  gameState: number;                      // Current state
  previousState: number;                  // Previous state of game
  gameStateString: string;                // Current state to display in state board
  guess: string;                          // Guess of the drawing
  currentTime: string;                    // Current time of the game
  game: Game;                             // Room that we entered in
  clientId;                               // Client ID
  illephoneBoard: IllephoneBoard;         // The board that will be passed between players
  dataLoaded: boolean = false;            // Game data loaded
  colors: string[]; // The colors shown in the canvas properties
  brushWidth: number;
  selectedColor: string;
  showCanvasOptions: boolean = false;
  clientScores: Array<{clientId: string, clientValue: number}>;
  clientIdToUser: Map<string, User>;

  // Winner information
  winnerName: string;
  isWinnerSet: boolean;
  

  // Canvas history on current canvas, should probably define a type for this
  canvasHistory: Array<{prevPos: {x: number, y: number, color: string, size: number}, curPos: {x: number, y: number, color: string, size: number} }>;

  // Map for the kind of game states we expect
  GAME_STATES: Map<number, string>;

  constructor(private gameService: GameService,
    private route: ActivatedRoute
  ) { 

    // Initialize possible GAME_STATES
    this.GAME_STATES = new Map([
      [10, "LOBBY"],
      [30, "DRAW"],
      [5, "DELAY"],
      [15, "GUESS"],
      [60, "JUDGE"],
      [20, "ENDGANE"]
    ]);

    // initialize default values
    this.canvasHistory = [];                                     // Canvas history
    this.gameState = 10;                                         // Lobby
    this.previousState = 10;                                     // Previous state
    this.currentTime = "00:10";                                  // Time
    this.gameStateString = this.GAME_STATES.get(this.gameState); // State in string form
    this.guess = '';                                             // Guess
    this.colors = COLORS;
    this.brushWidth = 4;
    this.selectedColor = "black";
    this.clientScores = new Array();
    this.winnerName = "";
    this.isWinnerSet = false;
  }

  ngAfterViewInit() {

    // Wait for game to be retreived before loading resources
    const id = +this.route.snapshot.paramMap.get('id');
    this.gameService.getGame(id).subscribe(
      game => {
        this.game = game[0];
        this.dataLoaded = true;
      },
      err => console.log(err),
      () => {
        // Initialize content
        // Set the context of our canvas
        const canvasElement: HTMLCanvasElement = this.canvas.nativeElement;
        this.context = canvasElement.getContext('2d');

        // Initialize canvas properties
        this.initCanvasProperties(canvasElement);

        // Grab the client id
        this.clientId = this.gameService.getSocket().id;

        // Handle changing board
        this.gameService.getNewBoard().subscribe(board => {
          
          // Store the board
          this.illephoneBoard = board;

        });

        // Handle changing state
        this.gameService.getCurrentState(this.game.id).subscribe(state => {
          // Keep track of the state changes
          this.previousState = this.gameState;
          this.gameState = state;

          // Keep track of state to display on screen
          this.gameStateString = this.GAME_STATES.get(this.gameState);

          console.log("Previous State: " + this.previousState + "\tCurrent State: " + this.gameState);
          console.log(this.GAME_STATES.get(this.previousState) + "\t" + this.GAME_STATES.get(this.gameState));

          // Clear the previous guess
          this.guess = "";

          // Handle state change 
          // If previous state was "DRAW", then the current state is a delay. 
          // Send the drawing over to the server
          if (this.GAME_STATES.get(this.previousState) == "DRAW") {
            // Save the image off into some object to the current game so we can pass it on
            let image = canvasElement.toDataURL("image/png");

            // Grab the current drawIndex
            let drawIndex = this.illephoneBoard.drawIndex;

            // Store the image onto the board
            this.illephoneBoard.image[drawIndex] = image;

            // Emit to socket handler
            this.gameService.sendDrawing(this.game.id, image);
          }
          // If previous state was "GUESS", then the current state is a delay.
          // Send the guess over to the server
          else if(this.GAME_STATES.get(this.previousState) == "GUESS"){
            
            // Grab the current guessIndex
            let guessIndex = this.illephoneBoard.guessIndex;

            // Store the guess in the board and emit to socket handler
            this.gameService.sendGuess(this.game.id, this.illephoneBoard.guess[guessIndex]);
          } 
          // Current state is Guess phase, so reimage the board
          else if (this.GAME_STATES.get(this.gameState) == "GUESS"){

            // Get the image and display it
            let drawIndex = this.illephoneBoard.drawIndex;
            let index = (drawIndex > 0) ? drawIndex - 1 : 0;
            
            // Wait for image to load
            let image = new Image();
            image.src = this.illephoneBoard.image[index];
            image.onload = () => {
              this.context.drawImage(image, 0, 0);
            }
          } 
          // Current state is a Draw phase, so display the guess to draw
          else if (this.GAME_STATES.get(this.gameState) == "DRAW") {
            // Get the guess and display it
            let guessIndex = this.illephoneBoard.guessIndex;

            // Display guess
            this.guess = this.illephoneBoard.guess[guessIndex];
          } 
          // Last state was judge, send the information to the server
          else if (this.GAME_STATES.get(this.previousState) == "JUDGE") {
            // If the indexes were not selected, just set to 0
            if (this.judgeWindowComponenet.selectedImageIndex < 0) {
              this.judgeWindowComponenet.selectedImageIndex = 0;
            }
            if (this.judgeWindowComponenet.selectedGuessIndex < 0) {
              this.judgeWindowComponenet.selectedGuessIndex = 0;
            }

            // During delay, send the image/guess selections to the server
            let imageClientId = this.illephoneBoard.artist[this.judgeWindowComponenet.selectedImageIndex];
            let guessClientId = this.illephoneBoard.guesser[this.judgeWindowComponenet.selectedGuessIndex];

            this.gameService.sendJudgeValues(this.game.id, imageClientId, guessClientId);
          }

          // Clear the canvas
          this.context.clearRect(0, 0, canvasElement.width, canvasElement.height);

          // Reset the current canvas history
          this.canvasHistory.length = 0;
        });

        // Listen for mouse events
        this.gameService.mouseDrawLocation(this.game.id, canvasElement).subscribe(
          (result: [MouseEvent, MouseEvent]) => {
            if (this.GAME_STATES.get(this.gameState) == "DRAW") {
              const rect = canvasElement.getBoundingClientRect();

              const prevPos = {
                x: (result[0].clientX - rect.left) / (rect.right - rect.left) * canvasElement.width,
                y: (result[0].clientY - rect.top) / (rect.bottom - rect.top) * canvasElement.height,
                color: this.selectedColor,
                size: this.brushWidth
              }

              const curPos = {
                x: (result[1].clientX - rect.left) / (rect.right - rect.left) * canvasElement.width,
                y: (result[1].clientY - rect.top) / (rect.bottom - rect.top) * canvasElement.height,
                color: this.selectedColor,
                size: this.brushWidth
              }

              // Draw on canvas
              this.editCanvas(prevPos, curPos);

              // Store the positions
              this.canvasHistory.push({ prevPos, curPos });
              console.log(canvasElement.width, canvasElement.height);
            }
          }
        );

        // Listen for timer event to update time on screen
        this.gameService.getTime().subscribe(currentTime => {
          this.currentTime = currentTime;
        });

        // Listen for updating player scores
        this.gameService.getJudgeValues().subscribe(judgeInfo => {
          // Assign some results
          let clientIds = judgeInfo.clientIds;
          let clientValues = judgeInfo.clientValues;

          for (let i = 0; i < clientIds.length; i++) {
            let clientId = clientIds[i];
            let clientValue = clientValues[i];
            this.clientScores[i] = {clientId, clientValue};
          }
          console.log(this.clientScores);
        });

        // Listen for updating winner
        this.gameService.getWinner(id).subscribe(winnerId => {
          // Find the name to the corresponding winnerId
          let userList = <User[]>(this.gameService.getUserList(id));
          let winner;
          userList.forEach( (user) => {
            if (user.id === this.clientIdToUser[winnerId].id) {
              winner = user.name;
            }
          });

          // Set fields
          this.isWinnerSet = true;
          this.winnerName = winner;
        });

        this.gameService.getClientIdToNameMapping(id).subscribe(clientIdToUser => {
          this.clientIdToUser = clientIdToUser;
        });
      }
    )
  }

  // Sets the color of the brush
  setBrushColor(color: string){
    this.selectedColor = color;
    this.context.strokeStyle = color;
    this.context.fillStyle = color;
  }

  // Sets the lineWidth of the canvas brush
  setBrushWidth(){
    this.context.lineWidth = this.brushWidth;
  }

  // Pull and update the current game room id
  getGame(): void {
    const id = +this.route.snapshot.paramMap.get('id');
    this.gameService.getGame(id).subscribe(game => this.game = game);
  }

  // Update the canvas
  editCanvas(prevPos, curPos): void {
    this.context.beginPath();
    if(prevPos){
      // Create our line properties
      this.context.lineCap = "round";
      this.context.lineWidth = prevPos.size;
      this.context.strokeStyle = prevPos.color; // Default color
      this.context.fillStyle = prevPos.color;
      
      this.context.moveTo(prevPos.x, prevPos.y);
      this.context.lineTo(curPos.x, curPos.y);
      this.context.stroke();
      this.context.fill(); // For changing colors later
    }
  }

  // Initialize canvas properties
  initCanvasProperties(canvasElement: HTMLCanvasElement): void {
    // Set canvas height/width
    canvasElement.width = window.innerWidth * .85;
    canvasElement.height = window.innerHeight * .8;

    // Create our line properties
    this.context.lineCap = "round";
    this.context.lineWidth = 4;
    this.context.strokeStyle = this.selectedColor; // Default color
    this.context.fillStyle = this.selectedColor;

  }

  // Update the current guess
  lockGuess(guess: string) {
    // Update screen with guess
    this.guess = guess;

    // Assign the board's guess
    let guessIndex = this.illephoneBoard.guessIndex;
    this.illephoneBoard.guess[guessIndex] = guess;
  }

  // Toggles the canvas options
  toggleCanvasOptions(): void {
    this.showCanvasOptions = !this.showCanvasOptions;
  }


}
