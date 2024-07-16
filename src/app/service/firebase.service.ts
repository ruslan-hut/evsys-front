import { Injectable } from '@angular/core';
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

  loadConfig(): void {
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
  }

}
