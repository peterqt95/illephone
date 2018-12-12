import { Component, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-username-dialog',
  templateUrl: './username-dialog.component.html',
  styleUrls: ['./username-dialog.component.css']
})
export class UsernameDialogComponent {

  usernameFormControl = new FormControl('', [Validators.required]);

  constructor(public dialogRef: MatDialogRef<UsernameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { 

    }
    
  public onSave(): void {
    this.dialogRef.close({
      username: this.data.username
    });
  }
}
