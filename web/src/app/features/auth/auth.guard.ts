import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserApi } from './services/user-api';

export const authGuard: CanActivateFn = () =>
  inject(UserApi).user() ? true : inject(Router).createUrlTree(['/signin']);
