import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Keycloak, { KeycloakInstance, KeycloakInitOptions } from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private keycloak!: KeycloakInstance;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  init(): Promise<boolean> {
    // If SSR, skip initialization entirely
    if (!this.isBrowser) {
      console.warn('Keycloak init skipped (server environment)');
      return Promise.resolve(true);
    }

    this.keycloak = new Keycloak({
      url: 'http://localhost:8080', // Keycloak base URL
      realm: 'master',
      clientId: 'form',
    });

    const opts: KeycloakInitOptions = {
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      // // The silent-check-sso HTML must be served from the app root. The file lives in `src/silent-check-sso.html`
      // // and is copied to the app root by the Angular build (see angular.json assets).
      // silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      // // If you still get timeouts due to third-party cookie restrictions, you can disable the
      // // periodic iframe check by setting `checkLoginIframe: false` here.
      // // checkLoginIframe: false,
    };

    return this.keycloak.init(opts);
  }

  login(): Promise<void> {
    if (this.isBrowser) {
      return this.keycloak.login({ redirectUri: window.location.origin });
    }
    return Promise.resolve();
  }

  register(): Promise<void> {
    if (this.isBrowser) {
      return this.keycloak.register({ redirectUri: window.location.origin });
    }
    return Promise.resolve();
  }

  logout(): Promise<void> {
    if (this.isBrowser) {
      return this.keycloak.logout({ redirectUri: window.location.origin });
    }
    return Promise.resolve();
  }

  isLoggedIn(): boolean {
    return this.isBrowser && !!this.keycloak?.authenticated;
  }

  getToken(): string | undefined {
    return this.isBrowser ? this.keycloak?.token : undefined;
  }
}
