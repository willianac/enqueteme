import { Component, inject } from '@angular/core';
import { Navbar } from "../../../shared/components/navbar/navbar";
import { TuiButton, TuiTitle, TuiTextfield, TuiLabel } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { FormsModule } from '@angular/forms';
import { UserApi } from '../services/user-api';

@Component({
  selector: 'app-signin',
  imports: [
    Navbar, 
    TuiCardLarge, 
    TuiHeader, 
    TuiTitle, 
    TuiButton, 
    TuiAvatar, 
    TuiTextfield, 
    FormsModule, 
    TuiLabel
  ],
  templateUrl: './signin.html',
  styleUrl: './signin.less',
})
export class Signin {
  userApi = inject(UserApi);
  name = "";

  public signIn() {
    this.userApi.signIn(this.name).subscribe({
      next: (res) => console.log(res)
    });
  }
}
