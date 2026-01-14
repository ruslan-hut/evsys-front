import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import { HttpClient } from "@angular/common/http";


@Component({
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: []
})
export class PrivacyPolicyComponent implements OnInit{
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  policyContent: any;

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
          this.cdr.markForCheck();
        },
        error: _ => {
          console.warn(`No privacy policy for ${lang}, loading default`);
          this.http.get('assets/privacy-en.json').subscribe(defaultData => {
            this.policyContent = defaultData;
            this.cdr.markForCheck();
          });
        }
      }
    );
  }

}
