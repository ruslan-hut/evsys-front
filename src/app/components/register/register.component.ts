import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AccountService} from "../../service/account.service";
import {Router} from "@angular/router";
import {ErrorService} from "../../service/error.service";
import {first} from "rxjs";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
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
