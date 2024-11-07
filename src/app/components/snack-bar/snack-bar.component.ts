import {Component, OnInit} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ErrorService} from "../../service/error.service";
import {AccountService} from "../../service/account.service";

@Component({
  selector: 'app-snack-bar',
  templateUrl: './snack-bar.component.html',
  styleUrls: ['./snack-bar.component.css']
})
export class SnackBarComponent implements OnInit {
  constructor(
    private snack: MatSnackBar,
    private accountService: AccountService,
    private errorService: ErrorService) {
  }
  openSnackBar(message: string, action: string){
    this.snack.open(message, action, {duration: 5000});
  }

  ngOnInit(): void {
    this.errorService.error$.subscribe(error => {
      if (error == "Not authorized") {
        this.accountService.reAuthenticate();
      } else {
        this.openSnackBar(error, "Dismiss");
      }
    })
  }
}
