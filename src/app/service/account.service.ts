import { Injectable } from '@angular/core';
import {User} from "../models/user";
import {BehaviorSubject, map, Observable} from "rxjs";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Router} from "@angular/router";
import {environment} from "../../environments/environment";
import {getAuth} from "firebase/auth";
import {initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";

interface KeyValue {
  Key: string;
  Value: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private userSubject: BehaviorSubject<User>;
  public user: Observable<User>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const headers = new HttpHeaders().set('skip-interceptor', 'true');
    this.http.get<KeyValue[]>(`${environment.apiUrl}${environment.config}firebase-web`, {headers}).subscribe((data) => {
      const config = data.reduce((obj: {}, item) => {
        // @ts-ignore
        obj[item.Key] = item.Value;
        return obj;
      }, {});
      const app = initializeApp(config);
      getAnalytics(app);
      //this.checkUserState();
    });
    // @ts-ignore
    this.userSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('user')));
    this.user = this.userSubject.asObservable();
    // onAuthStateChanged(this.auth, (user) => {
    //   if (user) {
    //     console.log("account service: user is signed in");
    //     user.getIdToken().then((token) => {
    //       this.loginWithToken(token)
    //     });
    //   } else {
    //     console.log("User is signed out");
    //   }}
    // )
  }

  public get userValue(): User {
    return this.userSubject.value;
  }

  login(username: string, password: string) {
    return this.http.post<User>(`${environment.apiUrl}/users/authenticate`, {username, password})
      .pipe(map(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.userSubject.next(user);
        return user;
      }));
  }

  loginWithToken(token: string) {
    return this.login('', token)
  }

  register(user: User) {
    return this.http.post(`${environment.apiUrl}/users/register`, user);
  }

  logout() {
    const auth = getAuth();
    if (auth.currentUser) {
      auth.signOut().then(() => localStorage.removeItem('user'));
    } else {
      localStorage.removeItem('user');
    }
    //localStorage.removeItem('user');
    // @ts-ignore
    this.userSubject.next(null);
    this.router.navigate(['/account/login']);
  }

  getAll() {
    return this.http.get<User[]>(`${environment.apiUrl}/users/list`);
  }

  getUserInfo(username: string | null) {
    return this.http.get<User>(`${environment.apiUrl}/users/info/${username}`);
  }
}
