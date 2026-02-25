import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AccountInfo, InteractionStatus } from '@azure/msal-browser';
import { concatMap, filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = inject(MsalService);
  private readonly broadcastService = inject(MsalBroadcastService);
  private readonly destroyRef = inject(DestroyRef);

  isAuthenticated = signal(false);
  userName = signal<string | null>(null);
  userEmail = signal<string | null>(null);

  constructor() {
    // Initialize MSAL, then process any pending redirect response.
    // The redirect result is the authoritative source for the authenticated account.
    this.msal.initialize()
      .pipe(
        concatMap(() => this.msal.handleRedirectObservable()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (result) => {
          if (result?.account) {
            this.msal.instance.setActiveAccount(result.account);
          }
          this.updateAuthState();
        },
        error: (err) => console.error('MSAL initialization error:', err),
      });

    // Re-evaluate auth state after every completed interaction
    // (handles silent token renewal, popup logins, logouts, etc.).
    // inProgress$ starts with InteractionStatus.Startup, so this filter
    // only fires once initialization and any subsequent interactions finish.
    this.broadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.updateAuthState());
  }

  login(): void {
    this.msal.loginRedirect();
  }

  logout(): void {
    this.msal.logoutRedirect();
  }

  private updateAuthState(): void {
    // If no account is active yet (e.g. after page reload with a cached session),
    // auto-select when exactly one account is in cache.
    // In a multi-account scenario this guard keeps the selection explicit.
    if (!this.msal.instance.getActiveAccount()) {
      const accounts = this.msal.instance.getAllAccounts();
      if (accounts.length === 1) {
        this.msal.instance.setActiveAccount(accounts[0]);
      }
    }

    const account: AccountInfo | null = this.msal.instance.getActiveAccount();
    this.isAuthenticated.set(account !== null);
    this.userName.set(account?.name ?? account?.username ?? null);
    this.userEmail.set(account?.username ?? null);
  }
}
