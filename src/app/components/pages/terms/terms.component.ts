import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.css']
})
export class TermsComponent implements OnInit {
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
    this.http.get(`assets/terms-${lang}.json`).subscribe(
      {
        next: data => {
          this.pageContent = data;
        },
        error: _ => {
          console.warn(`No content for ${lang}, loading default`);
          this.http.get('assets/terms-en.json').subscribe(defaultData => {
            this.pageContent = defaultData;
          });
        }
      }
    );
  }
}
