import { Routes } from '@angular/router';

export const VACATION_PAYROLL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./vacation-payroll-page/vacation-payroll-page').then((m) => m.VacationPayrollPage),
  },
];
