import { Routes } from '@angular/router';
import { Signin } from './features/auth/signin/signin';
import { Polls } from './features/polls/polls';
import { PollDetail } from './features/polls/components/poll-detail/poll-detail';
import { NewPoll } from './features/polls/components/new-poll/new-poll';
import { MyPolls } from './features/polls/components/my-polls/my-polls';
import { EditPoll } from './features/polls/components/edit-poll/edit-poll';
import { authGuard } from './features/auth/auth.guard';
import { unauthGuard } from './features/auth/unauth.guard';
import { Home } from './features/home/home';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    canActivate: [unauthGuard],
    title: 'Enqueteme - Crie e participe de enquetes em tempo real',
  },
  {
    path: 'signin',
    component: Signin,
    title: 'Enqueteme - Entrar',
  },
  {
    path: 'polls',
    component: Polls,
    title: 'Lista de Enquetes',
  },
  {
    path: 'polls/:id',
    component: PollDetail,
    title: 'Enquete',
  },
  {
    path: 'new-poll',
    component: NewPoll,
    canActivate: [authGuard],
    title: 'Nova enquete',
  },
  {
    path: 'my-polls',
    component: MyPolls,
    //canActivate: [authGuard],
    title: 'Minhas enquetes',
  },
  {
    path: 'my-polls/:id/edit',
    component: EditPoll,
    canActivate: [authGuard],
    title: 'Editar enquete',
  },
  {
    path: '**',
    redirectTo: 'polls',
  },
];
