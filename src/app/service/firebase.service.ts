import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {environment} from "../../environments/environment";
import {FirebaseApp,initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";
import {getAuth} from "firebase/auth";
import {AccountService} from "./account.service";

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private app: FirebaseApp;

  constructor(
    private accountService: AccountService,
  ) { }

  loadConfig(): Promise<boolean> {
    const config = environment.firebaseConfig;

    // Initialize Firebase with the config
    this.app = initializeApp(config);
    if (environment.debug) {
      console.log("Firebase service loaded; project", config.projectId);
    }

    // Initialize Firebase Auth and Analytics
    getAuth(this.app);
    getAnalytics(this.app);

    // Notify the account service that Firebase has been loaded
    this.accountService.afterFirebaseLoad();

    // Wait for auth to be ready before completing initialization
    // This ensures user state is resolved before the app starts routing
    return firstValueFrom(this.accountService.authReady$);
  }

}
