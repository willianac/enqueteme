import { Routes } from '@angular/router';
import { Signin } from './features/auth/signin/signin';
import { Polls } from './features/polls/polls';

export const routes: Routes = [
  {
    path: "signin",
    component: Signin,
    title: "Enqueteme - Entrar"
  },
  {
    path: "polls",
    component: Polls,
    title: "Lista de Enquetes"
  }
];
