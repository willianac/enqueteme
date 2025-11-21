import { Routes } from '@angular/router';
import { Signin } from './features/auth/signin/signin';

export const routes: Routes = [
  {
    path: "signin",
    component: Signin,
    title: "Enqueteme - Entrar"
  }
];
