import {Component, Inject, OnInit, Optional, ChangeDetectionStrategy, ChangeDetectorRef, inject} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AccountService} from "../../../service/account.service";
import {User} from "../../../models/user";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {BasicDialogComponent} from "../../dialogs/basic/basic-dialog.component";
import {DataObject, SimpleDataObject} from "../../../models/data-object";
import {environment} from "../../../../environments/environment";
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { TitleCasePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-user-info',
    templateUrl: './user-info.component.html',
    styleUrls: ['./user-info.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCard, MatCardContent, MatList, MatListItem, MatCardActions, MatButton, MatIcon, TitleCasePipe]
})
export class UserInfoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly account = inject(AccountService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly dialogRef = inject(MatDialogRef<BasicDialogComponent>, { optional: true });
  readonly data = inject<string>(MAT_DIALOG_DATA, { optional: true });

  user!: User;
  userInfo: DataObject[] = [];

  constructor() {
    if (this.data) {
      this.loadUserData(this.data)
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
        this.cdr.markForCheck();
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
