import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoggerComponent} from "./components/logger/logger.component";
import {authGuard} from "./helpers/auth.guard";
import {LoginComponent} from "./components/login/login.component";

const routes: Routes = [
  {path: 'syslog', component: LoggerComponent, canActivate: [authGuard]},
  {path: 'account/login', component: LoginComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
