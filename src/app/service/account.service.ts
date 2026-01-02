import { Injectable } from '@angular/core';
import {User} from "../models/user";
import {BehaviorSubject, map, ReplaySubject} from "rxjs";
import { HttpClient } from "@angular/common/http";
import {Router} from "@angular/router";
import {environment} from "../../environments/environment";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {PaymentMethod} from "../models/payment-method";

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private userSubject = new BehaviorSubject<User|null>(null);
  public user$ = this.userSubject.asObservable();

  // Emits true when auth initialization is complete (user logged in or confirmed not logged in)
  private authReadySubject = new ReplaySubject<boolean>(1);
  public authReady$ = this.authReadySubject.asObservable();

  private token : string|null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.token = localStorage.getItem('token');
    if (environment.debug) {
      console.log("Loaded account service with token: ", this.token?.substring(0, 10), "; is local:", this.isLocalUser());
    }

    this.user$.subscribe(user => {
      if (user) {
        if (environment.debug) {
          console.log("User logged in: ", user.username);
        }
        if (user.token) {
          this.token = user.token;
          localStorage.setItem('token', this.token);
        }
      }
    })
  }

  userToken() : string|null {
    return this.token;
  }

  private isLocalUser() : boolean {
    if (!this.token) {
      return false;
    }
    return this.token.length === 32;
  }

  // called on app initialization, after loading Firebase service
  afterFirebaseLoad() {

    if (this.isLocalUser()) {
      this.onNewToken(this.token);
    } else {
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.updateFirebaseToken();
          setInterval(() => this.updateFirebaseToken(), 60*60*1000);
        } else {
          // No Firebase user and no local token - auth check complete, user not logged in
          this.authReadySubject.next(true);
        }
      })
    }

  }

  private onNewToken(token: string|null) {
    if (!token) {
      this.userSubject.next(null);
      this.authReadySubject.next(true);
      return
    }
    this.loginWithToken(token).subscribe({
      next: () => {
        this.authReadySubject.next(true);
      },
      error: () => {
        this.authReadySubject.next(true);
      }
    });
  }

  /**
   * Updates the authentication token for the current user.
   * Retrieves the ID token from Firebase and calls local authorization.
   */
  private updateFirebaseToken() {
    const auth = getAuth();
    auth.currentUser?.getIdToken().then((token) => {
      if (environment.debug) {
        console.log("Received token from Firebase");
      }
      this.onNewToken(token);
    })
  }

  public get userValue(): User|null {
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
      console.log("Reauthenticate: local user:", this.isLocalUser());
    }
    if (this.isLocalUser()) {
      this.logout();
    } else {
      this.updateFirebaseToken();
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
      auth.signOut().then(() => localStorage.removeItem('token'));
    } else {
      localStorage.removeItem('token');
    }
    this.token = null;
    this.userSubject.next(null);
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

  createUser(user: Partial<User>) {
    return this.http.post<User>(`${environment.apiUrl}/users/create`, user);
  }

  updateUser(username: string, user: Partial<User>) {
    return this.http.put<User>(`${environment.apiUrl}/users/update/${username}`, user);
  }

  deleteUser(username: string) {
    return this.http.delete<{success: boolean; message: string}>(`${environment.apiUrl}/users/delete/${username}`);
  }
}
