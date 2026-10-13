/* ============================================================
   interaction.js — Scroll-Triggered Panel Reveal Controller
   
   Simplified for manhwa-style reading:
   1. IntersectionObserver watches every .panel element
   2. When a panel enters the viewport → adds .in-view (fade in)
   3. When it leaves                  → removes .in-view
   4. CSS handles all visual transitions based on that class
   ============================================================ */

(function () {
  'use strict';

  // ---- Config ----
  const VIEWPORT_MARGIN  = '0px 0px -5% 0px';   // trigger just before panel is visible
  const THRESHOLD        = 0.05;                 // 5% visible = "in view" (fast reveal for reading)

  // ---- Scroll progress bar ----
  const progressBar = document.querySelector('.scroll-progress');

  function updateProgress() {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // ---- IntersectionObserver for panels ----
  const panels = document.querySelectorAll('.panel');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const panel = entry.target;

      if (entry.isIntersecting) {
        panel.classList.add('in-view');
      } else {
        panel.classList.remove('in-view');
      }
    });
  }, {
    rootMargin: VIEWPORT_MARGIN,
    threshold: THRESHOLD,
  });

  panels.forEach((panel) => observer.observe(panel));

  // ---- Expose API for future scripting ----
  window.WebcomicScroll = {
    /** Force a panel to enter "in-view" state */
    activate(panelEl) {
      panelEl.classList.add('in-view');
    },
    /** Force a panel out of "in-view" state */
    deactivate(panelEl) {
      panelEl.classList.remove('in-view');
    },
    /** Re-scan for new panels (call after dynamically adding panels) */
    refresh() {
      document.querySelectorAll('.panel:not([data-observed])').forEach((p) => {
        observer.observe(p);
        p.dataset.observed = 'true';
      });
    },
  };
})();
