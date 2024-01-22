import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { FilerChargepointsPipe } from './pipes/filer-chargepoints.pipe';

import { ChargepointFormComponent } from './components/chargepoint-form/chargepoint-form.component';
import {ChargepointComponent} from "./components/chargepoint/chargepoint.component";
import {ConnectorComponent} from "./components/connector/connector.component";
import { GlobalErrorComponent } from './components/global-error/global-error.component';
import { ModalComponent } from './components/modal/modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoggerComponent } from './components/logs/logger/logger.component';
import { RegisterComponent } from './components/user/register/register.component';
import { SnackBarComponent } from './components/snack-bar/snack-bar.component';
import { LoginComponent } from './components/user/login/login.component';
import {UsersComponent} from "./components/user/users/users.component";
import {PaylogComponent} from "./components/logs/paylog/paylog.component";
import{ConnectorFormComponent} from "./components/connector-form/connector-form.component";
import{BacklogComponent} from "./components/logs/backlog/backlog.component";
import {ChargepointInfoComponent} from "./components/chargepoint-info/chargepoint-info.component";
import {BasicDialogComponent} from "./components/dialogs/basic/basic-dialog.component";
import {ConnectorInfoComponent} from "./components/connector-info/connector-info.component";
import {TransactionInfoComponent} from "./components/transaction-info/transaction-info.component";

import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {TokenInterceptor} from "./helpers/token.interceptor";
import {ErrorInterceptor} from "./helpers/error.interceptor";
import {MatDividerModule} from "@angular/material/divider";
import { ChargepointListComponent } from './components/chargepoint-list/chargepoint-list.component';
import { HeaderComponent } from './components/ui/header/header.component';
import { FooterComponent } from './components/ui/footer/footer.component';
import { BankServiceComponent } from './components/pages/bank-service/bank-service.component';
import { PrivacyPolicyComponent } from './components/pages/privacy-policy/privacy-policy.component';
import { TermsComponent } from './components/pages/terms/terms.component';
import { CompanyInfoComponent } from './components/pages/company-info/company-info.component';
import {MatExpansionModule} from "@angular/material/expansion";
import {MatDialogModule} from "@angular/material/dialog";
import { UserInfoComponent } from './components/user/user-info/user-info.component';
import { UserEditComponent } from './components/user/user-edit/user-edit.component';
import {MatListModule} from "@angular/material/list";
import { LoginFirebaseComponent } from './components/user/login-firebase/login-firebase.component';

@NgModule({
  declarations: [
    AppComponent,
    ChargepointComponent,
    ConnectorComponent,
    ConnectorFormComponent,
    GlobalErrorComponent,
    FilerChargepointsPipe,
    ChargepointFormComponent,
    ModalComponent,
    LoggerComponent,
    SnackBarComponent,
    LoginComponent,
    RegisterComponent,
    ChargepointListComponent,
    HeaderComponent,
    FooterComponent,
    BankServiceComponent,
    PrivacyPolicyComponent,
    UsersComponent,
    PaylogComponent,
    BacklogComponent,
    TermsComponent,
    CompanyInfoComponent,
    ChargepointInfoComponent,
    BasicDialogComponent,
    ConnectorInfoComponent,
    TransactionInfoComponent,
    UserInfoComponent,
    UserEditComponent,
    LoginFirebaseComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatSlideToggleModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatSnackBarModule,
    MatCardModule,
    MatProgressBarModule,
    MatDividerModule,
    MatExpansionModule,
    MatDialogModule,
    MatListModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
