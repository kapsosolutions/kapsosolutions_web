import { Component, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-hero">
      <div class="container">
        <div class="hero-content" #animateEl>
          <h1>Terms & <span class="highlight">Conditions</span></h1>
          <p>Please read these terms carefully before using our services.</p>
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
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using the services provided by Kapso Solutions ("Company", "we", "us", or "our"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>
          </div>

          <div class="section-block">
            <h2>2. Services</h2>
            <p>Kapso Solutions provides IT solutions including but not limited to:</p>
            <ul>
              <li>Web Development</li>
              <li>Mobile App Development</li>
              <li>AI & Machine Learning Solutions</li>
              <li>E-commerce Solutions</li>
              <li>Business Automation</li>
              <li>Custom Software Development</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>3. Client Responsibilities</h2>
            <p>As a client, you agree to:</p>
            <ul>
              <li>Provide accurate and complete information required for project execution</li>
              <li>Respond to communications in a timely manner</li>
              <li>Make payments as per the agreed schedule</li>
              <li>Provide necessary access and resources for project completion</li>
              <li>Review and approve deliverables within the specified timeframe</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>4. Payment Terms</h2>
            <ul>
              <li>Payment schedules will be outlined in individual project agreements</li>
              <li>A deposit may be required before project commencement</li>
              <li>Late payments may incur additional charges</li>
              <li>All prices are in Indian Rupees (INR) unless otherwise specified</li>
              <li>Taxes will be applied as per applicable laws</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>5. Intellectual Property</h2>
            <p>Upon full payment:</p>
            <ul>
              <li>Client receives ownership of custom-developed code and designs</li>
              <li>Third-party components remain under their respective licenses</li>
              <li>Kapso Solutions retains the right to showcase work in portfolio (unless agreed otherwise)</li>
              <li>Pre-existing intellectual property remains with its original owner</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>6. Confidentiality</h2>
            <p>Both parties agree to:</p>
            <ul>
              <li>Keep confidential information private</li>
              <li>Not disclose sensitive business information to third parties</li>
              <li>Use confidential information only for project purposes</li>
              <li>Return or destroy confidential materials upon project completion</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>7. Project Timeline</h2>
            <ul>
              <li>Timelines are estimates and may vary based on project complexity</li>
              <li>Delays caused by client may extend the timeline</li>
              <li>Force majeure events may affect delivery schedules</li>
              <li>Changes in scope may require timeline adjustments</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>8. Revisions and Changes</h2>
            <ul>
              <li>Number of revisions will be specified in project agreements</li>
              <li>Additional revisions may incur extra charges</li>
              <li>Major scope changes require written agreement and may affect pricing</li>
              <li>Revision requests must be submitted in writing</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>9. Warranty and Support</h2>
            <ul>
              <li>Bug fixes are provided for 30 days after project delivery</li>
              <li>Extended support packages are available</li>
              <li>Warranty does not cover issues caused by third-party modifications</li>
              <li>Support response times vary based on service level agreement</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>10. Limitation of Liability</h2>
            <p>Kapso Solutions shall not be liable for:</p>
            <ul>
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of profits or business opportunities</li>
              <li>Data loss due to client's failure to maintain backups</li>
              <li>Issues arising from client-provided content or specifications</li>
            </ul>
            <p>Our total liability shall not exceed the amount paid for the specific service.</p>
          </div>

          <div class="section-block">
            <h2>11. Termination</h2>
            <ul>
              <li>Either party may terminate with written notice</li>
              <li>Client is responsible for payment of work completed</li>
              <li>Termination does not affect accrued rights and obligations</li>
              <li>Confidentiality obligations survive termination</li>
            </ul>
          </div>

          <div class="section-block">
            <h2>12. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Andhra Pradesh, India.</p>
          </div>

          <div class="section-block">
            <h2>13. Contact Information</h2>
            <p>For questions about these Terms & Conditions:</p>
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
export class TermsComponent implements AfterViewInit {
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
