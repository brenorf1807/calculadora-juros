import { Routes } from '@angular/router';

export const VACATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./vacation-page/vacation-page').then((m) => m.VacationPage),
  },
];
