import { Routes } from '@angular/router';

export const COMPOUND_INTEREST_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./compound-interest-page/compound-interest-page').then((m) => m.CompoundInterestPage),
  },
];
