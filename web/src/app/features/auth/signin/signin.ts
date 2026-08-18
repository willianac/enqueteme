import { Component, inject } from '@angular/core';
import { TuiButton, TuiTitle } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signin',
  imports: [
    TuiCardLarge, 
    TuiHeader, 
    TuiTitle, 
    TuiButton, 
    TuiAvatar, 
    RouterLink,
  ],
  templateUrl: './signin.html',
  styleUrl: './signin.less',
})
export class Signin {
  protected readonly loginFailed =
    inject(ActivatedRoute).snapshot.queryParamMap.get('error') ===
    'google_auth_failed';
}
