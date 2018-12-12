import { Injectable } from '@angular/core';
import { Game } from './game';
import { Category } from './category';
import { GAMES } from './game-rooms';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/switchMap';

import * as io from 'socket.io-client';
import { Message } from './message';
import { User } from './user';
import { IllephoneBoard } from './illephoneBoard';


import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

/*TODO:
  Maybe we can refactor this service later into two separate ones to -control creation of games- and -keep track of messages-.
  Might be beneficial to separate concerns and not tightly couple these two things together.
  We can revisit this at another time. */
@Injectable()
export class GameService {

  constructor(
    private http: HttpClient
  ) { }

  private gamesUrl = '/api/rooms'; // relative URL to get and create rooms
  private categoriesUrl = '/api/categories'; // relative URL to get categories
  private socket;
  messages: Message[][] = [];
  users: User[][] = [];

  // Return user list
  getUserList(roomId: number) {
    return this.users[roomId];
  }

  // Socket initializer
  createSocket(id: number, user: User): Observable<string> {
    // Create the socket
    this.socket = io();
    const observable = new Observable<string>(observer => {

      this.socket.on('connect', () => {
        // Connected, join to a specific room
        this.socket.emit('join', id, user);
        observer.next(this.socket.id);
      });
      
    });
    return observable;
  }

  getSocket() {
    return this.socket;
  }

  // Listen for messages
  getMessages(id: number): Observable<Message[]> {
    const observable = new Observable<Message[]>(observer => {
      this.socket.on('message', (message) => {
        if (this.messages[id] === undefined) {
          this.messages[id] = [];
        }
        message = <Message>message;
        this.messages[id].push(message);
        observer.next(this.messages[id]);
      });

      // On destroy
      return () => {
        this.socket.disconnect();
        this.messages[id] = [];
      };
    });
    return observable;
  }
  
  // Get users
  getUsers(id:number): Observable<any[]> {
    const observable = new Observable<User[]>(observer => {
      var that = this;
      this.socket.on('update-users', (roomUsers) => {
        // Create users array at index if one doesn't exist
        that.users[id] = [];
        // Assign object of keys:username to users array at id
        let roomClients = Object.keys(roomUsers); // Array of Client IDs keys clientId:username
        // Transform roomUser object into a user array
        for(let i = 0; i < roomClients.length; i++){
          that.users[id].push(<User>roomUsers[roomClients[i]]);
        }
        observer.next(that.users[id]);
      });

      return () => {
        this.socket.disconnect();
        that.users[id] = [];
      }
    });
    return observable;
  }

  // Listen for game state change, it will contain our board information and state
  getCurrentState(id: number): Observable<number> {
    const observable = new Observable<number>(observer => {
      this.socket.on('gameState', function (state) {
        observer.next(state);
      });
    });

    return observable;
  }


  // Send messages
  sendMessage(message: Message, id: number) {
    this.socket.emit('add-message', { 
      message: message,
      room: id} );
    }

  getGames(): Observable<Game[]> {
    return this.http.get<Game[]>(this.gamesUrl);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.categoriesUrl);
  }

  getGame(id: number): Observable<Game> {
    return this.http.get<Game>(this.gamesUrl, {
      params: new HttpParams().set('id', id.toString())
    });
  }

  createGame(roomProps): Observable<Game> {
    // Auto assign id by incrementing until it is not found in array
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http.post<Game>(this.gamesUrl, roomProps, httpOptions);
  }

  // ToDo (might move this into a new service for canvas)
  mouseDrawLocation(id: number, canvasElement: HTMLCanvasElement): Observable<any> {
    return Observable.fromEvent(canvasElement, 'mousedown')
      .switchMap((e) => {
        return Observable.fromEvent(canvasElement, 'mousemove')
          .takeUntil(Observable.fromEvent(canvasElement, 'mouseup'))
          .pairwise()
      });
  }

  // Send the drawing to the server
  sendDrawing(roomId: number, image: string) {
    this.socket.emit('clientDrawing', {
      roomId: roomId,
      clientId: this.socket.id,
      image: image
    });
  }

  // Send the guess to the server
  sendGuess(roomId: number, guess: string) {
    this.socket.emit('clientGuess', {
      roomId: roomId,
      clientId: this.socket.id,
      guess: guess
    });
  }

  // Listen for board change
  getNewBoard(): Observable<IllephoneBoard> {
    const observable = new Observable<IllephoneBoard>(observer => {
      this.socket.on('newBoard', function (board) {
        console.log(board);
        observer.next(board);
      });
    });

    return observable;
  }

  // Listen for time change
  getTime(): Observable<string> {
    const observable = new Observable<string>(observer => {
      this.socket.on("timer-tick", function(time){
        observer.next(time);
      })
    });

    return observable;
  }

  // Send ready signal when client selects ready button
  sendReady(roomId: number, ready: boolean, userId: number) {
    this.socket.emit('client-ready', roomId, ready, userId);    
  }

  // When a game starts, hide the ready signal
  getGameStartStatus(): Observable<boolean> {
    const observable = new Observable<boolean>(observer => {
      this.socket.on('toggle-game-start', function (showButton) {
        observer.next(showButton);
      });
    });

    return observable;
  }

  // Update the player status
  getPlayerStatus(): Observable<{playerStatus: boolean, userId: number}>{
    const observable = new Observable<{ playerStatus: boolean, userId: number }>(observer => {
      this.socket.on('update-user-ready', function (playerStatus, userId) {
        observer.next({playerStatus, userId});
      });
    });

    return observable;
  }

  // Send judge phase values
  sendJudgeValues(roomId: number, imageClientId: string, guessClientId: string){
    this.socket.emit('client-judge', {
      roomId: roomId, 
      imageClientId: imageClientId, 
      guessClientId: guessClientId
    });    
  }

  // Update judge scores on the board
  getJudgeValues(): Observable<{ clientIds: Array<string>, clientValues: Array<number> }> {
    const observable = new Observable<{ clientIds: Array<string>, clientValues: Array<number> }>(observer => {
      this.socket.on('update-scores', function (clientIds, clientValues) {
        observer.next({ clientIds, clientValues });
      });
    });

    return observable;
  }

  // Upate winner id on the board
  getWinner(roomId: number): Observable<string> {
    const observable = new Observable<string>(observer => {
      this.socket.on('update-winner', function (clientId) {
        observer.next(clientId);
      });
    });

    return observable;
  }

  // Save client id to name mapping
  getClientIdToNameMapping(roomId: number): Observable<Map<string, User>> {
    const observable = new Observable<Map<string, User>> (observer => {
      this.socket.on('save-clientId-to-name', function (clientIdsToName) {
        observer.next(clientIdsToName);
      });
    });

    return observable;
  }

}
