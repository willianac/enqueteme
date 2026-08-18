import { Routes } from '@angular/router';
import { Signin } from './features/auth/signin/signin';
import { Polls } from './features/polls/polls';
import { NewPoll } from './features/polls/components/new-poll/new-poll';
import { authGuard } from './features/auth/auth.guard';

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
  },
  {
    path: "new-poll",
    component: NewPoll,
    canActivate: [authGuard],
    title: "Nova enquete"
  }
];
