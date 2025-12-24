import {AfterViewInit, Component, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import {AccountService} from "../../../service/account.service";
import {ErrorService} from "../../../service/error.service";
import {Router} from "@angular/router";
import {first} from "rxjs";
import {
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  getAuth
} from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import {MatDialog} from "@angular/material/dialog";
import {BasicDialogComponent} from "../../dialogs/basic/basic-dialog.component";
import {DialogData} from "../../../models/dialog-data";
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription, MatExpansionPanelActionRow } from '@angular/material/expansion';

import { MatCardFooter } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    standalone: true,
    imports: [MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription, MatCardFooter, MatProgressBar, MatExpansionPanelActionRow, MatButton, FormsModule, ReactiveFormsModule, MatFormField, MatInput]
})
export class LoginComponent implements OnInit, AfterViewInit{
  formUsername: FormGroup;
  formEmail: FormGroup;
  loading = false;
  submitted = false;

  private storedEmail = localStorage.getItem('emailForSignIn');

  constructor(
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private router : Router,
    private errorService: ErrorService,
    public dialog: MatDialog,
  ) {}

  ngAfterViewInit(): void {
    const auth = getAuth();
    if(isSignInWithEmailLink(auth, window.location.href)) {
      if (this.storedEmail == null) {
        this.errorService.handle("Failed to get email");
        return;
      }
      signInWithEmailLink(auth, this.storedEmail, window.location.href).then((result) => {
        result.user.getIdToken().then((token) => {
          this.signInWithToken(token);
        });
      })
        .catch((error) => {
          const errorMessage = error.message;
          this.errorService.handle(errorMessage);
          this.loading = false;
        });
    }
    const permission = localStorage.getItem('acceptedCookies')
    if (permission == null || permission != 'true') {
      this.showCookiesDialog();
    }
    }

  ngOnInit() {
    this.formEmail = this.formBuilder.group({
      email: ['', Validators.required]
    });
    this.formUsername = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    if (this.storedEmail) {
      this.formEmail.controls.email.setValue(this.storedEmail);
    }
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
          this.signInWithToken(token);
        });
      }).catch((error) => {
        const errorMessage = error.message;
        this.errorService.handle(errorMessage);
        this.loading = false;
    });
  }

  signInWithToken(token : string) {
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
  }

  onSubmitEmail() {
    this.submitted = true;
    if (this.formEmail.invalid) {
      this.errorService.handle("Invalid input");
      return;
    }
    this.loading = true;
    const email = this.formEmail.controls.email.value;
    localStorage.setItem('emailForSignIn', email);

    const actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be in the authorized domains list in the Firebase Console.
      url: 'https://wattbrews.me/account/login',
      // This must be true.
      handleCodeInApp: true,
      // iOS: {
      //   bundleId: 'com.example.ios'
      // },
      android: {
        packageName: 'energy.h2plt.evcharge',
        installApp: true,
        minimumVersion: '5'
      },
      dynamicLinkDomain: 'h2plt.page.link'
    };
    const auth = getAuth();
    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        this.showEmailSentDialog();
      })
      .catch((error) => {
        const errorMessage = error.message;
        this.errorService.handle(errorMessage);
        this.loading = false;
      });
  }

  showEmailSentDialog() {
    let dialogData: DialogData = {
      title: "Check inbox",
      content: "We've sent you an email with a link to sign in. Go to your inbox and click on the link to sign in.",
      buttonYes: "Ok",
      buttonNo: "",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loading = false;
    });
  }

  showCookiesDialog() {
    let dialogData: DialogData = {
      title: "Cookies",
      content: "This website uses cookies to improve your experience. By using this website, you agree with our " +
        "<a href=\"https://wattbrews.me/privacy\">Privacy Policy</a>.\n",
      buttonYes: "Ok",
      buttonNo: "",
      checkboxes: ["Accept Privacy Policy"]
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result == 'yes') {
        localStorage.setItem('acceptedCookies', 'true');
      }
      else {
        this.navigateTo('/privacy');
      }
    });
  }

  navigateTo(destination: string) {
    this.router.navigateByUrl(destination).then(r => {
        if (!r) {
          this.errorService.handle("Looks like you're already there!");
        }
      }
    );
  }
}
