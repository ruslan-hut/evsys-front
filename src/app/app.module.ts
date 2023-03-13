import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {ChargepointComponent} from "./components/chargepoint/chargepoint.component";
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import { GlobalErrorComponent } from './components/global-error/global-error.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { FilerChargepointsPipe } from './pipes/filer-chargepoints.pipe';
import { ChargepointFormComponent } from './components/chargepoint-form/chargepoint-form.component';
import { ModalComponent } from './components/modal/modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoggerComponent } from './components/logger/logger.component';

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
import { SnackBarComponent } from './components/snack-bar/snack-bar.component';
import { LoginComponent } from './components/login/login.component';
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {TokenInterceptor} from "./helpers/token.interceptor";
import {ErrorInterceptor} from "./helpers/error.interceptor";

@NgModule({
  declarations: [
    AppComponent,
    ChargepointComponent,
    GlobalErrorComponent,
    FilerChargepointsPipe,
    ChargepointFormComponent,
    ModalComponent,
    LoggerComponent,
    SnackBarComponent,
    LoginComponent
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
        MatProgressBarModule
    ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
