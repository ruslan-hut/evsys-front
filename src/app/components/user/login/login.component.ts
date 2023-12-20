import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AccountService} from "../../../service/account.service";
import {ErrorService} from "../../../service/error.service";
import {Router} from "@angular/router";
import {first} from "rxjs";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit{
  form: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private router : Router,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      this.errorService.handle("Invalid input");
      return;
    }
    this.loading = true;
    this.accountService.login(this.f.username.value, this.f.password.value)
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

  navigateTo(destination: string) {
    this.router.navigateByUrl(destination).then(r => {
        if (!r) {
          this.errorService.handle("Failed to navigate: "+destination)
        }
      }
    );
  }
}
