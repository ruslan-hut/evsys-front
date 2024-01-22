import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-login-firebase',
  templateUrl: './login-firebase.component.html',
  styleUrls: ['./login-firebase.component.css']
})
export class LoginFirebaseComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // const ui = new firebaseui.auth.AuthUI(firebase.auth());
    // ui.start('#firebaseui-auth-container', {
    //   signInOptions: [
    //     {
    //       provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
    //       signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD
    //     }
    //   ],
    //   // Other config options...
    // });
  }

}
