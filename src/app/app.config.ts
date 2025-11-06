import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { KeycloakService } from './auth/keycloak.service';
import { provideHttpClient } from '@angular/common/http';

function initKeycloak(kc: KeycloakService) {
  return () => kc.init();
}

const routeConfig = routes.map(route => {
  if (route.path?.includes(':')) {
    return {
      ...route,
      data: {
        ...route.data,
        skipPrerender: true,
      },
    };
  }
  return route;
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routeConfig),
    provideClientHydration(),
    provideHttpClient(),
    { provide: APP_INITIALIZER, useFactory: initKeycloak, deps: [KeycloakService], multi: true },
  ],
};
