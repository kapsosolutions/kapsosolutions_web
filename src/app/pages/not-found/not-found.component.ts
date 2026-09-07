import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <a routerLink="/" class="back-home">Back to Home</a>
    </section>
  `,
  styles: [`
    .not-found {
      min-height: 100vh;
      width: 100%;
      background-image: url('/404.png');
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
      background-color: white;
      position: relative;
    }
    .back-home {
      position: absolute;
      bottom: 50px;
      left: 50%;
      transform: translateX(-50%);
      background: #25D366;
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
      white-space: nowrap;
    }
    .back-home:hover {
      transform: translateX(-50%) translateY(-2px);
      box-shadow: 0 10px 30px rgba(37, 211, 102, 0.3);
    }
    @media (max-width: 768px) {
      .back-home {
        bottom: 30px;
        padding: 12px 24px;
        font-size: 14px;
      }
    }
    @media (max-width: 480px) {
      .back-home {
        bottom: 20px;
        padding: 10px 20px;
        font-size: 13px;
      }
    }
  `]
})
export class NotFoundComponent {}
