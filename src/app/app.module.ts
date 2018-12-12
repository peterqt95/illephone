import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatFormFieldModule, MatInputModule } from '@angular/material';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';

import { AppComponent } from './app.component';
import { RoomManagerComponent } from './room-mgr/room-mgr.component';
import { AppRoutingModule } from './/app-routing.module';
import { GameComponent } from './game/game.component';
import { GameService } from './game.service';
import { UsernameDialogComponent } from './username-dialog/username-dialog.component';
import { HomepageComponent } from './homepage/homepage.component';
import { CanvasComponent } from './canvas/canvas.component';
import { JudgeWindowComponent } from './judge-window/judge-window.component';


@NgModule({
  declarations: [
    AppComponent,
    RoomManagerComponent,
    GameComponent,
    UsernameDialogComponent,
    HomepageComponent,
    CanvasComponent,
    JudgeWindowComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatDividerModule
  ],
  providers: [GameService],
  bootstrap: [
    AppComponent
  ],
  entryComponents: [UsernameDialogComponent]
})
export class AppModule { }
