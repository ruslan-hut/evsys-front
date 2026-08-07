import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { TariffComponent } from './tariff.component';

describe('TariffComponent', () => {
  let component: TariffComponent;
  let fixture: ComponentFixture<TariffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TariffComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TariffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
