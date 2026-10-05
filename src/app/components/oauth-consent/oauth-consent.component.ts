import {ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {take} from 'rxjs';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatProgressBar} from '@angular/material/progress-bar';
import {TranslatePipe} from '@ngx-translate/core';
import {AccountService} from '../../service/account.service';
import {OAuthService} from '../../service/oauth.service';
import {OAuthConsent} from '../../models/oauth-consent';
import {rememberReturnUrl} from '../../helpers/return-url';
import {NOT_AUTHORIZED_KEY} from '../../helpers/error.interceptor';

type ConsentState = 'loading' | 'ready' | 'unavailable' | 'redirecting';

/**
 * Consent page of the MCP OAuth flow. An MCP client (Claude, Claude Code...)
 * sends the browser to the backend's authorization endpoint, which parks the
 * request and redirects here with ?request=<id>. The signed-in user approves or
 * denies; the backend answers with the URL to hand the browser back to the
 * client.
 */
@Component({
  selector: 'app-oauth-consent',
  templateUrl: './oauth-consent.component.html',
  styleUrls: ['./oauth-consent.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions,
    MatButton, MatIcon, MatProgressBar,
    TranslatePipe,
  ],
})
export class OAuthConsentComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly oauthService = inject(OAuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<ConsentState>('loading');
  readonly consent = signal<OAuthConsent | null>(null);
  readonly busy = signal(false);
  readonly errorKey = signal<string | null>(null);

  private requestId = '';

  ngOnInit(): void {
    this.requestId = this.route.snapshot.queryParamMap.get('request') ?? '';
    if (!this.requestId) {
      this.state.set('unavailable');
      return;
    }
    // the page is usually opened cold, straight from the MCP client, so wait
    // until the stored session has been restored before deciding anything
    this.accountService.authReady$.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (!this.accountService.userValue) {
        rememberReturnUrl(this.router.url);
        this.router.navigate(['/account/login']).then(() => {});
        return;
      }
      this.load();
    });
  }

  private load(): void {
    this.oauthService.consent(this.requestId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: consent => {
        this.consent.set(consent);
        this.state.set('ready');
      },
      error: () => this.state.set('unavailable'),
    });
  }

  approve(): void {
    this.decide(true);
  }

  deny(): void {
    this.decide(false);
  }

  private decide(approve: boolean): void {
    this.busy.set(true);
    this.errorKey.set(null);
    const decision = approve ? this.oauthService.approve(this.requestId) : this.oauthService.deny(this.requestId);
    decision.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.state.set('redirecting');
        // leaving the app: the URL belongs to the MCP client, which may be a
        // localhost listener or a desktop app scheme the router cannot handle
        window.location.href = result.redirect_url;
      },
      error: (err: Error) => {
        this.busy.set(false);
        this.errorKey.set(err?.message === NOT_AUTHORIZED_KEY ? 'oauthConsent.notAllowed' : 'oauthConsent.decisionFailed');
      },
    });
  }

  signInAsSomeoneElse(): void {
    rememberReturnUrl(this.router.url);
    this.accountService.logout();
  }
}
