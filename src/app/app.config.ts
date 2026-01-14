import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FirebaseService } from './service/firebase.service';
import { tokenInterceptor } from './helpers/token.interceptor';
import { errorInterceptor } from './helpers/error.interceptor';
import { provideServiceWorker } from '@angular/service-worker';

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
