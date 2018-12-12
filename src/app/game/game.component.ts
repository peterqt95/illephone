import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { Game } from '../game';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material';

import { GameService } from '../game.service';
import { Message } from '../message';
import { User } from '../user';
import { UsernameDialogComponent } from '../username-dialog/username-dialog.component';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild('chatPanel') chatPanel: ElementRef;
  @ViewChild('roomFullModal') roomFullModal: TemplateRef<any>;

  messages : Message[]; // Save messages in game
  users : User[];
  message: Message; // This game's message
  msg: string; // User input
  ioConnection; // Game we're conencted to
  client; // This client
  game: Game; // Room that we entered in
  user: User; // The User of this room
  playingClient; // Current player
  dataLoaded: boolean = false;
  playerReady: boolean = false; // Is player ready
  showReadyButton: boolean = true; // Default show ready button when user joins
  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private location: Location,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    // Get the game id
    const id = +this.route.snapshot.paramMap.get('id');
    this.gameService.getGame(id).subscribe(
      game => {
        this.game = game[0];
        if(this.game.maxPlayers - this.game.currentNumPlayers <= 0){
          this.router.navigate(['/room']);
          let dialogRef = this.dialog.open(this.roomFullModal, {
            width: '500px'
          });
        }
        this.dataLoaded = true;
      },
      err => console.log(err),
      () => {
        this.getUser(); // Initialize the user
        this.message = new Message(this.user);
        this.ioConnectInitialize(); // Initialize the socket
      })
  }

  ngOnDestroy() {
    this.ioConnection.unsubscribe();
  }

  ngAfterViewChecked(){
    this.scrollToBottom();
  }

  // Handle all socket calls in here
  ioConnectInitialize(){
    // Create socket
    this.gameService.createSocket(this.game.id, this.user).subscribe(clientId =>  {
      this.client = clientId;
    });

    // Handle Incoming messages
    this.ioConnection = this.gameService.getMessages(this.game.id).subscribe(messages =>
      this.messages = messages
    );

    this.ioConnection = this.gameService.getUsers(this.game.id).subscribe(users => {
      this.users = users;
    })

    // Handle changing player
    this.gameService.getCurrentState(this.game.id).subscribe(client =>
      this.playingClient = client
    );

    // Handle changing player status
    this.gameService.getPlayerStatus().subscribe(status => {
      // Update user status
      let playerStatus = status.playerStatus;
      let userId = status.userId

      // If playerStatus is true, that means that player is ready
      for(let i = 0; i < this.users.length; i++){
        if(this.users[i].id == userId)
          this.users[i].status = (playerStatus) ? "Ready" : "Not Ready";
      }
    });

    // Handle what to show when game starts/ends
    this.gameService.getGameStartStatus().subscribe(showButton => {
      // Hide/Display ready button
      this.showReadyButton = showButton

      // Set player to not ready
      this.playerReady = false;

      // If we're hiding the button, that means the game is started.
      for (let i = 0; i < this.users.length; i++) {
        this.users[i].status = (showButton) ? "Not Ready" : "In Game";
      }
    });

  }

  getUser(): void {
    var userId = this.getRandomId();
    this.user = new User();
    this.user.name = "guest" + userId;
    this.user.id = userId;
    this.user.color = this.getRandomColor();
    this.user.status = "Not Ready";
  }

  goBack(): void {
    this.router.navigate(['/room']);
  }

  getRandomId() {
    return Math.floor(Math.random() * (696969)) + 1;
  }

  getRandomColor(){
    let values = "0123456789ABCDEF"
    let rgb = "#";
    for(let i = 0; i < 3; i++){
      rgb += values[Math.floor(Math.random()*16)];
    }
    console.log("rgb value: " + rgb);
    return rgb;
  }

  sendMessage() {
    if(this.msg){
      // Set the message text
      this.message.user = this.user;
      this.message.text = this.msg;
      this.message.src = "client";

      // Send the message out from what room
      this.gameService.sendMessage(this.message, this.game.id);

      // Clear message
      this.message.text = '';
      this.msg = '';
    }
  }

  scrollToBottom(): void {
    try{
      this.chatPanel.nativeElement.scrollTop = this.chatPanel.nativeElement.scrollHeight;
    } catch (err){

    }
  }

  // Toggle the boolean when selecting this button
  onReady(): void {
    // Toggle the user
    this.playerReady = !this.playerReady;

    // Display on client side faster that the game is ready
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].id == this.user.id)
        this.users[i].status = (this.playerReady) ? "Ready" : "Waiting...";
    }

    // Let the server know this user is ready
    this.gameService.sendReady(this.game.id, this.playerReady, this.user.id);
  }

}
