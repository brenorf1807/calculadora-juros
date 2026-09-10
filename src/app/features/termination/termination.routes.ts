import { Routes } from '@angular/router';

export const TERMINATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./termination-page/termination-page').then((m) => m.TerminationPage),
  },
];
