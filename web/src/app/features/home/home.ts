import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon, TuiSurface } from '@taiga-ui/core';
import { Navbar } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-home',
  imports: [Navbar, RouterLink, TuiButton, TuiIcon, TuiSurface],
  templateUrl: './home.html',
  styleUrl: './home.less',
})
export class Home {}
