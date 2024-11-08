import { Injectable } from '@angular/core';
import {User} from "../models/user";
import {BehaviorSubject, map, Observable} from "rxjs";
import { HttpClient } from "@angular/common/http";
import {Router} from "@angular/router";
import {environment} from "../../environments/environment";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {PaymentMethod} from "../models/payment-method";

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private userSubject: BehaviorSubject<User>;
  public user: Observable<User>;
  private tokenSubject = new BehaviorSubject<string|null>(null);
  public token$ = this.tokenSubject.asObservable();

  private authState = new BehaviorSubject<boolean>(false);
  authState$ = this.authState.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // @ts-ignore
    const localUser = JSON.parse(localStorage.getItem('user'))
    this.userSubject = new BehaviorSubject<User>(localUser);
    this.user = this.userSubject.asObservable();
  }

  userToken() : string|null {
    return this.tokenSubject.value
  }

  // called on app initialization, after loading Firebase service
  afterFirebaseLoad() {
    const auth = getAuth();

    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.updateToken();
        setInterval(() => this.updateToken(), 60*60*1000);
      }
    })

    // listen for user data loading and update token
    this.user.subscribe(user => {
      if (user) {
        if (auth.currentUser) { // firebase user
          if (environment.debug) {
            console.log("Call Firebase token update", user.username);
          }
          this.updateToken();
        } else if (user.token) { // local user
          if (environment.debug) {
            console.log("Authenticate with stored token", user.username, ">>", user.token.substring(0, 5));
          }
          this.tokenSubject.next(user.token);
          this.authState.next(true);
        } else { // no token for local user
          this.logout();
        }
      }
    })
  }

  /**
   * Updates the authentication token for the current user.
   * Retrieves the ID token from Firebase and updates the tokenSubject and authState.
   */
  private updateToken() {
    const auth = getAuth();
    auth.currentUser?.getIdToken().then((token) => {
      if (environment.debug) {
        console.log("Received token from Firebase");
      }
      this.tokenSubject.next(token)
      this.authState.next(true)
    })
  }

  public get userValue(): User{
    return this.userSubject?.value;
  }

  public get isAdmin(): boolean {
    return this.userValue?.role === environment.admin;
  }

  public get isOperator(): boolean {
    return this.userValue?.role === environment.operator;
  }

  /**
   * Re-authenticates the user.
   * If the user is authenticated by Firebase, updates the authentication token.
   * If the user is authenticated by local API, logs the user out.
   */
  reAuthenticate() {
    if (environment.debug) {
      console.log("Reauthenticate called");
    }
    const auth = getAuth();
    if (auth.currentUser) {
      this.updateToken();
    } else {
      this.logout();
    }
  }

  /**
   * Local API authentication.
   * Authenticates the user with the provided username and password.
   * Sends a POST request to the authentication endpoint and updates the user state.
   *
   * @param username - The username of the user.
   * @param password - The password of the user.
   * @returns An Observable of the authenticated user.
   */
  login(username: string, password: string) {
    return this.http.post<User>(`${environment.apiUrl}/users/authenticate`, {username, password})
      .pipe(map(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.userSubject.next(user);
        return user;
      }));
  }

  /**
   * Local API authentication with token.
   *
   * @param token - The token of the user.
   * @returns An Observable of the authenticated user.
   */
  loginWithToken(token: string) {
    return this.login("", token)
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
    this.tokenSubject.next(null);
    this.router.navigate(['/account/login']).then(() => {});
  }

  getAll() {
    return this.http.get<User[]>(`${environment.apiUrl}/users/list`);
  }

  getUserInfo(username: string | null) {
    return this.http.get<User>(`${environment.apiUrl}/users/info/${username}`);
  }

  updatePaymentMethod(paymentMethod: PaymentMethod) {
    return this.http.post<PaymentMethod>(`${environment.apiUrl}/payment/update`, paymentMethod);
  }

  deletePaymentMethod(paymentMethod: PaymentMethod) {
    return this.http.post<PaymentMethod>(`${environment.apiUrl}/payment/delete/`, paymentMethod);
  }
}
