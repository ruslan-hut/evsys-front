import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { tokenInterceptor } from './token.interceptor';
import { AccountService } from '../service/account.service';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/users/list`;

describe('tokenInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  function setup(token: string | null): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
        { provide: AccountService, useValue: { userToken: () => token } }
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    controller.verify();
    TestBed.resetTestingModule();
  });

  function flush(url: string, headers?: Record<string, string>): HttpRequest<unknown> {
    http.get(url, { headers }).subscribe({ next: () => {}, error: () => {} });
    const req = controller.expectOne(url);
    req.flush({});
    return req.request;
  }

  it('attaches a bearer token to API requests', () => {
    setup('abc123');
    expect(flush(API).headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('leaves non-API requests untouched even when a token exists', () => {
    setup('abc123');
    expect(flush('./assets/i18n/en.json').headers.has('Authorization')).toBe(false);
  });

  it('sends no Authorization header when there is no token', () => {
    setup(null);
    expect(flush(API).headers.has('Authorization')).toBe(false);
  });

  it('skips auth entirely when skip-interceptor is set, and strips the marker', () => {
    setup('abc123');
    const sent = flush(API, { 'skip-interceptor': 'true' });

    expect(sent.headers.has('Authorization')).toBe(false);
    // The marker is ours; it must not reach the backend.
    expect(sent.headers.has('skip-interceptor')).toBe(false);
  });

  it('treats any value other than the literal "true" as not skipping', () => {
    setup('abc123');
    const sent = flush(API, { 'skip-interceptor': 'yes' });

    expect(sent.headers.get('Authorization')).toBe('Bearer abc123');
  });
});
