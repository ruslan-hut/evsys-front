import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import { HttpClient } from "@angular/common/http";


@Component({
    selector: 'app-company-info',
    templateUrl: './company-info.component.html',
    styleUrls: ['./company-info.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: []
})
export class CompanyInfoComponent implements OnInit{
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  pageContent: any;

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
          this.cdr.markForCheck();
        },
        error: _ => {
          console.warn(`No content for ${lang}, loading default`);
          this.http.get('assets/company-en.json').subscribe(defaultData => {
            this.pageContent = defaultData;
            this.cdr.markForCheck();
          });
        }
      }
    );
  }
}
