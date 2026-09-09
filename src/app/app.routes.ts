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
  // Próximos módulos (ex.: 'salario') entram aqui seguindo o mesmo padrão de loadChildren.
  { path: '**', redirectTo: '' },
];
