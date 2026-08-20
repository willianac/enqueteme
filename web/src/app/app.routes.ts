import { Routes } from '@angular/router';
import { Signin } from './features/auth/signin/signin';
import { Polls } from './features/polls/polls';
import { NewPoll } from './features/polls/components/new-poll/new-poll';
import { MyPolls } from './features/polls/components/my-polls/my-polls';
import { EditPoll } from './features/polls/components/edit-poll/edit-poll';
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
  },
  {
    path: "my-polls",
    component: MyPolls,
    //canActivate: [authGuard],
    title: "Minhas enquetes"
  },
  {
    path: "my-polls/:id/edit",
    component: EditPoll,
    canActivate: [authGuard],
    title: "Editar enquete"
  }
];
