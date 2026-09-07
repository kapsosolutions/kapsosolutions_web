import { Component, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <section class="page-hero">
      <div class="container">
        <div class="hero-content" #animateEl>
          <h1>Our <span class="highlight">Services</span></h1>
          <p>Comprehensive IT solutions to power your digital transformation</p>
        </div>
      </div>
    </section>

    <section class="services-section">
      <div class="container">
        <div class="services-grid">
          @for (service of services; track service.title) {
            <div class="service-card" #animateEl>
              <span class="material-icons service-icon">{{ service.icon }}</span>
              <h3>{{ service.title }}</h3>
              <p>{{ service.description }}</p>
              <ul class="features">
                @for (feature of service.features; track feature) {
                  <li>✓ {{ feature }}</li>
                }
              </ul>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <div class="cta-content" #animateEl>
          <h2>Ready to Get Started?</h2>
          <p>Let's discuss your project and find the perfect solution for your needs.</p>
          <a routerLink="/contact" class="btn-primary">Contact Us</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .page-hero {
      padding: 180px 0 180px;
      text-align: center;
      background: #0a0a0a url('/bg-bottom.png') no-repeat bottom center;
      background-size: 100% auto;
      margin-bottom: -1px;
    }
    .hero-content {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.6s ease;
    }
    .hero-content.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .page-hero h1 {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 16px;
      color: white;
    }
    .highlight { color: white; }
    .page-hero p {
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.9);
    }
    .services-section {
      padding: 80px 0;
      background: white;
    }
    .services-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
    }
    .service-card {
      background: #f8f9fa;
      padding: 40px 30px;
      border-radius: 16px;
      opacity: 0;
      transform: translateY(40px);
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .service-card.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .service-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 40px rgba(37, 211, 102, 0.15);
    }
    .service-icon {
      font-size: 3rem;
      margin-bottom: 20px;
      color: #25D366;
    }
    .service-card h3 {
      font-size: 1.4rem;
      margin-bottom: 12px;
      color: #0a0a0a;
    }
    .service-card p {
      color: #6c757d;
      line-height: 1.7;
      margin-bottom: 20px;
    }
    .features {
      list-style: none;
    }
    .features li {
      padding: 6px 0;
      color: #343a40;
      font-weight: 500;
      font-size: 0.95rem;
    }
    .cta-section {
      padding: 100px 0;
      background: white;
    }
    .cta-content {
      text-align: center;
      color: #0a0a0a;
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.6s ease;
    }
    .cta-content.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .cta-content h2 {
      font-size: 2.2rem;
      margin-bottom: 16px;
      color: #0a0a0a;
    }
    .cta-content p {
      font-size: 1.1rem;
      margin-bottom: 30px;
      color: #6c757d;
    }
    .cta-content .btn-primary {
      background: #25D366;
      color: white;
    }
    @media (max-width: 1024px) {
      .services-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 768px) {
      .page-hero h1 { font-size: 2.5rem; }
      .services-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ServicesComponent implements AfterViewInit {
  @ViewChildren('animateEl') animateElements!: QueryList<ElementRef>;

  services = [
    {
      icon: 'language',
      title: 'Web Development',
      description: 'We create stunning, responsive websites that deliver exceptional user experiences and drive business results.',
      features: ['Custom Web Applications', 'Progressive Web Apps', 'CMS Development', 'API Integration']
    },
    {
      icon: 'smartphone',
      title: 'App Development',
      description: 'Native and cross-platform mobile applications designed to engage users and grow your business.',
      features: ['iOS & Android Apps', 'Cross-platform Development', 'UI/UX Design', 'App Maintenance']
    },
    {
      icon: 'shopping_cart',
      title: 'E-commerce',
      description: 'Complete e-commerce solutions to help you sell online and grow your business globally.',
      features: ['Online Stores', 'Payment Integration', 'Inventory Management', 'Order Tracking']
    },
    {
      icon: 'store',
      title: 'Local Business Software',
      description: 'Custom software solutions designed specifically for local businesses to streamline operations.',
      features: ['POS Systems', 'Booking Systems', 'Customer Management', 'Billing & Invoicing']
    },
    {
      icon: 'smart_toy',
      title: 'AI Chatbots',
      description: 'Intelligent chatbots that provide 24/7 customer support and automate conversations.',
      features: ['Customer Support Bots', 'Lead Generation', 'FAQ Automation', 'Multi-platform Integration']
    },
    {
      icon: 'bolt',
      title: 'Automation Solutions',
      description: 'Streamline your operations with intelligent automation that saves time and reduces errors.',
      features: ['Workflow Automation', 'RPA Solutions', 'Integration Services', 'Process Optimization']
    }
  ];

  constructor(private scrollAnimation: ScrollAnimationService) {}

  ngAfterViewInit() {
    this.animateElements.forEach(el => this.scrollAnimation.observe(el.nativeElement));
  }
}
