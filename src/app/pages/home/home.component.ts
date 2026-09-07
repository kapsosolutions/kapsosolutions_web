import { Component, AfterViewInit, OnInit, OnDestroy, ElementRef, QueryList, ViewChildren, ViewChild, PLATFORM_ID, Inject, ViewEncapsulation, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  styleUrls: ['./home.component.scss'],
  template: `
    <section class="hero">
      <!-- Animated background particles -->
      <div class="hero-bg-particles">
        <div class="particle" *ngFor="let p of particles" [style.left.%]="p.x" [style.top.%]="p.y" [style.animationDelay.s]="p.delay" [style.width.px]="p.size" [style.height.px]="p.size"></div>
      </div>
      <div class="hero-grid">
        <!-- Left: Text Content -->
        <div class="hero-content" #animateEl>
          <div class="hero-badge">
            <span class="badge-dot"></span>
            AI-Powered Solutions
          </div>
          <h1>We Build <span class="highlight">Intelligent</span> Digital Experiences</h1>
          <p>From AI automation to web &amp; app development, WhatsApp bots to Meta Business — we engineer the future of your business.</p>
          <div class="hero-buttons">
            <a routerLink="/services" class="btn-primary">
              <span>Explore Services</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
            <a routerLink="/contact" class="btn-secondary">Get in Touch</a>
          </div>
          <div class="hero-trust">
            <span class="trust-label">Trusted by businesses worldwide</span>
          </div>
        </div>

        <!-- Right: Phone Solar System Animation -->
        
          <div class="hero-visual" #animateEl>
            <div class="hologram-container">
              <div class="hologram-beam" #hologramBeam></div>
              <div class="hologram-marquee">
                <div class="hologram-marquee-content">
                  <!-- Repeat block 1 -->
                  @for (hIcon of hologramIcons; track hIcon.class) {
                    <div class="holo-icon" #holoIcon [attr.data-color]="hIcon.color">
                      <i [class]="hIcon.class"></i>
                    </div>
                  }
                  <!-- Repeat block 2 -->
                  @for (hIcon of hologramIcons; track hIcon.class) {
                    <div class="holo-icon" #holoIcon [attr.data-color]="hIcon.color">
                      <i [class]="hIcon.class"></i>
                    </div>
                  }
                </div>
              </div>
              <svg width="606" height="600" viewBox="0 0 606 600" fill="none" class="hologram-base-svg" preserveAspectRatio="xMidYMid meet"><circle cx="258.407" cy="244.152" r="167.88" fill="url(#pattern0_3094_4332)"></circle><path d="M66.9225 599.361L123.929 566.442L123.959 562.299L64.4578 527.944L57.2904 527.959L0.269027 560.878L0.253906 565.021L59.74 599.376L66.9225 599.361Z" fill="#202221" stroke="#202221" stroke-width="0.508608" stroke-linecap="round" stroke-linejoin="round"></path><path d="M597.72 436.749C607.762 442.546 607.762 457.041 597.72 462.839L508.39 514.413C503.729 517.104 497.987 517.104 493.326 514.413L481.399 507.527C479.327 506.331 476.775 506.331 474.704 507.527L355.332 576.447C343.163 583.473 328.17 583.473 316 576.447L275.237 552.912C273.166 551.716 270.613 551.716 268.542 552.912L226.524 577.172C215.132 583.749 201.096 583.749 189.703 577.172L180.972 572.131C170.93 566.333 170.93 551.839 180.972 546.041L201.239 534.34C205.702 531.763 205.702 525.321 201.239 522.744L152.938 494.857C150.866 493.661 148.314 493.661 146.243 494.857L108.346 516.737L103.594 509.817L142.059 487.61C146.719 484.919 152.461 484.919 157.122 487.61L205.423 515.496C215.465 521.294 215.465 535.789 205.423 541.587L185.156 553.288C180.693 555.865 180.693 562.307 185.156 564.884L193.887 569.924C202.691 575.007 213.537 575.007 222.34 569.924L264.358 545.665C269.018 542.974 274.761 542.974 279.421 545.665L320.185 569.2C329.765 574.73 341.568 574.731 351.148 569.2L470.52 500.28C475.18 497.589 480.922 497.589 485.583 500.28L497.511 507.166C499.582 508.362 502.134 508.362 504.205 507.166L593.536 455.591C597.999 453.015 597.999 446.573 593.536 443.996L510.047 395.793L514.231 388.546L597.72 436.749Z" fill="#202221" stroke="#202221" stroke-width="0.418422"></path><path d="M597.72 432.003C607.763 437.8 607.763 452.295 597.72 458.093L508.39 509.667C503.729 512.358 497.987 512.358 493.327 509.667L481.399 502.781C479.328 501.585 476.776 501.585 474.704 502.781L355.332 571.701C343.163 578.727 328.17 578.726 316.001 571.701L275.237 548.166C273.166 546.97 270.614 546.97 268.542 548.166L226.524 572.426C215.132 579.003 201.096 579.003 189.703 572.426L180.972 567.385C170.93 561.587 170.93 547.093 180.972 541.295L201.239 529.594C205.702 527.017 205.702 520.575 201.239 517.998L152.938 490.111C150.866 488.915 148.314 488.915 146.243 490.111L106.604 512.998L100.152 507.058L142.059 482.864C146.719 480.173 152.461 480.173 157.122 482.864L205.424 510.75C215.466 516.548 215.466 531.043 205.424 536.841L185.156 548.542C180.693 551.119 180.693 557.561 185.156 560.138L193.888 565.178C202.691 570.261 213.537 570.261 222.34 565.178L264.358 540.919C269.019 538.228 274.761 538.228 279.421 540.919L320.185 564.454C329.765 569.984 341.568 569.984 351.148 564.454L470.52 495.534C475.181 492.843 480.923 492.843 485.583 495.534L497.511 502.42C499.582 503.616 502.134 503.616 504.206 502.42L593.536 450.845C597.999 448.269 597.999 441.827 593.536 439.25L510.047 391.047L514.231 383.8L597.72 432.003Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422"></path><path d="M287.303 531.878L159.131 459.173C159.89 439.619 160.32 428.646 161.079 409.092L295.03 333.008C329.485 332.559 348.806 332.312 383.27 331.872L511.442 404.567C510.683 424.122 510.253 435.094 509.495 454.649L375.543 530.733C341.088 531.182 321.767 531.429 287.303 531.869V531.878Z" fill="#202221" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M525.415 377.185L490.965 357.674L489.418 356.796L386.675 298.623C380.807 298.703 375.338 298.773 370.148 298.843C342.444 299.192 322.624 299.451 291.587 299.851C291.188 299.851 290.788 299.851 290.379 299.861L178.974 363.033L177.477 363.881L144.174 382.763C143.795 392.404 143.496 400.128 143.206 407.673C142.857 416.805 142.508 425.667 142.059 437.333L281.946 516.543L378.242 515.306L524.447 432.413L525.934 394.011C525.974 392.913 526.014 391.805 526.064 390.667L526.563 377.833L525.415 377.185ZM245.799 489.897L168.525 446.085V430.058L170.781 431.335V444.698L245.799 487.232V489.897ZM356.895 509.228L300.868 509.947V492.312L303.792 492.272V507.292L353.961 506.643V491.634L356.895 491.594V509.228ZM489.977 444.808L412.702 488.62V485.955L487.721 443.421V430.058L489.977 428.78V444.808Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M281.946 486.245L142.059 407.025C142.887 385.718 143.356 373.762 144.184 352.455L290.379 269.552C327.983 269.063 349.071 268.793 386.685 268.314L526.573 347.525C525.744 368.832 525.275 380.787 524.447 402.094L378.252 484.997C340.648 485.486 319.56 485.756 281.946 486.235V486.245Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M143.206 407.668L142.059 407.02V437.328L281.946 516.539V486.23L143.206 407.668ZM245.799 489.892L168.525 446.081V430.053L170.781 431.33V444.694L245.799 487.228V489.892Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M376.494 485.019L373.639 485.059L363.26 485.189L357.093 485.268L348.251 485.388L344.179 485.438L339.768 485.498L337.193 485.528L334.229 485.568L331.864 485.598L327.073 485.658L324.588 485.688L321.814 485.728L319.469 485.758L317.622 485.777L313.032 485.837L310.487 485.867L281.944 486.237V516.545L378.24 515.308V484.999L376.494 485.019ZM356.893 509.23L300.866 509.949V492.314L303.79 492.274V507.294L353.959 506.645V491.636L356.893 491.596V509.23Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M303.793 492.271V507.29L300.869 509.945V492.31L303.793 492.271Z" fill="#202221" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M356.896 509.226L300.869 509.945L303.793 507.29L353.962 506.642L356.896 509.226Z" fill="#202221" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M356.896 491.594V509.228L353.962 506.643V491.634L356.896 491.594Z" fill="#202221" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M353.962 491.634V506.643L303.793 507.292V492.272L353.962 491.634Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M353.962 491.634V506.643L303.793 507.292V492.272L353.962 491.634Z" fill="#CDEF33" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M526.562 377.842V347.533L524.437 402.103V432.412L526.562 377.842Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M378.24 484.997V515.306L524.445 432.414V402.095L378.24 484.997ZM489.975 444.809L412.701 488.62V485.956L487.719 443.421V430.058L489.975 428.781V444.809Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M489.975 444.809L412.701 488.621V485.956L487.72 443.422L489.975 444.809Z" fill="#202221" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M489.975 428.779V444.807L487.72 443.42V430.057L489.975 428.779Z" fill="#202221" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M487.72 430.06V443.423L412.701 485.957V472.604L487.72 430.06Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M487.72 430.06V443.423L412.701 485.957V472.604L487.72 430.06Z" fill="#CDEF33" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M245.798 487.231V489.896L168.523 446.084L170.779 444.697L245.798 487.231Z" fill="#202221" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M170.779 431.337V444.7L168.523 446.087V430.06L170.779 431.337Z" fill="#202221" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M245.8 473.879V487.232L170.781 444.698V431.335L245.8 473.879Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M245.8 473.879V487.232L170.781 444.698V431.335L245.8 473.879Z" fill="#CDEF33" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M291.587 466.167L177.468 401.547C178.146 384.162 178.526 374.412 179.204 357.027L298.474 289.403C329.152 289.004 346.357 288.785 377.035 288.396L491.155 353.015C490.476 370.4 490.097 380.15 489.418 397.535L370.159 465.159C339.481 465.558 322.276 465.778 291.597 466.167H291.587Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><g filter="url(#filter0_i_3094_4332)"><path d="M293.532 460.746L184.236 398.691C184.886 381.996 185.249 372.633 185.899 355.938L300.127 290.998C329.508 290.615 345.986 290.404 375.368 290.03L484.663 352.085C484.013 368.78 483.65 378.144 483 394.839L368.782 459.778C339.401 460.162 322.923 460.373 293.542 460.746H293.532Z" fill="#CDEF33"></path></g><g><path d="M293.532 460.746L184.236 398.691C184.886 381.996 185.249 372.633 185.899 355.938L300.127 290.998C329.508 290.615 345.986 290.404 375.368 290.03L484.663 352.085C484.013 368.78 483.65 378.144 483 394.839L368.782 459.778C339.401 460.162 322.923 460.373 293.542 460.746H293.532Z" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M442.728 359.763L374.158 320.175C371.075 318.387 365.675 318.611 362.114 320.666L231.336 396.17C229.437 397.265 228.35 398.725 228.35 400.185C228.35 401.399 229.109 402.501 230.48 403.291L299.057 442.886C300.457 443.691 302.327 444.085 304.293 444.085C306.662 444.085 309.157 443.512 311.101 442.387L441.879 366.883C443.778 365.788 444.866 364.329 444.866 362.869C444.866 361.662 444.106 360.552 442.728 359.763ZM441.737 366.63L310.959 442.134C307.481 444.145 302.215 444.361 299.206 442.626L230.629 403.038C229.348 402.3 228.648 401.287 228.648 400.185C228.648 398.837 229.683 397.466 231.485 396.423L362.263 320.92C365.742 318.916 371.008 318.692 374.009 320.428L442.586 360.016C443.86 360.753 444.568 361.774 444.568 362.869C444.568 364.217 443.532 365.587 441.73 366.63H441.737Z" fill="#202221" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M444.567 362.868C444.567 364.216 443.531 365.586 441.729 366.629L310.951 442.133C307.472 444.144 302.206 444.36 299.197 442.625L230.628 403.037C229.347 402.299 228.646 401.286 228.646 400.184C228.646 398.836 229.682 397.465 231.484 396.422L362.262 320.919C365.741 318.915 371.007 318.692 374.008 320.427L442.585 360.015C443.859 360.752 444.567 361.773 444.567 362.868Z" fill="#202221" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M443.691 341.783L433.844 343.482L373.066 308.392C370.019 306.635 364.694 306.851 361.171 308.884L244.887 376.016L227.473 379.01V385.185C227.465 386.31 228.136 387.39 229.521 388.187L298.09 427.774C301.137 429.532 306.462 429.316 309.985 427.283L440.764 351.779C442.655 350.684 443.639 349.291 443.668 347.958H443.676V341.783H443.691Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M298.107 421.56L229.53 381.972C226.483 380.214 226.863 377.138 230.386 375.105L361.164 299.601C364.687 297.567 370.013 297.344 373.059 299.109L441.629 338.697C444.675 340.455 444.295 343.531 440.772 345.565L309.994 421.068C306.471 423.102 301.146 423.325 298.099 421.56H298.107Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M440.779 345.569L310.001 421.073C306.478 423.106 301.153 423.33 298.106 421.564L229.529 381.976C228.308 381.269 227.645 380.353 227.503 379.377C227.317 380.643 227.973 381.88 229.529 382.781L298.099 422.369C301.145 424.127 306.471 423.911 309.994 421.877L440.772 346.373C442.88 345.159 443.856 343.565 443.647 342.105C443.468 343.327 442.5 344.571 440.772 345.569H440.779Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M298.24 420.027L232.113 381.839C229.164 380.133 229.536 377.162 232.94 375.195L361.29 301.114C364.694 299.148 369.848 298.932 372.798 300.637L438.924 338.825C441.874 340.531 441.501 343.502 438.097 345.469L309.748 419.55C306.344 421.516 301.189 421.732 298.24 420.027Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><g opacity="0.8" style="mix-blend-mode: lighten;"><path d="M303.238 419.679C301.324 419.679 299.499 419.291 298.136 418.509L232.002 380.322C230.646 379.539 229.901 378.452 229.901 377.253C229.901 375.823 230.966 374.385 232.829 373.305L361.178 299.224C364.634 297.228 369.9 297.012 372.902 298.747L439.029 336.935C440.384 337.717 441.129 338.804 441.129 340.004C441.129 341.434 440.064 342.871 438.202 343.951L309.852 418.033C307.96 419.12 305.532 419.679 303.23 419.679H303.238ZM298.344 418.137C301.234 419.805 306.299 419.589 309.643 417.66L437.993 343.579C439.714 342.581 440.704 341.277 440.704 340.004C440.704 338.961 440.034 338.007 438.82 337.3L372.694 299.112C369.804 297.444 364.739 297.66 361.394 299.589L233.045 373.67C231.324 374.668 230.333 375.972 230.333 377.245C230.333 378.288 231.004 379.242 232.218 379.949L298.344 418.137Z" fill="#D9D9D9"></path><path d="M303.238 419.679C301.324 419.679 299.499 419.291 298.136 418.509L232.002 380.322C230.646 379.539 229.901 378.452 229.901 377.253C229.901 375.823 230.966 374.385 232.829 373.305L361.178 299.224C364.634 297.228 369.9 297.012 372.902 298.747L439.029 336.935C440.384 337.717 441.129 338.804 441.129 340.004C441.129 341.434 440.064 342.871 438.202 343.951L309.852 418.033C307.96 419.12 305.532 419.679 303.23 419.679H303.238ZM298.344 418.137C301.234 419.805 306.299 419.589 309.643 417.66L437.993 343.579C439.714 342.581 440.704 341.277 440.704 340.004C440.704 338.961 440.034 338.007 438.82 337.3L372.694 299.112C369.804 297.444 364.739 297.66 361.394 299.589L233.045 373.67C231.324 374.668 230.333 375.972 230.333 377.245C230.333 378.288 231.004 379.242 232.218 379.949L298.344 418.137Z" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path></g><path d="M424.801 340.887C423.788 341.468 422.156 341.468 421.144 340.887C420.131 340.306 420.131 339.36 421.144 338.779C422.156 338.199 423.788 338.199 424.801 338.779C425.814 339.36 425.814 340.306 424.801 340.887Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M410.853 330.723L418.011 334.856C418.883 335.363 418.778 336.242 417.766 336.823C416.753 337.404 415.226 337.471 414.354 336.964L407.196 332.83C406.325 332.324 406.429 331.445 407.442 330.864C408.455 330.283 409.982 330.216 410.853 330.723Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M370.034 305.942L377.192 310.076C378.063 310.583 377.959 311.462 376.946 312.043C375.933 312.624 374.406 312.691 373.535 312.184L366.377 308.05C365.506 307.544 365.61 306.665 366.623 306.084C367.636 305.503 369.163 305.436 370.034 305.942Z" fill="#D9D9D9" stroke="#202221" stroke-width="0.418422" stroke-miterlimit="10"></path><path d="M330.562 381.518C321.579 381.518 312.589 379.544 305.752 375.596C299.1 371.753 295.436 366.644 295.436 361.199C295.436 355.754 299.1 350.645 305.752 346.801C319.434 338.898 341.69 338.906 355.372 346.801C362.024 350.645 365.688 355.754 365.688 361.199C365.688 366.644 362.024 371.761 355.372 375.596C348.535 379.544 339.545 381.518 330.562 381.518ZM330.562 341.133C321.624 341.133 312.686 343.099 305.878 347.025C299.309 350.816 295.696 355.851 295.696 361.199C295.696 366.547 299.316 371.582 305.886 375.373C319.494 383.231 341.638 383.231 355.246 375.373C361.815 371.582 365.428 366.547 365.428 361.199C365.428 355.851 361.808 350.816 355.238 347.025C348.431 343.092 339.493 341.133 330.554 341.133H330.562Z" fill="#D9D9D9"></path><path d="M330.562 340.874C321.579 340.874 312.589 342.848 305.752 346.795C299.1 350.639 295.436 355.748 295.436 361.193C295.436 366.638 299.1 371.755 305.752 375.591C312.589 379.538 321.579 381.512 330.562 381.512C339.545 381.512 348.535 379.538 355.372 375.591C362.024 371.747 365.688 366.638 365.688 361.193C365.688 355.748 362.024 350.631 355.372 346.795C348.535 342.848 339.545 340.874 330.562 340.874ZM330.562 381.266C321.624 381.266 312.686 379.3 305.878 375.375C299.309 371.584 295.689 366.548 295.689 361.201C295.689 355.853 299.309 350.818 305.871 347.026C312.678 343.094 321.616 341.135 330.554 341.135C339.493 341.135 348.431 343.101 355.238 347.026C361.808 350.818 365.428 355.853 365.428 361.201C365.428 366.548 361.808 371.584 355.246 375.375C348.438 379.307 339.5 381.266 330.562 381.266Z" fill="#202221"></path><path d="M330.56 386.971C319.156 386.971 307.753 384.468 299.075 379.455C290.644 374.584 285.996 368.104 285.996 361.207C285.996 354.31 290.644 347.822 299.075 342.959C316.437 332.933 344.682 332.933 362.044 342.959C370.475 347.83 375.123 354.31 375.123 361.207C375.123 368.104 370.475 374.592 362.044 379.455C353.366 384.468 341.963 386.971 330.56 386.971ZM330.56 335.682C319.201 335.682 307.85 338.177 299.202 343.167C290.852 347.986 286.249 354.392 286.249 361.192C286.249 368 290.845 374.398 299.202 379.217C316.49 389.198 344.622 389.198 361.91 379.217C370.259 374.398 374.862 367.992 374.862 361.192C374.862 354.392 370.267 347.986 361.91 343.167C353.262 338.177 341.911 335.682 330.552 335.682H330.56Z" fill="#D9D9D9"></path><path d="M330.56 335.431C319.156 335.431 307.753 337.933 299.075 342.946C290.644 347.817 285.996 354.297 285.996 361.194C285.996 368.092 290.644 374.579 299.075 379.443C307.753 384.456 319.156 386.958 330.56 386.958C341.963 386.958 353.366 384.456 362.044 379.443C370.475 374.572 375.123 368.092 375.123 361.194C375.123 354.297 370.475 347.81 362.044 342.946C353.359 337.933 341.963 335.431 330.56 335.431ZM330.56 386.72C319.201 386.72 307.85 384.225 299.202 379.234C290.852 374.415 286.249 368.01 286.249 361.209C286.249 354.402 290.845 348.003 299.202 343.184C307.85 338.194 319.201 335.699 330.56 335.699C341.918 335.699 353.27 338.194 361.917 343.184C370.267 348.003 374.87 354.409 374.87 361.209C374.87 368.01 370.274 374.415 361.917 379.234C353.27 384.225 341.918 386.72 330.56 386.72Z" fill="#202221"></path><path d="M330.557 377.23C323.473 377.23 316.397 375.673 311.005 372.56C305.761 369.528 302.871 365.491 302.871 361.194C302.871 356.896 305.761 352.859 311.005 349.827C321.79 343.601 339.331 343.601 350.108 349.827C355.352 352.859 358.242 356.896 358.242 361.194C358.242 365.491 355.352 369.528 350.108 372.56C344.716 375.673 337.64 377.23 330.557 377.23ZM330.557 345.425C323.525 345.425 316.487 346.975 311.131 350.066C305.97 353.045 303.124 357 303.124 361.208C303.124 365.417 305.97 369.364 311.131 372.351C321.842 378.533 339.271 378.533 349.982 372.351C355.144 369.372 357.989 365.417 357.989 361.208C357.989 357 355.144 353.052 349.982 350.066C344.627 346.975 337.595 345.425 330.557 345.425Z" fill="#D9D9D9"></path><path d="M330.557 345.17C323.473 345.17 316.397 346.727 311.005 349.84C305.761 352.872 302.871 356.909 302.871 361.206C302.871 365.504 305.761 369.541 311.005 372.572C316.397 375.686 323.473 377.242 330.557 377.242C337.64 377.242 344.716 375.686 350.108 372.572C355.352 369.541 358.242 365.504 358.242 361.206C358.242 356.909 355.352 352.872 350.108 349.84C344.716 346.727 337.64 345.17 330.557 345.17ZM330.557 376.974C323.525 376.974 316.487 375.425 311.131 372.334C305.97 369.355 303.124 365.4 303.124 361.191C303.124 356.983 305.97 353.035 311.131 350.049C316.487 346.958 323.518 345.408 330.557 345.408C337.595 345.408 344.627 346.958 349.982 350.049C355.144 353.028 357.989 356.983 357.989 361.191C357.989 365.4 355.144 369.347 349.982 372.334C344.627 375.425 337.595 376.974 330.557 376.974Z" fill="#202221"></path><path d="M268.923 383.713L269.854 383.177L276.029 386.745L275.098 387.281L268.923 383.713Z" fill="#D9D9D9"></path><path d="M269.851 383.391L275.654 386.742L275.095 387.063L269.293 383.711L269.851 383.391ZM269.851 382.959L268.548 383.711L275.095 387.487L276.398 386.735L269.851 382.951V382.959Z" fill="#202221"></path><path d="M291.916 397.254L292.847 396.718L294.486 397.664L293.555 398.2L291.916 397.254Z" fill="#D9D9D9"></path><path d="M292.845 396.936L294.112 397.666L293.553 397.986L292.287 397.256L292.845 396.936ZM292.845 396.504L291.542 397.256L293.553 398.418L294.857 397.666L292.845 396.504Z" fill="#202221"></path><path d="M277.249 388.573L278.18 388.037L279.819 388.983L278.888 389.519L277.249 388.573Z" fill="#D9D9D9"></path><path d="M278.181 388.255L279.448 388.985L278.889 389.305L277.623 388.575L278.181 388.255ZM278.181 387.83L276.878 388.582L278.889 389.744L280.192 388.992L278.181 387.83Z" fill="#202221"></path><path d="M298.947 406.928C297.755 406.928 296.563 406.623 295.498 406.004L254.592 382.386C253.981 382.028 253.616 381.395 253.616 380.687C253.616 379.98 253.981 379.347 254.592 378.989L260.834 375.354C262.964 374.125 265.601 374.125 267.731 375.354L308.637 398.973C309.248 399.323 309.613 399.964 309.613 400.671C309.613 401.379 309.248 402.012 308.637 402.37L302.395 406.004C301.33 406.615 300.139 406.928 298.947 406.928ZM264.29 374.736C263.15 374.736 262.01 375.027 260.99 375.615L254.748 379.25C254.227 379.548 253.914 380.092 253.914 380.687C253.914 381.283 254.227 381.827 254.748 382.125L295.655 405.744C297.688 406.92 300.221 406.92 302.254 405.744L308.496 402.109C309.017 401.811 309.33 401.275 309.33 400.671C309.33 400.068 309.017 399.532 308.496 399.234L267.589 375.615C266.569 375.027 265.429 374.736 264.29 374.736Z" fill="#D9D9D9"></path><path d="M264.288 374.438C263.096 374.438 261.905 374.744 260.84 375.362L254.598 378.997C253.987 379.354 253.622 379.988 253.622 380.695C253.622 381.403 253.987 382.036 254.598 382.393L295.504 406.012C296.569 406.623 297.761 406.936 298.953 406.936C300.144 406.936 301.336 406.63 302.401 406.012L308.643 402.377C309.254 402.027 309.619 401.387 309.619 400.679C309.619 399.971 309.254 399.338 308.643 398.981L267.737 375.362C266.672 374.751 265.48 374.438 264.288 374.438ZM298.945 406.63C297.806 406.63 296.666 406.34 295.646 405.751L254.739 382.133C254.218 381.835 253.905 381.291 253.905 380.695C253.905 380.099 254.218 379.555 254.739 379.258L260.981 375.623C262.001 375.034 263.141 374.744 264.281 374.744C265.42 374.744 266.56 375.034 267.58 375.623L308.487 399.241C309.008 399.539 309.321 400.076 309.321 400.679C309.321 401.282 309.008 401.819 308.487 402.117L302.245 405.751C301.224 406.34 300.085 406.63 298.945 406.63Z" fill="#202221"></path></g></svg>
            </div>
          </div>

      </div>
    </section>

    <section class="services-stacked">
      <div class="container">
        <div class="section-header" #animateEl>
          <h2 class="section-title">What We Do</h2>
          <p class="section-subtitle">Comprehensive IT solutions tailored to your business needs</p>
        </div>
        
        <div class="stacked-cards-container">
          @for (service of services; track service.title; let i = $index) {
            <div class="stacked-card" [style.top.px]="140 + i * 20" [class.highlighted]="service.highlighted">
              <div class="card-inner">
                <div class="card-icon" [style.color]="service.color">
                  <i [class]="service.icon"></i>
                </div>
                <div class="card-content">
                  <h3>{{ service.title }}</h3>
                  <p>{{ service.description }}</p>
                </div>
                <div class="card-arrow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          }
        </div>
        
        <div class="cta-center" #animateEl>
          <a routerLink="/services" class="btn-primary">View All Services</a>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <div class="cta-content" #animateEl>
          <h2>Ready to Start Your Project?</h2>
          <p>Let's discuss how we can help transform your ideas into reality.</p>
          <a routerLink="/contact" class="btn-primary">Contact Us Today</a>
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('hologramBeam') hologramBeam!: ElementRef;
  @ViewChildren('holoIcon') holoIcons!: QueryList<ElementRef>;
  @ViewChild('servicesWrapper') servicesWrapper!: ElementRef;
  private renderId?: number;

  currentIST = '';
  private timeInterval: any;
  @ViewChildren('animateEl') animateElements!: QueryList<ElementRef>;
  
  // Scroll tracking for stats removed as it was part of specific manual logic,
  // the remaining logic is pure CSS using IntersectionObserver for stats.

  // Hero animation data
  particles = Array.from({ length: 20 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    size: Math.random() * 4 + 2
  }));

  // Hologram passing icons
  hologramIcons = [
    { class: 'fa-brands fa-meta', color: 'rgb(0, 92, 255)' },
    { class: 'fa-brands fa-whatsapp', color: '#25D366' },
    { class: 'fa-solid fa-globe', color: '#3b82f6' },
    { class: 'fa-solid fa-database', color: '#f29111' },
    { class: 'fa-brands fa-angular', color: '#f40f52' },
    { class: 'fa-brands fa-react', color: '#61dafb' },
    { class: 'fa-brands fa-python', color: '#3776ab' },
    { class: 'fa-brands fa-bots', color: '#10b981' },
    { class: 'fa-brands fa-node', color: '#339933' },
    { class: 'fa-solid fa-network-wired', color: '#a855f7' }
  ];

  services = [
    { icon: 'fa-solid fa-globe', title: 'Web Development', description: 'Modern, responsive websites built with the latest technologies.', featured: true, highlighted: false, color: '#3b82f6' },
    { icon: 'fa-solid fa-mobile-screen-button', title: 'App Development', description: 'Native and cross-platform mobile applications.', featured: false, highlighted: true, color: '#a855f7' },
    { icon: 'fa-solid fa-cart-shopping', title: 'E-commerce', description: 'Complete online store solutions to grow your business.', featured: true, highlighted: false, color: '#ec4899' },
    { icon: 'fa-solid fa-store', title: 'Local Business Software', description: 'Custom software for local business operations.', featured: false, highlighted: true, color: '#f59e0b' },
    { icon: 'fa-solid fa-robot', title: 'AI Chatbots', description: 'Intelligent chatbots for 24/7 customer support.', featured: true, highlighted: false, color: '#10b981' },
    { icon: 'fa-solid fa-bolt', title: 'Automation', description: 'Streamline your workflows with smart automation.', featured: false, highlighted: true, color: '#00d8ff' }
  ];

  constructor(
    private scrollAnimation: ScrollAnimationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.updateIST();
    if (isPlatformBrowser(this.platformId)) {
      this.timeInterval = setInterval(() => this.updateIST(), 1000);
    }
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
  
    if (this.renderId && isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.renderId);
    }
  }

  private checkIconsInBeam = () => {
    if (this.hologramBeam && this.holoIcons?.length) {
        // READ PHASE: Batched DOM reads
        const beamRect = this.hologramBeam.nativeElement.getBoundingClientRect();
        const beamCenterX = beamRect.left + beamRect.width / 2;
        const beamRadius = 40;
        
        const updates: { el: HTMLElement, inBeam: boolean }[] = [];

        this.holoIcons.forEach(icon => {
            const el = icon.nativeElement;
            const iconRect = el.getBoundingClientRect();
            const iconCenterX = iconRect.left + iconRect.width / 2;
            const distance = Math.abs(iconCenterX - beamCenterX);
            
            updates.push({
                el,
                inBeam: distance < beamRadius
            });
        });
        
        // WRITE PHASE: Batched DOM writes to prevent layout thrashing
        updates.forEach(update => {
            if (update.inBeam) {
                if (!update.el.classList.contains('in-beam')) {
                    update.el.classList.add('in-beam');
                }
            } else {
                if (update.el.classList.contains('in-beam')) {
                    update.el.classList.remove('in-beam');
                }
            }
        });
        
        this.renderId = requestAnimationFrame(this.checkIconsInBeam);
    }
  }


  private updateIST() {
    const now = new Date();
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const h = ist.getHours();
    const m = ist.getMinutes();
    this.currentIST = `${h}:${m < 10 ? '0' + m : m}`;
  }

  ngAfterViewInit() {
    this.animateElements.forEach(el => this.scrollAnimation.observe(el.nativeElement));
    
    // Set static colors once instead of every animation frame
    if (this.holoIcons) {
      this.holoIcons.forEach(icon => {
        const el = icon.nativeElement;
        const color = el.getAttribute('data-color');
        if (color) {
          el.style.setProperty('--icon-color', color);
        }
      });
    }

    if (isPlatformBrowser(this.platformId)) {

      this.checkIconsInBeam();
    }
  }
}
