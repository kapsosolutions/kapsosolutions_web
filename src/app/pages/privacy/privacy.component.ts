import { Component, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-hero">
      <div class="container">
        <div class="hero-content" #animateEl>
          <h1>Privacy <span class="highlight">Policy</span></h1>
          <p>Your privacy is important to us. Learn how we collect, use, and protect your data.</p>
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="container">
        <div class="content-wrapper" #animateEl>
          <button class="back-btn" (click)="goBack()">
            <span class="material-icons">arrow_back</span>
            Back
          </button>
          <p class="last-updated">Last Updated: December 17, 2025</p>

          <div class="section-block">
            <h2>1. Introduction</h2>
            <p>Kapso Solutions ("Company", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</p>
          </div>

          <div class="section-block">
            <h2>2. Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide, including:</p>
            <ul>
              <li>Name and contact information (email, phone number)</li>
              <li>Business information (company name, job title)</li>
              <li>Project requirements and specifications</li>
              <li>Payment and billing information</li>
              <li>Communication records</li>
            </ul>
            
            <h3>Automatically Collected Information</h3>
            <p>When you visit our website, we may automatically collect:</p>
            <ul>
              <li>IP address and browser type</li>
              <li>Device information</li>
              <li>Pages visited and time spent</li>
              <li>Referring website addresses</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for:</p>
            <ul>
              <li>Providing and improving our services</li>
              <li>Communicating with you about projects and inquiries</li>
              <li>Processing payments and transactions</li>
              <li>Sending promotional materials (with your consent)</li>
              <li>Analyzing website usage to improve user experience</li>
              <li>Complying with legal obligations</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>4. Data Sharing and Disclosure</h2>
            <p>We may share your information with:</p>
            <ul>
              <li>Service providers who assist in our operations</li>
              <li>Business partners with your consent</li>
              <li>Legal authorities when required by law</li>
              <li>Professional advisors (lawyers, accountants)</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </div>

          <div class="section-block">
            <h2>5. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Employee training on data protection</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>7. Data Retention</h2>
            <p>We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including legal, accounting, or reporting requirements.</p>
          </div>

          <div class="section-block">
            <h2>8. Third-Party Links</h2>
            <p>Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies.</p>
          </div>

          <div class="section-block">
            <h2>9. Children's Privacy</h2>
            <p>Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.</p>
          </div>

          <div class="section-block">
            <h2>10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.</p>
          </div>

          <div class="section-block">
            <h2>11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us:</p>
            <ul>
              <li>Email: <a href="mailto:kapsosolutions@gmail.com">info&#64;kapsosolutions.com</a></li>
              <li>Phone: <a href="tel:+919440203095">+91 9440203095</a></li>
              <li>Address: Andhra Pradesh, India</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .page-hero {
      padding: 180px 0 180px;
      text-align: center;
      background: #25D366 url('/bg-bottom.png') no-repeat bottom center;
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
    .content-section {
      padding: 80px 0;
      background: white;
    }
    .content-wrapper {
      max-width: 900px;
      margin: 0 auto;
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.6s ease;
    }
    .content-wrapper.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .last-updated {
      color: #6c757d;
      font-style: italic;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e9ecef;
    }
    .section-block {
      margin-bottom: 40px;
    }
    .section-block h2 {
      font-size: 1.5rem;
      color: #0a0a0a;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #25D366;
      display: inline-block;
    }
    .section-block h3 {
      font-size: 1.2rem;
      color: #343a40;
      margin: 20px 0 12px;
    }
    .section-block p {
      color: #495057;
      line-height: 1.8;
      margin-bottom: 16px;
    }
    .section-block ul {
      margin: 16px 0;
      padding-left: 24px;
    }
    .section-block li {
      color: #495057;
      line-height: 1.8;
      margin-bottom: 8px;
    }
    .section-block a {
      color: #25D366;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    .section-block a:hover {
      color: #128C7E;
      text-decoration: underline;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #f8f9fa;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      color: #343a40;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 30px;
    }
    .back-btn:hover {
      background: #25D366;
      color: white;
    }
    .back-btn .material-icons {
      font-size: 1.2rem;
    }
    @media (max-width: 768px) {
      .page-hero h1 { font-size: 2.5rem; }
      .content-section { padding: 60px 20px; }
    }
  `]
})
export class PrivacyComponent implements AfterViewInit {
  @ViewChildren('animateEl') animateElements!: QueryList<ElementRef>;

  constructor(
    private scrollAnimation: ScrollAnimationService,
    private location: Location
  ) {}

  ngAfterViewInit() {
    this.animateElements.forEach(el => this.scrollAnimation.observe(el.nativeElement));
  }

  goBack() {
    this.location.back();
  }
}
