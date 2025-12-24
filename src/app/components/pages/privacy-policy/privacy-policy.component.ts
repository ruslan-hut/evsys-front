import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import { HttpClient } from "@angular/common/http";


@Component({
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.css'],
    standalone: true,
    imports: []
})
export class PrivacyPolicyComponent implements OnInit{
  policyContent: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {
  }
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.loadPolicy(params.lang)
    });
  }

  loadPolicy(lang: string){
    this.http.get(`assets/privacy-${lang}.json`).subscribe(
      {
        next: data => {
          this.policyContent = data;
        },
        error: _ => {
          console.warn(`No privacy policy for ${lang}, loading default`);
          this.http.get('assets/privacy-en.json').subscribe(defaultData => {
            this.policyContent = defaultData;
          });
        }
      }
    );
  }

}
