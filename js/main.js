/**
 * Perun Design - Main initialization
 * Custom cursor, Lenis, GSAP animations
 */
(function() {
  'use strict';

  // Config
  const TRANSITION_FAST = 0.25;
  const TRANSITION_NORMAL = 0.4;
  const TRANSITION_SLOW = 1;
  const TRANSITION_SLOWER = 1.5;

  function checkIsMobile() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  // Register GSAP plugins and custom easings
  if (typeof gsap !== 'undefined') {
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }
    if (typeof CustomEase !== 'undefined') {
      CustomEase.create('ease-primary', '0.87, 0, 0.13, 1');
      CustomEase.create('ease-secondary', '0.31, 0.75, 0.22, 1');
      CustomEase.create('ease-transition', '0.16, 1, 0.3, 1');
    }
  }

  // =========================================
  // Grain Overlay
  // =========================================
  function initGrain() {
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = 256;
    grainCanvas.height = 256;
    const ctx = grainCanvas.getContext('2d');
    const imageData = ctx.createImageData(256, 256);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = v;
      pixels[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    const grainEl = document.querySelector('.grain-overlay');
    if (grainEl) {
      grainEl.style.backgroundImage = 'url(' + grainCanvas.toDataURL('image/png') + ')';
    }
  }

  // =========================================
  // Custom Cursor
  // =========================================
  function initCursor() {
    if (checkIsMobile()) {
      document.body.classList.add('no-cursor');
      return;
    }

    const cursor = document.querySelector('.cursor');
    if (!cursor || typeof gsap === 'undefined') return;

    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    window.addEventListener('mousemove', function(e) {
      gsap.set(cursor, { x: e.clientX, y: e.clientY });
    });

    window.addEventListener('mousedown', function() {
      gsap.to(cursor, { scale: 0.82, duration: 0.4, ease: 'power2.out' });
    });

    window.addEventListener('mouseup', function() {
      gsap.to(cursor, { scale: 1, duration: 0.3, ease: 'power2.out' });
    });

    var interactiveSelectors = '[data-cursor], a, button, [role="button"]';
    document.querySelectorAll(interactiveSelectors).forEach(function(el) {
      const label = el.getAttribute('data-cursor');
      const labelEl = cursor.querySelector('p');

      el.addEventListener('mouseenter', function() {
        cursor.classList.add('cursor--hover');
        if (labelEl && label) {
          labelEl.textContent = label || '';
          gsap.fromTo(labelEl, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' });
        }
      });

      el.addEventListener('mouseleave', function() {
        cursor.classList.remove('cursor--hover');
        if (labelEl && label) {
          gsap.to(labelEl, { y: 15, opacity: 0, duration: 0.2 });
        }
      });
    });
  }

  // =========================================
  // Works Lightbox (slide from top)
  // =========================================
  function initShowreel() {
    const triggers = document.querySelectorAll('[data-showreel-trigger]');
    const lightbox = document.querySelector('[data-showreel-wrap]');
    const closeBtn = document.querySelector('[data-showreel-close]');
    const panel = lightbox ? lightbox.querySelector('.works_lightbox_panel') : null;
    const lenis = window.lenis;

    if (!triggers.length || !lightbox || !panel || typeof gsap === 'undefined') return;

    let isOpen = false;

    function openShowreel(e) {
      if (e) e.preventDefault();
      if (isOpen) return;
      isOpen = true;

      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();

      lightbox.classList.add('is-open');
      lightbox.removeAttribute('aria-hidden');
      lightbox.setAttribute('aria-modal', 'true');

      gsap.fromTo(lightbox, { height: 0 }, {
        height: '100vh',
        duration: 0.9,
        ease: 'power3.inOut',
        overwrite: true
      });

      gsap.fromTo(panel, { y: -60 }, {
        y: 0,
        duration: 0.9,
        ease: 'power3.inOut',
        overwrite: true
      });

      gsap.fromTo(panel.querySelectorAll('.works_lightbox_header > *'), { y: -12, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
        delay: 0.15
      });

      gsap.fromTo(panel.querySelectorAll('.works_item'), { y: 24, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        delay: 0.25
      });

      // Play videos only when visible to avoid dual decode freeze
      const videos = panel.querySelectorAll('video');
      const videoObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var v = entry.target;
          if (entry.isIntersecting) {
            v.play().catch(function() {});
          } else {
            v.pause();
          }
        });
      }, { root: lightbox, rootMargin: '20%', threshold: 0.1 });
      videos.forEach(function(v) { videoObserver.observe(v); });
      lightbox._videoObserver = videoObserver;
    }

    function closeShowreel() {
      if (!isOpen) return;
      isOpen = false;

      if (lightbox._videoObserver) {
        lightbox._videoObserver.disconnect();
        lightbox._videoObserver = null;
      }
      panel.querySelectorAll('video').forEach(function(v) { v.pause(); });

      gsap.to(panel, {
        y: -60,
        duration: 0.7,
        ease: 'power3.inOut',
        overwrite: true
      });

      gsap.to(lightbox, {
        height: 0,
        duration: 0.7,
        ease: 'power3.inOut',
        overwrite: true,
        onComplete: function() {
          lightbox.classList.remove('is-open');
          lightbox.setAttribute('aria-hidden', 'true');
          lightbox.removeAttribute('aria-modal');
          document.body.style.overflow = 'auto';
          if (lenis) lenis.start();
        }
      });
    }

    triggers.forEach(function(trigger) {
      trigger.addEventListener('click', openShowreel);
      trigger.addEventListener('keydown', function(e) {
        if ((e.key === 'Enter' || e.key === ' ') && trigger.getAttribute('role') === 'button') {
          e.preventDefault();
          openShowreel(e);
        }
      });
    });
    if (closeBtn) closeBtn.addEventListener('click', closeShowreel);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) closeShowreel();
    });
  }

  // =========================================
  // Lenis Smooth Scroll
  // =========================================
  function initLenis() {
    if (typeof Lenis === 'undefined' || typeof gsap === 'undefined') return;

    const lenis = new Lenis({
      duration: 0.8,
      prevent: (node) => node.closest && node.closest('.works_lightbox')
    });
    window.lenis = lenis;

    lenis.on('scroll', typeof ScrollTrigger !== 'undefined' ? ScrollTrigger.update : function() {});

    gsap.ticker.add(function(time) {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
    lenis.scrollTo(0, { immediate: true, force: true, lock: true, duration: 0.0166 });
  }

  // =========================================
  // Current Time
  // =========================================
  function initClock() {
    const timezone = 'America/New_York';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    function update() {
      const time = formatter.format(new Date());
      document.querySelectorAll('[data-current-time]').forEach(function(el) {
        el.textContent = time.toLowerCase();
      });
    }

    update();
    setInterval(update, 1000);
  }

  // =========================================
  // Page Load Animations
  // =========================================
  function initPageAnimations() {
    const page = document.getElementById('page');
    if (!page || typeof gsap === 'undefined') return;

    const navbar = document.querySelector('.navbar');
    const headerMain = document.querySelector('.header_main');
    const headerContent = document.querySelector('.header_content');
    const canvasPill = document.querySelector('.canvas_pill');
    const marqueeWrap = document.querySelector('.marquee_wrap');
    const footer = document.querySelector('.footer');

    gsap.set(page, { autoAlpha: 0 });

    const tl = gsap.timeline({
      onComplete: function() {
        page.classList.add('is-visible');
        document.body.style.overflowX = 'hidden';
        document.body.style.overflowY = 'auto';
        if (window.lenis) window.lenis.resize();
      }
    });

    tl.to(page, { autoAlpha: 1, duration: 1, ease: 'power2.out' });

    if (navbar) {
      const navName = navbar.querySelector('.nav-name');
      const navPills = navbar.querySelectorAll('.nav-cta_pill');
      if (navName) {
        tl.from(navName, {
          y: 12,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          clearProps: 'opacity,transform'
        }, 0.1);
      }
      if (navPills.length) {
        tl.to(navPills, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'transform'
        }, 0.3);
      }
    }

    if (headerMain) {
      tl.from(headerMain.querySelector('.header_headline'), {
        y: 24,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out'
      }, 0.15);
      tl.from(headerMain.querySelectorAll('.header_body'), {
        y: 18,
        opacity: 0,
        duration: 0.75,
        stagger: 0.08,
        ease: 'power2.out'
      }, 0.3);
    }

    if (headerContent) {
      const servicesCol = headerContent.querySelector('.header_col--services');
      const connectCol = headerContent.querySelector('.header_col--connect');
      const cols = [servicesCol, connectCol].filter(Boolean);

      cols.forEach(function(col, i) {
        const title = col.querySelector('.side_block_title');
        const line = col.querySelector('.side_block_line');
        const items = col.querySelectorAll('.side_block_item');

        if (title) {
          tl.from(title, {
            y: 18,
            opacity: 0,
            duration: 0.75,
            ease: 'power2.out'
          }, 0.4 + i * 0.04);
        }
        if (line) {
          tl.from(line, {
            y: 18,
            opacity: 0,
            duration: 0.75,
            ease: 'power2.out'
          }, 0.45 + i * 0.04);
        }
        if (items.length) {
          var itemsArr;
          if (col.classList.contains('header_col--connect')) {
            var linkedIn = col.querySelector('a[href*="linkedin"]');
            var github = col.querySelector('a[href*="github"]');
            var email = col.querySelector('a[href*="mailto"]');
            itemsArr = [linkedIn, github, email].filter(Boolean);
          } else {
            itemsArr = Array.from(items);
          }
          tl.from(itemsArr, {
            y: 18,
            opacity: 0,
            duration: 0.75,
            stagger: 0.08,
            ease: 'power2.out'
          }, 0.5 + i * 0.04);
        }
      });
    }

    if (canvasPill) {
      tl.from(canvasPill, {
        y: 20,
        opacity: 0,
        duration: 0.85,
        ease: 'power2.out'
      }, 0.55);
    }

    if (marqueeWrap) {
      tl.from(marqueeWrap, {
        y: 18,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out'
      }, 0.7);
    }

    if (footer) {
      tl.from(footer, {
        y: 15,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out'
      }, 0.8);
    }
  }

  // =========================================
  // Init
  // =========================================
  function init() {
    initGrain();
    initClock();
    initCursor();
    initShowreel();
    initLenis();

    if (typeof gsap !== 'undefined') {
      gsap.delayedCall(0.1, initPageAnimations);
    } else {
      const page = document.getElementById('page');
      if (page) page.classList.add('is-visible');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
