import { Component, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <section class="page-hero">
      <div class="container">
        <div class="hero-content" #animateEl>
          <h1>About <span class="highlight">Kapso Solutions</span></h1>
          <p>Pioneering digital transformation through innovation and expertise</p>
        </div>
      </div>
    </section>

    <section class="about-intro">
      <div class="container">
        <div class="intro-grid">
          <div class="intro-content" #animateEl>
            <h2>Who We Are</h2>
            <p>Kapso Solutions is a forward-thinking IT company dedicated to delivering exceptional digital solutions. Founded with a vision to bridge the gap between technology and business success, we've grown into a trusted partner for companies worldwide.</p>
            <p>Our team of skilled developers, designers, and strategists work collaboratively to create solutions that not only meet but exceed expectations.</p>
          </div>
          <div class="intro-image" #animateEl>
            <img src="/about.png" alt="About Kapso Solutions" class="about-img">
          </div>
        </div>
      </div>
    </section>

    <section class="values">
      <div class="container">
        <div class="section-header" #animateEl>
          <h2 class="section-title">Our Core Values</h2>
          <p class="section-subtitle">The principles that guide everything we do</p>
        </div>
        <div class="values-grid">
          @for (value of values; track value.title) {
            <div class="value-card" #animateEl>
              <span class="material-icons icon">{{ value.icon }}</span>
              <h3>{{ value.title }}</h3>
              <p>{{ value.description }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="why-choose">
      <div class="container">
        <div class="section-header" #animateEl>
          <h2 class="section-title">Why Choose Us</h2>
          <p class="section-subtitle">What sets us apart from the competition</p>
        </div>
        <div class="why-grid">
          @for (reason of whyChooseUs; track reason.title) {
            <div class="why-card" #animateEl>
              <span class="material-icons icon">{{ reason.icon }}</span>
              <h3>{{ reason.title }}</h3>
              <p>{{ reason.description }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="team">
      <div class="container">
        <div class="section-header" #animateEl>
          <h2 class="section-title">Meet Our Team</h2>
          <p class="section-subtitle">The talented people behind our success</p>
        </div>
        <div class="team-grid">
          @for (member of team; track member.name) {
            <div class="team-card" #animateEl>
              <div class="avatar">{{ member.initials }}</div>
              <h3>{{ member.name }}</h3>
              <p class="role">{{ member.role }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <div class="cta-content" #animateEl>
          <h2>Want to Join Our Team?</h2>
          <p>We're always looking for talented individuals to join our growing team.</p>
          <a routerLink="/contact" class="btn-primary">Get in Touch</a>
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
    .about-intro {
      padding: 100px 0;
      background: white;
    }
    .intro-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      align-items: center;
    }
    .intro-content {
      opacity: 0;
      transform: translateX(-30px);
      transition: all 0.6s ease;
    }
    .intro-content.animate-in {
      opacity: 1;
      transform: translateX(0);
    }
    .intro-content h2 {
      font-size: 2.2rem;
      margin-bottom: 20px;
      color: #0a0a0a;
    }
    .intro-content p {
      color: #6c757d;
      line-height: 1.8;
      margin-bottom: 16px;
    }
    .intro-image {
      opacity: 0;
      transform: translateX(30px);
      transition: all 0.6s ease;
    }
    .intro-image.animate-in {
      opacity: 1;
      transform: translateX(0);
    }
    .about-img {
      width: 100%;
      height: auto;
      border-radius: 20px;
      pointer-events: auto;
    }
    .values {
      padding: 100px 0;
      background: white;
    }
    .section-header {
      text-align: center;
      margin-bottom: 60px;
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.6s ease;
    }
    .section-header.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .section-title {
      font-size: 2.2rem;
      margin-bottom: 16px;
      color: #0a0a0a;
    }
    .section-subtitle {
      font-size: 1.1rem;
      color: #6c757d;
    }
    .values-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }
    .value-card {
      background: #f8f9fa;
      padding: 40px 30px;
      border-radius: 16px;
      text-align: center;
      opacity: 0;
      transform: translateY(40px);
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .value-card.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .value-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 40px rgba(37, 211, 102, 0.15);
    }
    .value-card .icon {
      font-size: 3rem;
      margin-bottom: 20px;
      color: #25D366;
    }
    .value-card h3 {
      font-size: 1.4rem;
      margin-bottom: 12px;
      color: #0a0a0a;
    }
    .value-card p {
      color: #6c757d;
      line-height: 1.7;
    }
    .why-choose {
      padding: 100px 0;
      background: white;
    }
    .why-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
    }
    .why-card {
      background: #f8f9fa;
      padding: 40px 30px;
      border-radius: 16px;
      text-align: center;
      opacity: 0;
      transform: translateY(40px);
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .why-card.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .why-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 40px rgba(37, 211, 102, 0.15);
    }
    .why-card .icon {
      font-size: 3rem;
      margin-bottom: 20px;
      color: #25D366;
    }
    .why-card h3 {
      font-size: 1.4rem;
      margin-bottom: 12px;
      color: #0a0a0a;
    }
    .why-card p {
      color: #6c757d;
      line-height: 1.7;
    }
    .team {
      padding: 100px 0;
      background: white;
    }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 30px;
    }
    .team-card {
      background: #f8f9fa;
      padding: 40px 30px;
      border-radius: 16px;
      text-align: center;
      opacity: 0;
      transform: translateY(40px);
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .team-card.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    .team-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 40px rgba(37, 211, 102, 0.15);
    }
    .avatar {
      width: 100px;
      height: 100px;
      background: #25D366;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }
    .team-card h3 {
      font-size: 1.4rem;
      margin-bottom: 5px;
      color: #0a0a0a;
    }
    .role {
      color: #25D366;
      font-weight: 500;
      margin-bottom: 0;
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
      .why-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .page-hero h1 { font-size: 2.5rem; }
      .intro-grid { grid-template-columns: 1fr; }
      .why-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AboutComponent implements AfterViewInit {
  @ViewChildren('animateEl') animateElements!: QueryList<ElementRef>;

  values = [
    { icon: 'lightbulb', title: 'Innovation', description: 'Constantly pushing boundaries to deliver cutting-edge solutions.' },
    { icon: 'handshake', title: 'Collaboration', description: 'Working together with clients to achieve shared goals.' },
    { icon: 'star', title: 'Excellence', description: 'Committed to delivering the highest quality in everything we do.' },
    { icon: 'lock', title: 'Integrity', description: 'Building trust through transparency and honest communication.' }
  ];

  team = [
    { name: 'Alex Johnson', role: 'CEO & Founder', initials: 'AJ' },
    { name: 'Sarah Chen', role: 'CTO', initials: 'SC' },
    { name: 'Mike Roberts', role: 'Lead Developer', initials: 'MR' },
    { name: 'Emily Davis', role: 'Design Lead', initials: 'ED' }
  ];

  whyChooseUs = [
    { icon: 'speed', title: 'Fast Delivery', description: 'We deliver projects on time without compromising quality.' },
    { icon: 'support_agent', title: '24/7 Support', description: 'Round-the-clock support to help you whenever you need.' },
    { icon: 'verified', title: 'Quality Assured', description: 'Rigorous testing ensures bug-free, reliable solutions.' },
    { icon: 'payments', title: 'Affordable Pricing', description: 'Competitive rates that fit your budget.' },
    { icon: 'groups', title: 'Expert Team', description: 'Skilled professionals with years of industry experience.' },
    { icon: 'trending_up', title: 'Scalable Solutions', description: 'Solutions that grow with your business needs.' }
  ];

  constructor(private scrollAnimation: ScrollAnimationService) {}

  ngAfterViewInit() {
    this.animateElements.forEach(el => this.scrollAnimation.observe(el.nativeElement));
  }
}
