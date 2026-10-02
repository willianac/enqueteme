import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { TuiButton, TuiIcon, TuiSurface } from '@taiga-ui/core';
import { UserApi } from '../../../features/auth/services/user-api';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [TuiButton, TuiIcon, RouterLink, CommonModule, TuiSurface],
  templateUrl: './navbar.html',
  styleUrl: './navbar.less',
})
export class Navbar {
  readonly userApi = inject(UserApi);
  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);
  protected readonly user = this.userApi.user;
  readonly open = signal(false);
  readonly isNewPollPage = signal(false);

  constructor() {
    this.isNewPollPage.set(this.router.url.includes('/new-poll'));
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isNewPollPage.set(this.router.url.includes('/new-poll'));
      });
  }

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
