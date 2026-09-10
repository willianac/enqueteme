import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon, TuiSurface } from '@taiga-ui/core';
import { UserApi } from '../../../features/auth/services/user-api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [TuiButton, TuiIcon, RouterLink, CommonModule, TuiSurface],
  templateUrl: './navbar.html',
  styleUrl: './navbar.less',
})
export class Navbar {
  readonly userApi = inject(UserApi);
  private readonly elementRef = inject(ElementRef);
  protected readonly user = this.userApi.user;
  readonly open = signal(false);

  toggleMenu(event?: Event): void {
    event?.stopPropagation();
    this.open.update((v) => !v);
  }

  logout(): void {
    this.open.set(false);
    this.userApi.logout().subscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }
}
