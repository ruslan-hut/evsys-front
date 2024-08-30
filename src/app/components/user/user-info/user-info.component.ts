import {Component, Inject, OnInit, Optional} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AccountService} from "../../../service/account.service";
import {User} from "../../../models/user";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {BasicDialogComponent} from "../../dialogs/basic/basic-dialog.component";
import {DataObject, SimpleDataObject} from "../../../models/data-object";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.css']
})
export class UserInfoComponent implements OnInit {
  user: User;
  userInfo: DataObject[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private account: AccountService,
    @Optional() public dialogRef?: MatDialogRef<BasicDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: string,
  ) {
    if (data) {
      this.loadUserData(data)
    }
  }

  makeUserInfo(user: User) {
    this.userInfo = Object.keys(user).map(key => {
      // @ts-ignore
      const value = user[key];
      if (this.isArray(value)) {
        return {field: key, value: this.mapToSimpleDataObject(value)}
      } else {
        return {field: key, value: value}
      }
    });
  }

  mapToSimpleDataObject(value: any): SimpleDataObject[] | null {
    if (this.isArray(value)) {
      return value.map((item: any) => {
          return Object.keys(item).map(key => {
            // @ts-ignore
            return {field: key, value: item[key]}
          });
      });
    }
    return null;
  }

  getArray(value: any): SimpleDataObject[] | null {
    if (this.isArray(value)) {
      return value;
    } else {
      return null;
    }
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  loadUserData(username: string) {
    this.account.getUserInfo(username).subscribe(
      data => {
        this.user = data;
        this.makeUserInfo(data)
        if (environment.debug) {
          console.log(`User info loaded`, data);
        }
      })
  }

  ngOnInit() {
    const username = this.route.snapshot.paramMap.get('username');
    if (username) {
      this.loadUserData(username);
    }
  }

  goBack() {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/users']).then(() => {});
    }
  }

}
