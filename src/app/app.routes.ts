import { Routes } from '@angular/router';
import { adminGuard } from './admin/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'about', loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },
  { path: 'services', loadComponent: () => import('./pages/services/services.component').then(m => m.ServicesComponent) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'terms', loadComponent: () => import('./pages/terms/terms.component').then(m => m.TermsComponent) },
  { path: 'privacy', loadComponent: () => import('./pages/privacy/privacy.component').then(m => m.PrivacyComponent) },
  { path: 'cookies', loadComponent: () => import('./pages/cookies/cookies.component').then(m => m.CookiesComponent) },

  // ---------------- Admin panel ----------------
  { path: 'admin/login', loadComponent: () => import('./admin/login/admin-login.component').then(m => m.AdminLoginComponent) },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'categories', loadComponent: () => import('./admin/categories/admin-categories.component').then(m => m.AdminCategoriesComponent) },
      { path: 'flow-images', loadComponent: () => import('./admin/flow-images/admin-flow-images.component').then(m => m.AdminFlowImagesComponent) },
      { path: 'demos', loadComponent: () => import('./admin/demos/admin-demos.component').then(m => m.AdminDemosComponent) },
      { path: 'demos/:id', loadComponent: () => import('./admin/demos/admin-demo-detail.component').then(m => m.AdminDemoDetailComponent) },
      { path: 'crm', loadComponent: () => import('./admin/crm/admin-crm.component').then(m => m.AdminCrmComponent) }
    ]
  },

  { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
