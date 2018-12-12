import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { IllephoneBoard } from '../illephoneBoard';
import { MatDialog, MatDialogRef } from '@angular/material';

@Component({
  selector: 'judge-window',
  templateUrl: './judge-window.component.html',
  styleUrls: ['./judge-window.component.css']
})
export class JudgeWindowComponent implements OnInit {

  // Input for our modal window
  @Input() illephoneBoard: IllephoneBoard;

  imageAndGuessIndex: number; // Index for current image + guess
  currentImage; // The current image
  currentGuess: string; // The current guess
  currentImageSelected: boolean; // If image is selected
  currentGuessSelected: boolean; // If guess is selected
  selectedImageIndex: number; // Index of selected image
  selectedGuessIndex: number; // Index of selected image

  test: Array<{imgSrc: string, guess: string}>; // Mock Data for testing

  constructor(public dialog: MatDialog) { 
    this.imageAndGuessIndex = 0;

    // Default selected images as unselected
    this.selectedImageIndex = -1;
    this.selectedGuessIndex = -1;
  }

  open(content) {
    let dialogRef = this.dialog.open(content, {
      width: '500px'
      // disableClose: true // Enable if we want to leave the modal window to not close
    });
  }

  ngOnInit(){
  }

  // Displays the first board information in the set of boards
  displayImageAndGuess(){

    // Check if image/guess are selected 
    this.checkImageSelected();
    this.checkGuessSelected();

    // Wait for image to load
    let image = new Image();
    image.src = this.illephoneBoard.image[this.imageAndGuessIndex];
    image.onload = () => {
      // Once the image is loaded, display both the image and the associated guess
      this.currentImage = image;
      this.currentGuess = this.illephoneBoard.guess[this.imageAndGuessIndex + 1];
    }
  }

  // Navigate to either the next or previous image in our set
  nextBoardDisplay(isForward: boolean){
    this.imageAndGuessIndex += (isForward) ? 1 : -1;
    // Force last index if negative
    if(this.imageAndGuessIndex < 0) {
      this.imageAndGuessIndex = this.illephoneBoard.image.length -1;
    }
    this.imageAndGuessIndex %= this.illephoneBoard.image.length;
    this.displayImageAndGuess();
  }

  // This function will check if the current image is selected
  checkImageSelected() {
    this.currentImageSelected = this.selectedImageIndex == this.imageAndGuessIndex;
  }

  // This function wil lcheck if the current guess is selected
  checkGuessSelected() {
    this.currentGuessSelected = this.selectedGuessIndex == this.imageAndGuessIndex;    
  }

  // Store current index of image
  selectImage() {
    this.selectedImageIndex = this.imageAndGuessIndex;
    this.checkImageSelected();
  }

  // Store current index of guess
  selectGuess() {
    this.selectedGuessIndex = this.imageAndGuessIndex;
    this.checkGuessSelected();
  }
}
