import { Routes } from '@angular/router';

export const PAYROLL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./payroll-page/payroll-page').then((m) => m.PayrollPage),
  },
];
