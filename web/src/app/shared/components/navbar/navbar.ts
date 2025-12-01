import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon, TuiIcons } from '@taiga-ui/core';

@Component({
  selector: 'app-navbar',
  imports: [TuiButton, TuiIcon, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.less',
})
export class Navbar {

}
