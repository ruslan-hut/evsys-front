import {Component, OnInit} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ErrorService} from "../../service/error.service";

@Component({
  selector: 'app-snack-bar',
  templateUrl: './snack-bar.component.html',
  styleUrls: ['./snack-bar.component.css']
})
export class SnackBarComponent implements OnInit {
  constructor(
    private snack: MatSnackBar,
    private errorService: ErrorService) {
  }
  openSnackBar(message: string, action: string){
    this.snack.open(message, action);
  }

  ngOnInit(): void {
    this.errorService.error$.subscribe(error => {
      this.openSnackBar(error, "Dismiss");
    })
  }
}
