import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoggerComponent} from "./components/logger/logger.component";
import {authGuard} from "./helpers/auth.guard";
import {LoginComponent} from "./components/login/login.component";
import {RegisterComponent} from "./components/register/register.component";
import {ChargepointListComponent} from "./components/chargepoint-list/chargepoint-list.component";
import {BankServiceComponent} from "./components/bank-service/bank-service.component";
import {PrivacyPolicyComponent} from "./components/privacy-policy/privacy-policy.component";

const routes: Routes = [
  {path: 'syslog', component: LoggerComponent, canActivate: [authGuard]},
  {path: 'points', component: ChargepointListComponent},
  {path: 'bank', component: BankServiceComponent},
  {path: 'privacy', component: PrivacyPolicyComponent},
  {path: 'account/login', component: LoginComponent},
  {path: 'account/register', component: RegisterComponent},
  {path: '', redirectTo: '/points', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
