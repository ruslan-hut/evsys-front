import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-company-info',
  templateUrl: './company-info.component.html',
  styleUrls: ['./company-info.component.css']
})
export class CompanyInfoComponent implements OnInit{
  pageContent: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {
  }
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.loadPageContent(params.lang)
    });
  }

  loadPageContent(lang: string){
    this.http.get(`assets/company-${lang}.json`).subscribe(
      {
        next: data => {
          this.pageContent = data;
        },
        error: _ => {
          console.warn(`No content for ${lang}, loading default`);
          this.http.get('assets/company-en.json').subscribe(defaultData => {
            this.pageContent = defaultData;
          });
        }
      }
    );
  }
}
