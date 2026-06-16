/* ------------------------------------------------------------------
 * reviews.js — populates the homepage testimonials marquee (section 002)
 * from /static/data/reviews.json. Two rows scroll in opposite directions
 * (pure-CSS marquee). A card is not a link, but clicking it opens the
 * full review in an overlay (useful for long quotes). Vanilla JS.
 *
 * To add a review: edit /static/data/reviews.json only. No change here.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }

  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  var EXPAND = '<span class="rv-expand" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></span>';

  // Source logos (official brand marks) shown top-right of each card.
  var LOGO = {
    Upwork: '<svg viewBox="0 0 24 24" fill="#6fda44" aria-hidden="true"><path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.211 2.703 2.703 0 1.489-1.211 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/></svg>',
    Google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>'
  };

  function stars(n) {
    n = Math.max(0, Math.min(5, n | 0)) || 5;
    return '<span class="rv-stars" aria-label="' + n + ' von 5 Sternen">' + STAR.repeat(n) + '</span>';
  }

  // `decorative` cards live in the aria-hidden duplicate track: they must not
  // be focusable or expose a button role, otherwise assistive tech reaches
  // interactive elements inside an aria-hidden subtree (an a11y violation).
  // role="button" sits on a <div>, not <article>, since <article> does not
  // allow the button role.
  function card(r, decorative) {
    var body;
    if (r.text) {
      body = '<p class="rv-quote">' + esc(r.text) + '</p>';
    } else if (Array.isArray(r.tags)) {
      body = '<div class="rv-tags">' + r.tags.map(function (t) {
        return '<span class="rv-tag">' + esc(t) + '</span>';
      }).join('') + '</div>';
    } else {
      body = '';
    }
    var proj = '<p class="rv-proj"><b>' + esc(r.project || '') + '</b>' + esc(r.projectSub || '') + '</p>';
    var src = '<span class="rv-src" aria-label="' + esc(r.source || '') + '" title="' + esc(r.source || '') + '">' + (LOGO[r.source] || esc(r.source || '')) + '</span>';
    var attrs = decorative ? '' : ' tabindex="0" role="button"';
    return '<div class="rv-card"' + attrs + '>' +
      '<div class="rv-top">' + stars(r.stars) + src + '</div>' +
      body + proj + EXPAND + '</div>';
  }

  // One row = two tracks back-to-back for a seamless loop. The first is the
  // live, interactive copy; the second is an aria-hidden, inert duplicate.
  function row(list, reverse) {
    var live = list.map(function (r) { return card(r, false); }).join('');
    var dup = list.map(function (r) { return card(r, true); }).join('');
    var cls = 'rv-track' + (reverse ? ' rev' : '');
    return '<div class="rv-row">' +
      '<div class="' + cls + '">' + live + '</div>' +
      '<div class="' + cls + '" aria-hidden="true">' + dup + '</div>' +
      '</div>';
  }

  function buildModal() {
    var modal = document.createElement('div');
    modal.className = 'rv-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Vollständige Bewertung');
    modal.innerHTML =
      '<div class="rv-modal-card">' +
      '<button type="button" class="rv-modal-close" aria-label="Schließen">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
      '</button><div class="rv-modal-body"></div></div>';
    document.body.appendChild(modal);
    return modal;
  }

  // Each track must be at least as wide as the row, otherwise the marquee
  // shows a gap at the edges between loops. The reverse row starts at
  // translateX(-100%), so on first load it only covers ONE track width — on
  // wide screens that leaves a hole on the right until it scrolls far enough.
  // Repeating the cards until a single track exceeds the row width fixes it
  // for both directions, on any viewport.
  function fill(mount) {
    mount.querySelectorAll('.rv-row').forEach(function (rowEl) {
      var rowW = rowEl.clientWidth;
      if (!rowW) return;
      rowEl.querySelectorAll('.rv-track').forEach(function (track) {
        var base = track.getAttribute('data-base');
        if (base == null) { base = track.innerHTML; track.setAttribute('data-base', base); }
        track.innerHTML = base;
        var unit = track.scrollWidth;
        if (!unit) return;
        var times = Math.ceil((rowW + 1) / unit);
        if (times > 1) track.innerHTML = new Array(times + 1).join(base);
      });
    });
  }

  function render(data) {
    var mount = document.querySelector('[data-reviews]');
    if (!mount) return;
    var list = (data && data.reviews) || [];
    if (!list.length) { mount.closest('section') && (mount.closest('section').style.display = 'none'); return; }

    var mid = Math.ceil(list.length / 2);
    mount.innerHTML = row(list.slice(0, mid), false) + row(list.slice(mid), true);
    fill(mount);
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { fill(mount); }, 200);
    });

    var modal = buildModal();
    var body = modal.querySelector('.rv-modal-body');
    function open(c) {
      var clone = c.cloneNode(true);
      var ex = clone.querySelector('.rv-expand'); if (ex) ex.remove();
      body.innerHTML = clone.innerHTML;
      modal.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
    }
    function close() {
      modal.classList.remove('is-open');
      document.documentElement.style.overflow = '';
    }
    // Delegated so it survives innerHTML re-fills (e.g. on resize).
    mount.addEventListener('click', function (e) {
      var c = e.target.closest('.rv-card');
      if (c) open(c);
    });
    mount.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var c = e.target.closest('.rv-card');
      if (c) { e.preventDefault(); open(c); }
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('.rv-modal-close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }

  function init() {
    fetch('/static/data/reviews.json?v=20260606a', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(render)
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
