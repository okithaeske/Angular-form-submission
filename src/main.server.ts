import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

export default function (context: any) {
  return bootstrapApplication(App, {
    ...appConfig,
    providers: [
      ...(appConfig.providers || []),
      {
        provide: 'SSR_ROUTES',
        useValue: [
          '/',
          '/form',
          '/csv'
        ]
      }
    ]
  })
}
