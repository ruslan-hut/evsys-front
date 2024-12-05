import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoggerComponent} from "./components/logs/logger/logger.component";
import {authGuard} from "./helpers/auth.guard";
import {LoginComponent} from "./components/user/login/login.component";
import {RegisterComponent} from "./components/user/register/register.component";
import {ChargepointListComponent} from "./components/chargepoint-list/chargepoint-list.component";
import {BankServiceComponent} from "./components/pages/bank-service/bank-service.component";
import {PrivacyPolicyComponent} from "./components/pages/privacy-policy/privacy-policy.component";
import {ChargepointFormComponent} from "./components/chargepoint-form/chargepoint-form.component";
import {UsersComponent} from "./components/user/users/users.component";
import {BacklogComponent} from "./components/logs/backlog/backlog.component";
import {PaylogComponent} from "./components/logs/paylog/paylog.component";
import {TermsComponent} from "./components/pages/terms/terms.component";
import {CompanyInfoComponent} from "./components/pages/company-info/company-info.component";
import {ChargepointInfoComponent} from "./components/chargepoint-info/chargepoint-info.component";
import {UserInfoComponent} from "./components/user/user-info/user-info.component";
import {UserEditComponent} from "./components/user/user-edit/user-edit.component";
import {PromoListComponent} from "./components/promo-list/promo-list.component";
import {PromoComponent} from "./components/promo/promo.component";
import {ChargepointConfigComponent} from "./components/chargepoint-config/chargepoint-config.component";
import {UserProfileComponent} from "./components/user-profile/user-profile.component";
import {PaymentMethodListComponent} from "./components/user-profile/payment-method-list/payment-method-list.component";
import {ChargepointScreenComponent} from "./components/chargepoint-screen/chargepoint-screen.component";
import {
  TransactionScreenComponent
} from "./components/transaction-screen/transaction-screen.component";
import {StatisticComponent} from "./components/statistic/statistic.component";

const routes: Routes = [
  {path: 'log/system', component: LoggerComponent, canActivate: [authGuard]},
  {path: 'log/backend', component: BacklogComponent, canActivate: [authGuard]},
  {path: 'log/pay', component: PaylogComponent, canActivate: [authGuard]},
  {path: 'users', component: UsersComponent, canActivate: [authGuard]},
  {path: 'users/info/:username', component: UserInfoComponent, canActivate: [authGuard]},
  {path: 'users/edit/:username', component: UserEditComponent, canActivate: [authGuard]},
  {path: 'points', component: ChargepointListComponent},
  {path: 'bank', component: BankServiceComponent},
  {path: 'privacy/:lang', component: PrivacyPolicyComponent},
  {path: 'privacy', component: PrivacyPolicyComponent}, // default to english, legacy
  {path: 'terms/:lang', component: TermsComponent},
  {path: 'company-info/:lang', component: CompanyInfoComponent},
  {path: 'account/login', component: LoginComponent},
  {path: 'account/register', component: RegisterComponent},
  {path: '', redirectTo: '/points', pathMatch: 'full'},
  {path: 'points-config', component: ChargepointConfigComponent, canActivate: [authGuard]},
  {path: 'points-form', component: ChargepointFormComponent, canActivate: [authGuard]},
  {path: 'points-info', component: ChargepointInfoComponent},
  {path: 'promo', component: PromoListComponent},
  {path: 'promo-point', component: PromoComponent},
  {path: 'user-profile', component: UserProfileComponent},
  {path: 'payment-methods', component: PaymentMethodListComponent},
  {path: 'new-transactions', component: ChargepointScreenComponent},
  {path: 'current-transaction', component: TransactionScreenComponent},
  {path: 'statistic', component: StatisticComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
