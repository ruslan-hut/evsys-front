import { ApplicationConfig, APP_INITIALIZER, LOCALE_ID, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FirebaseService } from './service/firebase.service';
import { tokenInterceptor } from './helpers/token.interceptor';
import { errorInterceptor } from './helpers/error.interceptor';
import { provideServiceWorker } from '@angular/service-worker';
import { registerLocaleData } from '@angular/common';
import localeEnGB from '@angular/common/locales/en-GB';

registerLocaleData(localeEnGB);

export function initializeAppFactory(firebaseService: FirebaseService) {
    return () => firebaseService.loadConfig();
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideAnimations(),
        provideHttpClient(withInterceptors([tokenInterceptor, errorInterceptor])),
        provideNativeDateAdapter(),
        { provide: LOCALE_ID, useValue: 'en-GB' },
        { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAppFactory,
            deps: [FirebaseService],
            multi: true
        },
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
        }),
    ]
};
