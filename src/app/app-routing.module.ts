import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomManagerComponent } from './room-mgr/room-mgr.component';
import { GameComponent } from './game/game.component';
import { AppComponent } from './app.component';
import { HomepageComponent } from './homepage/homepage.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomepageComponent},
  { path: 'room', component: RoomManagerComponent },
  { path: 'room/:id', component: GameComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
