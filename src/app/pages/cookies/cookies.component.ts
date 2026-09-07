import { Component, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-hero">
      <div class="container">
        <div class="hero-content" #animateEl>
          <h1>Cookies <span class="highlight">Policy</span></h1>
          <p>Understanding how we use cookies to enhance your experience.</p>
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
            <h2>1. What Are Cookies?</h2>
            <p>Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience. Cookies can be "persistent" or "session" cookies.</p>
          </div>

          <div class="section-block">
            <h2>2. Types of Cookies We Use</h2>
            
            <h3>Essential Cookies</h3>
            <p>These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas. The website cannot function properly without these cookies.</p>
            
            <h3>Analytics Cookies</h3>
            <p>These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website's performance and user experience.</p>
            
            <h3>Functional Cookies</h3>
            <p>These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.</p>
            
            <h3>Marketing Cookies</h3>
            <p>These cookies may be set through our site by our advertising partners. They may be used to build a profile of your interests and show you relevant advertisements on other sites.</p>
          </div>

          <div class="section-block">
            <h2>3. Cookies We Use</h2>
            <div class="cookie-table">
              <table>
                <thead>
                  <tr>
                    <th>Cookie Name</th>
                    <th>Type</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>_ga</td>
                    <td>Analytics</td>
                    <td>Google Analytics - tracks unique visitors</td>
                    <td>2 years</td>
                  </tr>
                  <tr>
                    <td>_gid</td>
                    <td>Analytics</td>
                    <td>Google Analytics - distinguishes users</td>
                    <td>24 hours</td>
                  </tr>
                  <tr>
                    <td>session_id</td>
                    <td>Essential</td>
                    <td>Maintains user session</td>
                    <td>Session</td>
                  </tr>
                  <tr>
                    <td>cookie_consent</td>
                    <td>Essential</td>
                    <td>Stores cookie consent preferences</td>
                    <td>1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="section-block">
            <h2>4. Managing Cookies</h2>
            <p>You can control and manage cookies in several ways:</p>
            
            <h3>Browser Settings</h3>
            <p>Most browsers allow you to:</p>
            <ul>
              <li>View cookies stored on your device</li>
              <li>Delete all or specific cookies</li>
              <li>Block all or third-party cookies</li>
              <li>Set preferences for certain websites</li>
            </ul>
            
            <h3>Browser-Specific Instructions</h3>
            <ul>
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>5. Impact of Disabling Cookies</h2>
            <p>Please note that disabling cookies may affect your experience on our website:</p>
            <ul>
              <li>Some features may not function properly</li>
              <li>Your preferences may not be saved</li>
              <li>You may need to re-enter information on each visit</li>
              <li>Some content may not display correctly</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>6. Third-Party Cookies</h2>
            <p>We may use third-party services that set their own cookies:</p>
            <ul>
              <li><strong>Google Analytics:</strong> For website analytics and performance tracking</li>
              <li><strong>Google Maps:</strong> For displaying location information</li>
              <li><strong>Social Media:</strong> For social sharing functionality</li>
            </ul>
            <p>These third parties have their own privacy policies governing the use of cookies.</p>
          </div>

          <div class="section-block">
            <h2>7. Updates to This Policy</h2>
            <p>We may update this Cookies Policy from time to time to reflect changes in technology, legislation, or our data practices. We encourage you to review this page periodically for the latest information.</p>
          </div>

          <div class="section-block">
            <h2>8. Contact Us</h2>
            <p>If you have questions about our use of cookies, please contact us:</p>
            <ul>
              <li>Email: <a href="mailto:kapsosolutions@gmail.com">info&#64;kapsosolutions.com</a></li>
              <li>Phone: <a href="tel:+919440203095">+91 9440203095</a></li>
              <li>Address: Andhra Pradesh, India</li>
            </ul>
          </div>

          <div class="section-block related-links">
            <h2>Related Policies</h2>
            <p>For more information about how we handle your data, please see:</p>
            <ul>
              <li><a routerLink="/privacy">Privacy Policy</a></li>
              <li><a routerLink="/terms">Terms & Conditions</a></li>
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
    .cookie-table {
      overflow-x: auto;
      margin: 20px 0;
    }
    .cookie-table table {
      width: 100%;
      border-collapse: collapse;
      background: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
    }
    .cookie-table th,
    .cookie-table td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid #e9ecef;
    }
    .cookie-table th {
      background: #25D366;
      color: white;
      font-weight: 600;
    }
    .cookie-table td {
      color: #495057;
    }
    .cookie-table tr:last-child td {
      border-bottom: none;
    }
    .related-links {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 12px;
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
      .cookie-table th,
      .cookie-table td {
        padding: 10px 12px;
        font-size: 0.9rem;
      }
    }
  `]
})
export class CookiesComponent implements AfterViewInit {
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
