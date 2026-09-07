import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar" [class.scrolled]="isScrolled" [class.dark-hero]="!isHomePage && !isScrolled">
      <div class="container nav-content">
        <a routerLink="/" class="logo" style="text-decoration: none;">
          <img src="/logo.png" alt="Kapso Solutions" class="logo-img" style="max-height: 48px; width: auto;">
        </a>
        <ul class="nav-links" [class.active]="menuOpen">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Home</a></li>
          <li><a routerLink="/about" routerLinkActive="active" (click)="closeMenu()">About</a></li>
          <li><a routerLink="/services" routerLinkActive="active" (click)="closeMenu()">Services</a></li>
          <li><a routerLink="/contact" routerLinkActive="active" (click)="closeMenu()">Contact</a></li>
        </ul>
        <button class="menu-toggle" (click)="toggleMenu()" [class.active]="menuOpen">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      padding: 20px 0;
      transition: all 0.3s ease;
      background: transparent;
    }
    .navbar.scrolled {
      background: rgba(10, 10, 10, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
      padding: 15px 0;
    }
    .nav-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      display: flex;
      align-items: center;
    }
    .logo svg {
      stroke: #ffffff;
    }
    .logo-text {
      font-size: 0.95rem;
      font-weight: 800;
      color: #ffffff;
      margin-left: 12px;
      line-height: 1.1;
      letter-spacing: 2px;
    }
    .nav-links {
      display: flex;
      list-style: none;
      gap: 40px;
    }
    .nav-links a {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      position: relative;
      padding: 5px 0;
      transition: color 0.3s ease;
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 1.5px;
    }
    .navbar.dark-hero .nav-links a {
      color: rgba(255, 255, 255, 0.7);
    }
    .navbar.scrolled .nav-links a {
      color: rgba(255, 255, 255, 0.7);
    }
    .nav-links a::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background: #ffffff;
      transition: width 0.3s ease;
    }
    .nav-links a:hover, .nav-links a.active {
      color: #ffffff;
    }
    .nav-links a:hover::after, .nav-links a.active::after {
      width: 100%;
    }
    .menu-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 5px;
    }
    .menu-toggle span {
      width: 25px;
      height: 2px;
      background: #ffffff;
      transition: all 0.3s ease;
    }
    @media (max-width: 768px) {
      .menu-toggle { display: flex; }
      .menu-toggle span {
        background: #ffffff;
      }
      .nav-links {
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        background: #0a0a0a;
        flex-direction: column;
        padding: 20px;
        gap: 20px;
        transform: translateY(-100%);
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
      }
      .nav-links a {
        color: rgba(255, 255, 255, 0.7);
      }
      .nav-links a:hover, .nav-links a.active {
        color: #ffffff;
      }
      .nav-links.active {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isScrolled = false;
  menuOpen = false;
  isHomePage = true;
  private routeSub!: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkRoute(this.router.url);
    this.routeSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.checkRoute(e.urlAfterRedirects || e.url));
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  private checkRoute(url: string) {
    this.isHomePage = url === '/' || url === '';
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu() { this.menuOpen = false; }
}
