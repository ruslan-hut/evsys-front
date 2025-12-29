import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, map, take } from "rxjs";

import { HeaderComponent } from "./components/ui/header/header.component";
import { SnackBarComponent } from "./components/snack-bar/snack-bar.component";
import { AccountService } from "./service/account.service";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/account/login',
  '/account/register',
  '/privacy',
  '/terms',
  '/company-info',
  '/bank'
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SnackBarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'WattBrews';
  showHeader = true;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private accountService: AccountService,
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute.root),
      map(route => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => route.outlet === 'primary'),
      map(route => route.snapshot),
      map(snapshot => snapshot.queryParamMap)
    ).subscribe(queryParamMap => {
      if (queryParamMap.has('header')) {
        this.showHeader = queryParamMap.get('header') !== 'false';
      }
    });
  }

  ngOnInit(): void {
    // Wait for auth initialization to complete, then redirect if not logged in
    this.accountService.authReady$.pipe(take(1)).subscribe(() => {
      if (!this.accountService.userValue && !this.isPublicRoute()) {
        this.router.navigate(['/account/login']);
      }
    });
  }

  private isPublicRoute(): boolean {
    const currentUrl = this.router.url.split('?')[0]; // Remove query params
    return PUBLIC_ROUTES.some(route => currentUrl.startsWith(route));
  }

}
