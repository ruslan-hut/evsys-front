import {Component, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import {AccountService} from "../../../service/account.service";
import {Router} from "@angular/router";
import {ErrorService} from "../../../service/error.service";
import {first} from "rxjs";
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatCardFooter } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css'],
    standalone: true,
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, FormsModule, ReactiveFormsModule, MatFormField, MatInput, MatCardActions, MatButton, MatCardFooter, MatProgressBar]
})
export class RegisterComponent implements OnInit{
  form: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private router : Router,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      token: ['', Validators.required],
    });
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      this.errorService.handle("Invalid input");
      return;
    }
    this.loading = true;
    this.accountService.register(this.form.value)
      .pipe(first())
      .subscribe({
        next: () => {
          const returnUrl = '/account/login';
          this.navigateTo(returnUrl);
        },
        error: error => {
          const status = error.status;
          if (status) {
            if (status === 400) {
              this.errorService.handle("Username already exists");
            } else {
              this.errorService.handle("Failed to register, unknown error (" + status + ")");
            }
          } else {
            this.errorService.handle("Failed to register, please try again later");
          }
          this.loading = false;
        }
      });
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
