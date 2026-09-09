import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'juros-compostos',
    loadChildren: () =>
      import('./features/compound-interest/compound-interest.routes').then(
        (m) => m.COMPOUND_INTEREST_ROUTES,
      ),
  },
  {
    path: 'financiamento',
    loadChildren: () => import('./features/financing/financing.routes').then((m) => m.FINANCING_ROUTES),
  },
  {
    path: 'salario',
    loadChildren: () => import('./features/payroll/payroll.routes').then((m) => m.PAYROLL_ROUTES),
  },
  {
    path: 'ferias',
    loadChildren: () => import('./features/vacation/vacation.routes').then((m) => m.VACATION_ROUTES),
  },
  // Próximos módulos entram aqui seguindo o mesmo padrão de loadChildren.
  { path: '**', redirectTo: '' },
];
