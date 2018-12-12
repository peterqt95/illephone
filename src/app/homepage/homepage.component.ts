import { Component, OnInit} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { GameService } from '../game.service';
import { Router } from '@angular/router'
import { Category } from '../category';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent {
  /* TODO: Have to figure out how to validate inputs and display
    error messages on the UI when creating a room. Would like to maybe
    disable the Create button until all input fields are valid.
  */


  // Options for setting time limit
  public timeOptions: any[];

  // Options for categories
  public categories: Category[];

  // Properties of a game/room
  public roomProps: any;
  private id: number;

  public title: string = 'Illephone';
  constructor(public dialog: MatDialog, public gameService: GameService, public router: Router) { }

  open(content) {
    let dialogRef = this.dialog.open(content, {
      width: '500px',
    });
  }

  // Creates a game room with the properties in the form modal and navigates to room
  createGame(roomProps: any): void{
    this.gameService.getGames().subscribe(
      games => {
        // Find next available id
        let id = 1;
        while(games.findIndex(game => {
          return game.id === id;
        }) != -1){
          id++;
        }
        roomProps.id = id;
        this.gameService.createGame(roomProps).subscribe(
          game => {
            this.router.navigate(['room', game.id]);
            this.setDefaultRoomProperties();
          }
        )
      }
    );
  }

  // Reset room properties to intial values
  setDefaultRoomProperties(){
    // Initialize default values for room properties
    this.timeOptions = [
      { value: 15, time: '0:15' },
      { value: 30, time: '0:30' },
      { value: 45, time: '0:45' },
      { value: 60, time: '1:00' }
    ];

    this.roomProps = {
      name: '',
      maxPlayers: 8,
      timeLimit: this.timeOptions[1].value,
      category: this.categories[0].name,
      password: '',
      currentNumPlayers: 0
    };
  }

  ngOnInit(){
    // Grab the room property values
    this.getCategories();
  }

  getCategories(): void {
    this.gameService.getCategories().subscribe(categories => {
      this.categories = categories;
    }, 
    err => console.log(err),
    () => {
      this.setDefaultRoomProperties();
    });
  }
}
