import { Routes } from '@angular/router';

export const FINANCING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./financing-page/financing-page').then((m) => m.FinancingPage),
  },
];
