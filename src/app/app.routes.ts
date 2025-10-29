import { CanActivateFn, Routes } from '@angular/router';
import { Home } from './home/home';
import { Form } from './form/form';
import { inject } from '@angular/core';
import { KeycloakService } from './auth/keycloak.service';
import { Csv } from './csv/csv';

const authGuard: CanActivateFn = () => {
  const kc = inject(KeycloakService);
  if (kc.isLoggedIn()) return true;
  // Not logged in? Send to Keycloak. Returning false cancels navigation.
  kc.login();
  return false;
};

export const routes: Routes = [
  { 
    path: '', 
    component: Home,
    data: { prerender: true }
  },
  { 
    path: 'form', 
    component: Form, 
    canActivate: [authGuard],
    data: { prerender: true }
  },
  { 
    path: 'form/:id', 
    component: Form, 
    canActivate: [authGuard],
    resolve: {
      ssr: () => ({ skipPrerender: true })
    }
  },
  { 
    path: 'csv', 
    component: Csv, 
    canActivate: [authGuard],
    data: { prerender: true }
  }
];
