import { Component, OnInit } from '@angular/core';
import { Game } from '../game';
import { GAMES } from '../game-rooms';
import { GameService } from '../game.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material';
import { MatDialog, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-room',
  templateUrl: './room-mgr.component.html',
  styleUrls: ['./room-mgr.component.css']
})
export class RoomManagerComponent implements OnInit {

  games: Game[];
  displayedColumns = ['roomId', 'roomName', 'roomNumPlayers', 'roomTimeLimit', 'roomPassword'];

  constructor(
    private router : Router,
    private gameService: GameService,
    private location: Location,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.getGames();
  }

  getGames(): void {
    this.gameService.getGames().subscribe(games => this.games = games);
  }

  goBack() : void {
    this.router.navigate(['/']);
  }

  // Controls whether or not a user can join a room, must meet certain criteria
  joinGame(game, error): void{
    if(game.maxPlayers - game.currentNumPlayers > 0){
      this.router.navigate(['/room/' + game.id])
    }else{
      let dialogRef = this.dialog.open(error, {
        width: '500px',
      });
    }
  }
}
