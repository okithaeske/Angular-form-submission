import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServerRendering } from '@angular/platform-server';

export const serverConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes.map(route => {
      if (route.path?.includes(':')) {
        return {
          ...route,
          data: {
            ...route.data,
            skipPrerender: true
          }
        };
      }
      return route;
    })),
    provideServerRendering(),
  ],
};