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
          <h1>Kapso Solutions <span class="highlight">Services</span></h1>
          <p>WhatsApp Automation, Meta Verification, Web, Apps, Cloud &amp; High-ROI Campaigns</p>
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
          <h2>Ready to Scale With Kapso Solutions?</h2>
          <p>Let's discuss your project and implement the ideal digital technology and automation solution.</p>
          <a routerLink="/contact" class="btn-primary">Contact Us Today</a>
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
    .highlight { color: #25D366; }
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
      icon: 'forum',
      title: 'WhatsApp Automation',
      description: 'Supercharge customer engagement and conversions with official WhatsApp Business API integration, AI automated chatbots, smart broadcasting, and CRM synchronization.',
      features: ['Official WhatsApp Business API', 'AI Conversational Chatbots', 'Automated Lead Nurturing', 'Broadcast & Notification Campaigns']
    },
    {
      icon: 'verified',
      title: 'Meta Business Verification',
      description: 'Fast, guaranteed Meta Business Manager verification. We guide your organization through documentation, compliance, and securing the verified green tick badge.',
      features: ['Meta Business Manager Verification', 'WhatsApp Official Green Tick', 'Facebook & Instagram Verification', 'Compliance & Policy Guidance']
    },
    {
      icon: 'language',
      title: 'Website Development',
      description: 'Custom, blazing-fast responsive websites and web applications built with modern frameworks, high-ranking SEO architecture, and conversion-focused UI/UX.',
      features: ['Custom Web Applications', 'SEO & Speed Optimization', 'Progressive Web Apps (PWA)', 'E-Commerce & Payment Portals']
    },
    {
      icon: 'smartphone',
      title: 'Mobile App Development',
      description: 'Feature-rich native and cross-platform mobile apps for iOS and Android that captivate users, streamline workflows, and scale with your business.',
      features: ['iOS & Android App Engineering', 'Cross-Platform Flutter & React', 'Intuitive UI/UX Design', 'API & Cloud Backend Integration']
    },
    {
      icon: 'cloud',
      title: 'Cloud Services & DevOps',
      description: 'Robust cloud infrastructure architecture and DevOps pipelines on AWS, Google Cloud, and Azure for 99.99% uptime, scalability, and airtight security.',
      features: ['AWS, GCP & Azure Architecture', 'Cloud Migration & Hosting', 'CI/CD Automation & Docker', 'Cloud Security & Monitoring']
    },
    {
      icon: 'campaign',
      title: 'Ads & Campaign Marketing',
      description: 'Data-driven Meta Ads and Google Ads PPC campaigns designed to lower cost-per-acquisition (CPA), generate qualified leads, and maximize your return on ad spend (ROAS).',
      features: ['Targeted Meta Ads (FB & Insta)', 'Google Ads Search & Display', 'High-Converting Funnel Design', 'Performance Tracking & Retargeting']
    }
  ];

  constructor(private scrollAnimation: ScrollAnimationService) {}

  ngAfterViewInit() {
    this.animateElements.forEach(el => this.scrollAnimation.observe(el.nativeElement));
  }
}
