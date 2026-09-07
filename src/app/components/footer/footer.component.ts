import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-bg"></div>
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="logo" style="display: flex; align-items: center;">
              <img src="/logo.png" alt="Kapso Solutions" class="logo-img" style="max-height: 48px; width: auto;">
            </div>
            <p>Engineering precision digital solutions for businesses worldwide.</p>
          </div>
          <div class="footer-links">
            <h4>Quick Links</h4>
            <a routerLink="/">Home</a>
            <a routerLink="/about">About</a>
            <a routerLink="/services">Services</a>
            <a routerLink="/contact">Contact</a>
          </div>
          <div class="footer-links">
            <h4>Services</h4>
            <a routerLink="/services">Web Development</a>
            <a routerLink="/services">App Development</a>
            <a routerLink="/services">AI & ML Solutions</a>
            <a routerLink="/services">Automation</a>
          </div>
          <div class="footer-links">
            <h4>Legal</h4>
            <a routerLink="/terms">Terms & Conditions</a>
            <a routerLink="/privacy">Privacy Policy</a>
            <a routerLink="/cookies">Cookies Policy</a>
          </div>
          <div class="footer-links contact-links">
            <h4>Contact</h4>
            <a href="https://mail.google.com/mail/?view=cm&to=kapsosolutions@gmail.com" target="_blank"><span class="material-icons">email</span> info&#64;kapsosolutions.com</a>
            <a href="tel:+919440203095"><span class="material-icons">phone</span> +91 9440203095</a>
            <p><span class="material-icons">location_on</span> Andhra Pradesh, India</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 Kapso Solutions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
    }
    :host::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 0;
      right: 0;
      height: 0px;
      background: white;
      z-index: 10;
    }
    .footer {
      background-color: #000000ff;
      background-image: url('/bg-top.png'), url('/map.png');
      background-repeat: no-repeat, no-repeat;
      background-position: top center, center center;
      background-size: 100% auto, cover;
      color: white;
      padding: 150px 0 30px;
      position: relative;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    .footer-brand .logo {
      margin-bottom: 15px;
    }
    .logo-text-footer {
      font-size: 0.95rem;
      font-weight: 800;
      color: #ffffff;
      margin-left: 12px;
      line-height: 1.1;
      letter-spacing: 2px;
    }
    .footer-brand p {
      color: #9ca3af;
      line-height: 1.6;
    }
    .footer-links h4 {
      margin-bottom: 20px;
      font-weight: 600;
    }
    .footer-links a, .footer-links p {
      display: block;
      color: #9ca3af;
      margin-bottom: 10px;
      transition: color 0.3s ease;
    }
    .footer-links a:hover {
      color: #ffffff;
    }
    .contact-links p,
    .contact-links a {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .contact-links .material-icons {
      font-size: 1rem;
      color: #25D366;
    }
    .footer-bottom {
      border-top: 1px solid #1f2937;
      padding-top: 30px;
      text-align: center;
      color: #6b7280;
    }
    @media (max-width: 1024px) {
      .footer-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 30px;
      }
    }
    @media (max-width: 768px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 30px;
      }
    }
    @media (max-width: 480px) {
      .footer-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FooterComponent {}
