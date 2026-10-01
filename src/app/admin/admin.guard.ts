import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminApiService } from './admin-api.service';

// Blocks admin routes unless a token is stored. Redirects to the login page.
export const adminGuard: CanActivateFn = () => {
  const api = inject(AdminApiService);
  const router = inject(Router);
  if (api.isAuthenticated()) return true;
  router.navigate(['/admin/login']);
  return false;
};
