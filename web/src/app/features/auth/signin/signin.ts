import { Component, inject } from '@angular/core';
import { TuiButton, TuiTitle, TuiTextfield, TuiLabel, TuiError, TuiAlertService } from '@taiga-ui/core';
import { TuiAvatar, TuiButtonLoading } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { FormsModule } from '@angular/forms';
import { UserApi } from '../services/user-api';
import { Router, RouterLink } from '@angular/router';
import { TuiValidationError } from '@taiga-ui/cdk';

@Component({
  selector: 'app-signin',
  imports: [
    TuiCardLarge, 
    TuiHeader, 
    TuiTitle, 
    TuiButton, 
    TuiAvatar, 
    TuiTextfield, 
    FormsModule, 
    TuiLabel,
    RouterLink,
    TuiError,
    TuiButtonLoading
  ],
  templateUrl: './signin.html',
  styleUrl: './signin.less',
})
export class Signin {
  readonly userApi = inject(UserApi);
  readonly alerts = inject(TuiAlertService);
  readonly router = inject(Router);

  name = "";
  loading = false;

  protected nameError: TuiValidationError | null = null;
  
  public signIn() {
    if(!this.name || this.name.trim() === "") {
      this.nameError = new TuiValidationError('Campo nome é obrigatório');
      return;
    }
    this.nameError = null;
    this.loading = true;
    this.userApi.signIn(this.name).subscribe({
      next: (res) => this.onSuccessfulSignIn(res),
      error: (err) => this.onErrorSignIn(err),
      complete: () => this.router.navigateByUrl('/polls')
    });
  }

  public onSuccessfulSignIn(res: any) {
    console.log(res);
    this.loading = false;
    this.alerts.open('Entrou com sucesso', {label: 'Sucesso', appearance: "positive"}).subscribe();
  }

  public onErrorSignIn(err: any) {
    console.error(err);
    this.loading = false;
    this.alerts.open(
      'Não conseguimos realizar o login. Por favor, tente novamente mais tarde', 
      {label: 'Service Error', appearance: "negative"}
    ).subscribe();
  }
}
