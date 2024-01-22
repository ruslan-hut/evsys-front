import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {filter, map} from "rxjs";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'WattBrews';
  showHeader = true;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
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
    const firebaseConfig = {
      apiKey: "AIzaSyB0NiW4HE2isMSIej6MbgCUUylV39xSEkw",
      authDomain: "evcharge-68bc8.firebaseapp.com",
      projectId: "evcharge-68bc8",
      storageBucket: "evcharge-68bc8.appspot.com",
      messagingSenderId: "547191660448",
      appId: "1:547191660448:web:fb16383e8249ddfc360ec5",
      measurementId: "G-Z2M3DF6LCY"
    };
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
  }

}
