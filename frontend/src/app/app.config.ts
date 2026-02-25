import { ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalInterceptor,
  MsalService,
  MsalBroadcastService,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import {
  PublicClientApplication,
  IPublicClientApplication,
  InteractionType,
} from '@azure/msal-browser';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

export function msalInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.msalConfig.clientId,
      authority: environment.msalConfig.authority,
      redirectUri: environment.msalConfig.redirectUri,
    },
    cache: {
      cacheLocation: 'localStorage',
    },
  });
}

export function msalInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('/api', environment.apiScopes);
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export const msalInterceptorFn: HttpInterceptorFn = (req, next) => {
  const interceptor = inject(MsalInterceptor);
  return interceptor.intercept(req, { handle: next });
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([msalInterceptorFn])),
    provideAnimations(),
    { provide: MSAL_INSTANCE, useFactory: msalInstanceFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: msalInterceptorConfigFactory },
    MsalInterceptor,
    MsalService,
    MsalBroadcastService,
  ]
};
