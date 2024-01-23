import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {FirebaseApp,initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";

interface KeyValue {
  Key: string;
  Value: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private app: FirebaseApp;

  constructor(
    private http: HttpClient,
  ) { }

  loadConfig() {
    const headers = new HttpHeaders().set('skip-interceptor', 'true');
    return this.http.get<KeyValue[]>(`${environment.apiUrl}${environment.config}firebase-web`, {headers}).pipe().forEach((data) => {
      const config = data.reduce((obj: {}, item) => {
        // @ts-ignore
        obj[item.Key] = item.Value;
        return obj;
      }, {});
        this.app = initializeApp(config);
        //this.auth = getAuth(this.app);
        getAnalytics(this.app);
      }
    )
  }

}
