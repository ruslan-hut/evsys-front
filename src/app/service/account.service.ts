import { Injectable } from '@angular/core';
import {User} from "../models/user";
import {BehaviorSubject, map, Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {environment} from "../../environments/environment";
import {getAuth, onAuthStateChanged} from "firebase/auth";

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private userSubject: BehaviorSubject<User>;
  public user: Observable<User>;
  private tokenSubject = new BehaviorSubject<string|null>(null);
  public token$ = this.tokenSubject.asObservable();
  private currentToken: string|null = null;

  private authState = new BehaviorSubject<boolean>(false);
  authState$ = this.authState.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // @ts-ignore
    this.userSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('user')));
    this.user = this.userSubject.asObservable();
  }

  afterFirebaseLoad() {
    this.initTokenRefresh();
  }

  private initTokenRefresh() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.updateToken();
        setInterval(() => this.updateToken(), 60*60*1000);
      }
    })
  }

  private updateToken() {
    const auth = getAuth();
    auth.currentUser?.getIdToken().then((token) => {
      this.currentToken = token;
      this.tokenSubject.next(token)
      this.authState.next(true)
    })
  }

  public get userValue(): User {
    return this.userSubject.value;
  }

  public userToken(): string|null {
    return this.currentToken;
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
    return this.login("", token);
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
