import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserApi } from './services/user-api';

export const unauthGuard: CanActivateFn = () =>
  inject(UserApi).user() ? inject(Router).createUrlTree(['/polls']) : true;
