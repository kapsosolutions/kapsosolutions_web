import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { WhatsappButtonComponent } from './components/whatsapp-button/whatsapp-button.component';
import { filter } from 'rxjs/operators';
import Lenis from 'lenis';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, WhatsappButtonComponent, CommonModule],
  template: `
    <app-navbar *ngIf="!isNotFoundPage"></app-navbar>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer *ngIf="!isNotFoundPage"></app-footer>
    <app-whatsapp-button *ngIf="!isNotFoundPage"></app-whatsapp-button>
  `,
  styles: [`
    main {
      min-height: 100vh;
    }
  `]
})
export class App implements OnInit, OnDestroy {
  private lenis: Lenis | null = null;
  isNotFoundPage = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true
      });

      this.ngZone.runOutsideAngular(() => {
        const raf = (time: number) => {
          this.lenis?.raf(time);
          requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
      });

      // Scroll to top on route change and check for 404 page
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        this.lenis?.scrollTo(0, { immediate: true });
        window.scrollTo(0, 0);
        this.checkNotFoundPage(event.urlAfterRedirects);
      });
      
      // Check initial route
      this.checkNotFoundPage(this.router.url);
    }
  }

  private checkNotFoundPage(url: string) {
    const knownRoutes = ['/', '/about', '/services', '/contact'];
    this.isNotFoundPage = !knownRoutes.includes(url);
  }

  ngOnDestroy() {
    this.lenis?.destroy();
  }
}
