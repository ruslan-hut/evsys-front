import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { errorInterceptor, NOT_AUTHORIZED_KEY, REQUEST_FAILED_KEY } from './error.interceptor';

const URL = '/anything';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    TestBed.resetTestingModule();
  });

  /** Fails the request with `status` and returns the error the caller observes. */
  function errorFor(status: number): Error | undefined {
    let caught: Error | undefined;
    http.get(URL).subscribe({ error: (e: Error) => (caught = e) });
    controller.expectOne(URL).flush('body', { status, statusText: 'x' });
    return caught;
  }

  it('maps 401 to the not-authorized key', () => {
    expect(errorFor(401)?.message).toBe(NOT_AUTHORIZED_KEY);
  });

  it('maps 403 to the not-authorized key', () => {
    expect(errorFor(403)?.message).toBe(NOT_AUTHORIZED_KEY);
  });

  it('maps every other failure to the generic key', () => {
    for (const status of [400, 404, 409, 500, 502]) {
      expect(errorFor(status)?.message)
        .toBe(REQUEST_FAILED_KEY);
    }
  });

  it('translates the response into a plain Error, not an HttpErrorResponse', () => {
    const caught = errorFor(500);
    expect(caught).toBeInstanceOf(Error);
    expect((caught as unknown as { status?: number }).status).toBeUndefined();
  });

  it('passes successful responses through untouched', () => {
    let body: unknown;
    http.get(URL).subscribe(res => (body = res));
    controller.expectOne(URL).flush({ ok: true });
    expect(body).toEqual({ ok: true });
  });
});
