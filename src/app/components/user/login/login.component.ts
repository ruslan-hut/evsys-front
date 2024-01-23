import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AccountService} from "../../../service/account.service";
import {ErrorService} from "../../../service/error.service";
import {Router} from "@angular/router";
import {first} from "rxjs";
import { getAuth, signInWithPopup } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit{
  formUsername: FormGroup;
  formEmail: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private router : Router,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.formEmail = this.formBuilder.group({
      email: ['', Validators.required]
    });
    this.formUsername = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  };

  get fu() { return this.formUsername.controls; }

  onSubmitUsername() {
    this.submitted = true;
    if (this.formUsername.invalid) {
      this.errorService.handle("Invalid input");
      return;
    }
    this.loading = true;
    this.accountService.login(this.fu.username.value, this.fu.password.value)
      .pipe(first())
      .subscribe({
        next: () => {
          const returnUrl = '/';
          this.navigateTo(returnUrl);
        },
        error: error => {
          this.errorService.handle(error.statusText);
          this.loading = false;
        }
      });
  }

  onGoogleAccountSignIn() {
    this.loading = true;
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        if (token == null) {
          this.errorService.handle("Failed to get Google Access Token");
          return;
        }
        result.user.getIdToken().then((token) => {
          this.accountService.loginWithToken(token).pipe().subscribe({
            next: () => {
              const returnUrl = '/';
              this.navigateTo(returnUrl);
            },
            error: error => {
              this.errorService.handle(error.statusText);
              this.loading = false;
            }
          });
        });
      }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        this.errorService.handle(`${errorCode} ${errorMessage}`);
        this.loading = false;
        //const email = error.customData.email;
        //const credential = GoogleAuthProvider.credentialFromError(error);
    });
  }

  onSubmitEmail() {
    this.submitted = true;
    if (this.formEmail.invalid) {
      this.errorService.handle("Invalid input");
      return;
    }
    this.loading = true;

  }

  navigateTo(destination: string) {
    this.router.navigateByUrl(destination).then(r => {
        if (!r) {
          this.errorService.handle("Failed to navigate: "+destination)
        }
      }
    );
  }
}
