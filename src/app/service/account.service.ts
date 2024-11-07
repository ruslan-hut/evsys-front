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
      if (user && user.token) {
        if (environment.debug) {
          console.log("Call token update", user.username);
        }
        this.updateToken();
      }
    })
  }

  private updateToken() {
    const auth = getAuth();
    auth.currentUser?.getIdToken().then((token) => {
      if (environment.debug) {
        console.log("Received new token from Firebase");
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

  login(username: string, password: string) {
    return this.http.post<User>(`${environment.apiUrl}/users/authenticate`, {username, password})
      .pipe(map(user => {
        localStorage.setItem('user', JSON.stringify(user));
        if (user.token) {
          this.tokenSubject.next(user.token)
        }
        this.userSubject.next(user);
        return user;
      }));
  }

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
