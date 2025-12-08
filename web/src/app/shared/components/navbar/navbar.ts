import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon, TuiIcons } from '@taiga-ui/core';
import { UserApi } from '../../../features/auth/services/user-api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [TuiButton, TuiIcon, RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.less',
})
export class Navbar {
  readonly userApi = inject(UserApi);
  protected user = this.userApi.user();
}
