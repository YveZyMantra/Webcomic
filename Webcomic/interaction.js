/* ============================================================
   interaction.js — Scroll-Triggered Animation Controller
   
   How it works:
   1. IntersectionObserver watches every .panel element
   2. When a panel enters the viewport → adds .in-view
   3. When it leaves                  → removes .in-view
   4. CSS handles all visual transitions based on that class
   
   To hook custom behavior per-panel, use data attributes:
     data-anim-once="true"   → animation fires only the first time
     data-anim-delay="300"   → delay (ms) before .in-view is added
     data-anim-video         → auto-play/pause a <video> inside the panel
   ============================================================ */

(function () {
  'use strict';

  // ---- Config ----
  const VIEWPORT_MARGIN  = '0px 0px -10% 0px';   // trigger a bit before fully in view
  const THRESHOLD        = 0.15;                  // 15% visible = "in view"

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
      const panel     = entry.target;
      const once      = panel.dataset.animOnce === 'true';
      const delay     = parseInt(panel.dataset.animDelay, 10) || 0;
      const hasVideo  = panel.hasAttribute('data-anim-video');

      if (entry.isIntersecting) {
        // Add .in-view (with optional delay)
        if (delay > 0) {
          panel._animTimer = setTimeout(() => {
            panel.classList.add('in-view');
            if (hasVideo) playVideo(panel);
          }, delay);
        } else {
          panel.classList.add('in-view');
          if (hasVideo) playVideo(panel);
        }

        // If once-only, stop observing after it enters
        if (once) observer.unobserve(panel);

      } else {
        // Remove .in-view so it can re-trigger on next scroll
        clearTimeout(panel._animTimer);
        if (!once || !panel.classList.contains('in-view')) {
          panel.classList.remove('in-view');
          if (hasVideo) pauseVideo(panel);
        }
      }
    });
  }, {
    rootMargin: VIEWPORT_MARGIN,
    threshold: THRESHOLD,
  });

  panels.forEach((panel) => observer.observe(panel));

  // ---- Video helpers ----
  function playVideo(panel) {
    const video = panel.querySelector('video');
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {}); // ignore autoplay restrictions silently
    }
  }

  function pauseVideo(panel) {
    const video = panel.querySelector('video');
    if (video) {
      video.pause();
    }
  }

  // ---- Sprite-sheet helper (optional) ----
  /*
    If you want frame-by-frame sprite animation, add:
      data-sprite-src="sprite.png"
      data-sprite-cols="8"
      data-sprite-rows="4"
      data-sprite-fps="12"
    to a .panel__anim <div>. This function will cycle through frames.
  */
  function initSpriteSheets() {
    document.querySelectorAll('[data-sprite-src]').forEach((el) => {
      const cols = parseInt(el.dataset.spriteCols, 10) || 1;
      const rows = parseInt(el.dataset.spriteRows, 10) || 1;
      const fps  = parseInt(el.dataset.spriteFps, 10)  || 12;
      const totalFrames = cols * rows;
      let frame = 0;
      let intervalId = null;

      el.style.backgroundImage    = `url(${el.dataset.spriteSrc})`;
      el.style.backgroundSize     = `${cols * 100}% ${rows * 100}%`;
      el.style.backgroundRepeat   = 'no-repeat';

      // Watch for in-view on parent .panel
      const panel = el.closest('.panel');
      if (!panel) return;

      const spriteObserver = new MutationObserver(() => {
        if (panel.classList.contains('in-view')) {
          if (!intervalId) {
            frame = 0;
            intervalId = setInterval(() => {
              const col = frame % cols;
              const row = Math.floor(frame / cols) % rows;
              el.style.backgroundPosition =
                `-${col * 100}% -${row * 100}%`;
              frame = (frame + 1) % totalFrames;
            }, 1000 / fps);
          }
        } else {
          clearInterval(intervalId);
          intervalId = null;
        }
      });

      spriteObserver.observe(panel, {
        attributes: true,
        attributeFilter: ['class'],
      });
    });
  }

  initSpriteSheets();

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
