/* ------------------------------------------------------------------
   booking.js — custom appointment booking widget for the booking pages
   (/de/termin/, /en/booking/, /ru/zapis/).

   Localised: picks UI strings + Intl locale from <html lang>. Static page
   copy lives in the HTML (rendered per language by build-services.mjs);
   this file holds only the strings it generates at runtime.

   TIMEZONE MODEL
   --------------
   Availability is defined in the HOST timezone (Europe/Berlin: Mon–Fri,
   12:00–18:00). Slots are produced as absolute instants (UTC), then grouped
   by calendar day and formatted in the CUSTOMER's chosen timezone. Lead
   time 48h. A 60-min booking needs two free consecutive 30-min units.

   PAYMENT — Stripe Checkout. On submit the backend creates a Checkout
   Session and returns its URL; the browser redirects there; a webhook
   finalises the calendar event + mail. Prices are NET.

   BACKEND SEAM — replace ONLY fetchAvailability() and createCheckoutSession():
     GET /api/availability?duration=&from=&to=  → { slots: [UTC ISO, …] }
     POST /api/book (payload below)             → { checkoutUrl }
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var root = document.getElementById('booking-app');
  if (!root) return;

  var LANG = (document.documentElement.lang || 'de').slice(0, 2);

  /* ---- Localised runtime strings ---------------------------------- */
  var STRINGS = {
    de: {
      locale: 'de-DE', loading: 'Lädt …', slotsTitle: 'Verfügbare Zeiten',
      uhr: ' Uhr', inCountry: 'in Deutschland', minutes: 'Minuten', net: 'inkl. USt.',
      submitBase: 'Zahlungspflichtig buchen', submitting: 'Weiterleitung zu Stripe …',
      errSelect: 'Bitte wählen Sie zuerst einen Termin aus.',
      errFail: 'Die Buchung ist fehlgeschlagen. Bitte versuchen Sie es erneut oder schreiben Sie an jt@teske-systemtechnik.de.',
      location: 'Online via Google Meet',
      eventTitle: 'Beratungstermin — Teske Systemtechnik',
      eventDesc: 'Online-Beratungstermin mit Teske Systemtechnik. Den Google-Meet-Link erhalten Sie per E-Mail.',
      confirm: function (n) { return 'Vielen Dank, ' + n + '. Ihre Zahlung war erfolgreich und Ihr Termin ist gebucht. Sie erhalten in Kürze eine Bestätigung per E-Mail mit dem Google-Meet-Link.'; }
    },
    en: {
      locale: 'en-GB', loading: 'Loading …', slotsTitle: 'Available times',
      uhr: '', inCountry: 'in Germany', minutes: 'minutes', net: 'incl. VAT',
      submitBase: 'Book (payment required)', submitting: 'Redirecting to Stripe …',
      errSelect: 'Please pick a time first.',
      errFail: 'The booking failed. Please try again or email jt@teske-systemtechnik.de.',
      location: 'Online via Google Meet',
      eventTitle: 'Consultation — Teske Systemtechnik',
      eventDesc: 'Online consultation with Teske Systemtechnik. You will receive the Google Meet link by email.',
      confirm: function (n) { return 'Thank you, ' + n + '. Your payment was successful and your appointment is booked. You will shortly receive a confirmation email with the Google Meet link.'; }
    },
    ru: {
      locale: 'ru-RU', loading: 'Загрузка …', slotsTitle: 'Доступное время',
      uhr: '', inCountry: 'в Германии', minutes: 'минут', net: 'включая НДС',
      submitBase: 'Оплатить и записаться', submitting: 'Переход к оплате (Stripe) …',
      errSelect: 'Сначала выберите время.',
      errFail: 'Не удалось оформить запись. Попробуйте ещё раз или напишите на jt@teske-systemtechnik.de.',
      location: 'Онлайн через Google Meet',
      eventTitle: 'Консультация — Teske Systemtechnik',
      eventDesc: 'Онлайн-консультация с Teske Systemtechnik. Ссылку на Google Meet вы получите по email.',
      confirm: function (n) { return 'Спасибо, ' + n + '. Оплата прошла успешно, запись оформлена. В ближайшее время вы получите подтверждение по email со ссылкой на Google Meet.'; }
    }
  };
  var S = STRINGS[LANG] || STRINGS.de;

  /* ---- Backend endpoint: set to your Cloud Run URL, then bump booking.js ?v --- */
  var API_BASE = 'https://booking-backend-982167667163.europe-west3.run.app';
  function isConfigured() { return API_BASE && API_BASE.indexOf('YOUR-') === -1; }

  /* ---- Configuration (host side — mirror on the backend) ---------- */
  var CONFIG = {
    hostTz: 'Europe/Berlin',
    businessDays: [1, 2, 3, 4, 5],
    dayStart: 12 * 60,
    dayEnd: 18 * 60,
    slotStep: 30,
    breaks: [],
    horizonDays: 35,
    leadMinutes: 48 * 60,
    durations: [{ minutes: 30, price: 75 }, { minutes: 60, price: 150 }],
    locationLabel: S.location
  };

  var TZ_LIST = [
    'Europe/Berlin', 'Europe/London', 'Europe/Lisbon', 'Europe/Athens',
    'Europe/Moscow', 'Europe/Istanbul', 'America/New_York', 'America/Chicago',
    'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo', 'Asia/Dubai',
    'Asia/Kolkata', 'Asia/Singapore', 'Asia/Shanghai', 'Asia/Tokyo',
    'Australia/Sydney', 'Pacific/Auckland', 'UTC'
  ];

  var el = {
    durationCards: Array.prototype.slice.call(document.querySelectorAll('.duration-card')),
    tzSelect: document.getElementById('tz-select'),
    monthLabel: document.getElementById('cal-month-label'),
    prev: document.getElementById('cal-prev'),
    next: document.getElementById('cal-next'),
    grid: document.getElementById('cal-grid'),
    slotsLabel: document.getElementById('slots-label'),
    slotsGrid: document.getElementById('slots-grid'),
    slotsPlaceholder: document.getElementById('slots-placeholder'),
    slotsEmpty: document.getElementById('slots-empty'),
    step1: document.getElementById('booking-step-1'),
    step2: document.getElementById('booking-step-2'),
    step3: document.getElementById('booking-step-3'),
    steps: Array.prototype.slice.call(document.querySelectorAll('.booking-step')),
    summarySlot: document.getElementById('summary-slot'),
    summaryMeta: document.getElementById('summary-meta'),
    changeSlot: document.getElementById('change-slot'),
    form: document.getElementById('booking-step-2'),
    name: document.getElementById('booking-name'),
    email: document.getElementById('booking-email'),
    company: document.getElementById('booking-company'),
    phone: document.getElementById('booking-phone'),
    topic: document.getElementById('booking-topic'),
    error: document.getElementById('booking-error'),
    submit: document.getElementById('booking-submit'),
    submitText: document.getElementById('booking-submit-text'),
    spinner: document.getElementById('booking-spinner'),
    confirmText: document.getElementById('confirm-text'),
    confirmSlot: document.getElementById('confirm-slot'),
    confirmMeta: document.getElementById('confirm-meta'),
    confirmGcal: document.getElementById('confirm-gcal'),
    confirmIcs: document.getElementById('confirm-ics'),
    restart: document.getElementById('booking-restart')
  };

  var clientTz = resolvedTz();
  var duration = CONFIG.durations[0].minutes;
  var price = CONFIG.durations[0].price;
  var view = new Date(); view.setDate(1); view.setHours(0, 0, 0, 0);
  var slotsByDay = {};
  var orderedKeys = [];
  var currentIso = [];
  var selected = null;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function priceLabel(p) { return p + ' € ' + S.net; }
  function metaLabel() { return duration + ' ' + S.minutes + ' · ' + priceLabel(price); }

  function resolvedTz() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || CONFIG.hostTz; }
    catch (e) { return CONFIG.hostTz; }
  }
  function hash01(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967295;
  }

  /* ---- Timezone math ---------------------------------------------- */
  function tzOffsetMs(utcMs, tz) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(new Date(utcMs));
    var m = {};
    parts.forEach(function (p) { if (p.type !== 'literal') m[p.type] = p.value; });
    return Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second) - utcMs;
  }
  function wallTimeToMs(y, mo, d, h, mi, tz) {
    var guess = Date.UTC(y, mo - 1, d, h, mi, 0);
    var off = tzOffsetMs(guess, tz);
    var inst = guess - off;
    var off2 = tzOffsetMs(inst, tz);
    if (off2 !== off) inst = guess - off2;
    return inst;
  }
  function dayKeyInTz(ms, tz) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
  }
  function timeInTz(ms, tz) {
    return new Intl.DateTimeFormat(S.locale, { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms));
  }
  function longDateInTz(ms, tz) {
    return new Intl.DateTimeFormat(S.locale, { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ms));
  }
  function offsetLabel(tz) {
    var min = Math.round(tzOffsetMs(Date.now(), tz) / 60000);
    var sign = min >= 0 ? '+' : '-', a = Math.abs(min);
    return 'UTC' + sign + Math.floor(a / 60) + (a % 60 ? ':' + pad2(a % 60) : '');
  }
  function cityLabel(tz) { return tz === 'UTC' ? 'UTC' : tz.split('/').pop().replace(/_/g, ' '); }

  /* ==================================================================
     SEAM — replace these two bodies with real backend calls to go live.
     ================================================================== */
  function fetchAvailability(durationMinutes) {
    if (isConfigured()) {
      return fetch(API_BASE + '/api/availability?duration=' + encodeURIComponent(durationMinutes), { headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('availability ' + r.status); return r.json(); })
        .then(function (d) { return (d && d.slots) || []; });
    }
    /* ---- Mock fallback (used until API_BASE points to your backend) ---- */
    var free = [];
    var nowCutoff = Date.now() + CONFIG.leadMinutes * 60000;
    var todayHostKey = dayKeyInTz(Date.now(), CONFIG.hostTz).split('-');
    var anchor = Date.UTC(+todayHostKey[0], +todayHostKey[1] - 1, +todayHostKey[2], 12);
    function unitBusy(y, mo, d, t) { return hash01(y + '-' + mo + '-' + d + 'T' + t) < 0.4; }

    for (var i = 0; i <= CONFIG.horizonDays + 1; i++) {
      var a = new Date(anchor + i * 86400000);
      var y = a.getUTCFullYear(), mo = a.getUTCMonth() + 1, d = a.getUTCDate();
      if (CONFIG.businessDays.indexOf(a.getUTCDay()) === -1) continue;
      for (var t = CONFIG.dayStart; t <= CONFIG.dayEnd - durationMinutes; t += CONFIG.slotStep) {
        var ok = true;
        for (var u = t; u < t + durationMinutes; u += CONFIG.slotStep) {
          if (CONFIG.breaks.some(function (b) { return u >= b[0] && u < b[1]; }) || unitBusy(y, mo, d, u)) { ok = false; break; }
        }
        if (!ok) continue;
        var ms = wallTimeToMs(y, mo, d, Math.floor(t / 60), t % 60, CONFIG.hostTz);
        if (ms < nowCutoff) continue;
        free.push(new Date(ms).toISOString());
      }
    }
    return new Promise(function (resolve) { setTimeout(function () { resolve(free); }, 320); });
  }

  function createCheckoutSession(payload) {
    if (isConfigured()) {
      var body = JSON.stringify(Object.assign({}, payload, { lang: LANG, returnUrl: location.origin + location.pathname }));
      return fetch(API_BASE + '/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body })
        .then(function (r) { if (!r.ok) throw new Error('book ' + r.status); return r.json(); });
    }
    if (window.console) console.log('[booking] payload (mock — backend not configured):', payload);
    return new Promise(function (resolve) { setTimeout(function () { resolve({ checkoutUrl: null }); }, 900); });
  }

  /* ==================================================================
     Grouping
     ================================================================== */
  function groupSlots(isoList) {
    slotsByDay = {};
    isoList.forEach(function (iso) {
      var ms = Date.parse(iso);
      var key = dayKeyInTz(ms, clientTz);
      (slotsByDay[key] || (slotsByDay[key] = [])).push({ ms: ms, iso: iso, label: timeInTz(ms, clientTz) });
    });
    orderedKeys = Object.keys(slotsByDay).sort();
    orderedKeys.forEach(function (k) { slotsByDay[k].sort(function (x, y) { return x.ms - y.ms; }); });
  }
  function monthValue(d) { return d.getFullYear() * 12 + d.getMonth(); }
  function keyMonthValue(key) { return (+key.slice(0, 4)) * 12 + (+key.slice(5, 7)) - 1; }
  function viewToFirstSlotMonth() {
    if (orderedKeys.length) view = new Date(+orderedKeys[0].slice(0, 4), +orderedKeys[0].slice(5, 7) - 1, 1);
  }

  /* ==================================================================
     Calendar
     ================================================================== */
  function renderCalendar() {
    el.monthLabel.textContent = new Intl.DateTimeFormat(S.locale, { month: 'long', year: 'numeric' }).format(view);
    el.grid.innerHTML = '';
    var minMV = orderedKeys.length ? keyMonthValue(orderedKeys[0]) : monthValue(view);
    var maxMV = orderedKeys.length ? keyMonthValue(orderedKeys[orderedKeys.length - 1]) : monthValue(view);
    el.prev.disabled = monthValue(view) <= minMV;
    el.next.disabled = monthValue(view) >= maxMV;

    var todayKey = dayKeyInTz(Date.now(), clientTz);
    var first = new Date(view.getFullYear(), view.getMonth(), 1);
    var offset = (first.getDay() + 6) % 7;
    for (var i = 0; i < offset; i++) el.grid.appendChild(document.createElement('span'));

    var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (var day = 1; day <= daysInMonth; day++) {
      var key = view.getFullYear() + '-' + pad2(view.getMonth() + 1) + '-' + pad2(day);
      var bookable = !!slotsByDay[key];
      var cell = document.createElement(bookable ? 'button' : 'span');
      cell.textContent = String(day);
      cell.className = 'flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition';
      if (bookable) {
        cell.type = 'button';
        cell.setAttribute('data-key', key);
        cell.setAttribute('aria-label', longDateInTz(slotsByDay[key][0].ms, clientTz));
        if (key === (selected && selected.key)) {
          cell.className += ' bg-orange-500 text-white hover:bg-orange-400';
          cell.setAttribute('aria-current', 'date');
        } else {
          cell.className += ' cursor-pointer text-stone-200 hover:bg-stone-800 hover:text-white focus:outline-none focus:ring-1 focus:ring-orange-500';
          if (key === todayKey) cell.className += ' ring-1 ring-inset ring-stone-600';
        }
        cell.addEventListener('click', onDayClick);
      } else {
        cell.className += ' text-stone-700 cursor-not-allowed';
        cell.setAttribute('aria-disabled', 'true');
      }
      el.grid.appendChild(cell);
    }
  }

  function onDayClick(e) {
    var key = e.currentTarget.getAttribute('data-key');
    selected = { key: key };
    renderCalendar();
    renderSlots(key);
    if (!el.step2.classList.contains('hidden')) hideStep2();
  }

  /* ==================================================================
     Time slots
     ================================================================== */
  function setSlotState(state) {
    el.slotsPlaceholder.classList.toggle('hidden', state !== 'placeholder');
    el.slotsEmpty.classList.toggle('hidden', state !== 'empty');
    el.slotsGrid.classList.toggle('hidden', state !== 'slots');
  }
  function renderSlots(key) {
    var slots = slotsByDay[key] || [];
    el.slotsLabel.textContent = S.slotsTitle + ' · ' + longDateInTz(slots.length ? slots[0].ms : Date.now(), clientTz);
    el.slotsGrid.innerHTML = '';
    if (!slots.length) { setSlotState('empty'); return; }
    setSlotState('slots');
    slots.forEach(function (slot) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = slot.label;
      b.setAttribute('data-iso', slot.iso);
      b.className = 'cursor-pointer rounded-lg border border-stone-700 bg-stone-950/40 px-3 py-2.5 text-sm font-medium text-stone-200 transition hover:border-orange-500 hover:text-white focus:outline-none focus:ring-1 focus:ring-orange-500';
      b.addEventListener('click', function () { onSlotClick(key, slot, b); });
      el.slotsGrid.appendChild(b);
    });
  }
  function onSlotClick(key, slot, btn) {
    selected = { key: key, label: slot.label, ms: slot.ms, iso: slot.iso };
    Array.prototype.forEach.call(el.slotsGrid.children, function (b) {
      var active = b === btn;
      b.classList.toggle('border-orange-500', active);
      b.classList.toggle('bg-orange-500', active);
      b.classList.toggle('text-white', active);
      b.classList.toggle('bg-stone-950/40', !active);
      if (active) b.setAttribute('aria-pressed', 'true'); else b.removeAttribute('aria-pressed');
    });
    showStep2();
  }

  /* ==================================================================
     Duration / price picker
     ================================================================== */
  function paintDurationCards() {
    el.durationCards.forEach(function (c) {
      var on = +c.getAttribute('data-duration') === duration;
      c.classList.toggle('border-orange-500', on);
      c.classList.toggle('bg-orange-500/10', on);
      c.classList.toggle('hover:border-orange-400', on);
      c.classList.toggle('border-stone-700', !on);
      c.classList.toggle('bg-stone-950/40', !on);
      c.classList.toggle('hover:border-stone-600', !on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function resetToStep1() {
    selected = null;
    el.step3.classList.add('hidden');
    el.step2.classList.add('hidden');
    el.step1.classList.remove('hidden');
    setSlotState('placeholder');
    el.slotsLabel.textContent = S.slotsTitle;
    setStep(1);
  }
  el.durationCards.forEach(function (c) {
    c.addEventListener('click', function () {
      duration = +c.getAttribute('data-duration');
      price = +c.getAttribute('data-price');
      paintDurationCards();
      updateSubmitLabel();
      resetToStep1();
      loadForDuration();
    });
  });
  function loadForDuration() {
    el.prev.disabled = el.next.disabled = true;
    el.grid.innerHTML = '<p class="col-span-full py-8 text-center text-sm text-stone-500">' + S.loading + '</p>';
    fetchAvailability(duration).then(function (iso) {
      currentIso = iso;
      groupSlots(currentIso);
      viewToFirstSlotMonth();
      renderCalendar();
    });
  }

  /* ==================================================================
     Steps & form
     ================================================================== */
  function setStep(n) {
    el.steps.forEach(function (li) {
      var s = +li.getAttribute('data-step');
      var dot = li.querySelector('.step-dot');
      li.classList.remove('text-stone-500', 'text-stone-300', 'text-orange-400');
      dot.classList.remove('border-stone-700', 'border-orange-500', 'bg-orange-500', 'text-white', 'border-emerald-500', 'text-emerald-400');
      if (s === n) { li.classList.add('text-orange-400'); dot.classList.add('border-orange-500', 'bg-orange-500', 'text-white'); }
      else if (s < n) { li.classList.add('text-stone-300'); dot.classList.add('border-emerald-500', 'text-emerald-400'); }
      else { li.classList.add('text-stone-500'); dot.classList.add('border-stone-700'); }
    });
  }
  function smoothScrollTo(node) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  function summaryText() {
    var s = longDateInTz(selected.ms, clientTz) + ', ' + selected.label + S.uhr;
    if (clientTz !== CONFIG.hostTz) s += ' · ' + timeInTz(selected.ms, CONFIG.hostTz) + S.uhr + ' ' + S.inCountry;
    return s;
  }
  function showStep2() {
    el.summarySlot.textContent = summaryText();
    el.summaryMeta.textContent = metaLabel();
    el.step2.classList.remove('hidden');
    setStep(2);
    smoothScrollTo(el.step2);
  }
  function hideStep2() { el.step2.classList.add('hidden'); setStep(1); }

  function updateSubmitLabel() { el.submitText.textContent = S.submitBase + ' · ' + priceLabel(price); }
  function setSubmitting(on) {
    el.submit.disabled = on;
    el.spinner.classList.toggle('hidden', !on);
    if (on) el.submitText.textContent = S.submitting; else updateSubmitLabel();
  }
  function showError(msg) { el.error.textContent = msg; el.error.classList.remove('hidden'); }

  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    el.error.classList.add('hidden');
    if (!selected || !selected.iso) { showError(S.errSelect); return; }
    if (!el.form.checkValidity()) { el.form.reportValidity(); return; }
    var payload = {
      startUtc: selected.iso, durationMinutes: duration, priceEur: price, priceNet: true,
      clientTimezone: clientTz, name: el.name.value.trim(), email: el.email.value.trim(),
      company: el.company.value.trim(), phone: el.phone.value.trim(), topic: el.topic.value.trim()
    };
    setSubmitting(true);
    createCheckoutSession(payload)
      .then(function (res) {
        if (res && res.checkoutUrl) {
          try { sessionStorage.setItem('teske_booking', JSON.stringify({ payload: payload, duration: duration, price: price, tz: clientTz, iso: selected.iso, label: selected.label, key: selected.key })); } catch (e) {}
          location.href = res.checkoutUrl; return;
        }
        showConfirmation(payload);
      })
      .catch(function () { setSubmitting(false); showError(S.errFail); });
  });

  el.changeSlot.addEventListener('click', function () { hideStep2(); smoothScrollTo(el.step1); });

  /* ==================================================================
     Confirmation + add-to-calendar
     ================================================================== */
  function utcStamp(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) +
      'T' + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + '00Z';
  }
  function buildGcalUrl(startMs, endMs) {
    return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
      action: 'TEMPLATE', text: S.eventTitle,
      dates: utcStamp(startMs) + '/' + utcStamp(endMs),
      details: S.eventDesc, location: CONFIG.locationLabel
    }).toString();
  }
  function buildIcsUrl(startMs, endMs) {
    var lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Teske Systemtechnik//Booking//EN',
      'BEGIN:VEVENT', 'UID:' + utcStamp(startMs) + '-teske@teske-systemtechnik.de',
      'DTSTAMP:' + utcStamp(Date.now()), 'DTSTART:' + utcStamp(startMs), 'DTEND:' + utcStamp(endMs),
      'SUMMARY:' + S.eventTitle, 'DESCRIPTION:' + S.eventDesc, 'LOCATION:' + CONFIG.locationLabel,
      'END:VEVENT', 'END:VCALENDAR'
    ];
    return URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  }
  function showConfirmation(payload) {
    var startMs = selected.ms, endMs = startMs + duration * 60000;
    el.confirmText.textContent = S.confirm(payload.name);
    el.confirmSlot.textContent = summaryText();
    el.confirmMeta.textContent = metaLabel() + ' · ' + CONFIG.locationLabel;
    el.confirmGcal.href = buildGcalUrl(startMs, endMs);
    el.confirmIcs.href = buildIcsUrl(startMs, endMs);
    el.step1.classList.add('hidden');
    el.step2.classList.add('hidden');
    el.step3.classList.remove('hidden');
    setStep(3);
    smoothScrollTo(root);
  }

  el.restart.addEventListener('click', function () {
    el.form.reset();
    el.error.classList.add('hidden');
    setSubmitting(false);
    resetToStep1();
    viewToFirstSlotMonth();
    renderCalendar();
    smoothScrollTo(root);
  });

  /* ==================================================================
     Timezone picker
     ================================================================== */
  function buildTzOptions() {
    var list = TZ_LIST.slice();
    if (list.indexOf(clientTz) === -1) list.unshift(clientTz);
    list.sort(function (a, b) { return tzOffsetMs(Date.now(), a) - tzOffsetMs(Date.now(), b); });
    el.tzSelect.innerHTML = '';
    list.forEach(function (tz) {
      var o = document.createElement('option');
      o.value = tz;
      o.textContent = '(' + offsetLabel(tz) + ') ' + cityLabel(tz);
      if (tz === clientTz) o.selected = true;
      el.tzSelect.appendChild(o);
    });
  }
  el.tzSelect.addEventListener('change', function () {
    clientTz = el.tzSelect.value;
    groupSlots(currentIso);
    resetToStep1();
    viewToFirstSlotMonth();
    renderCalendar();
  });

  el.prev.addEventListener('click', function () { view.setMonth(view.getMonth() - 1); renderCalendar(); });
  el.next.addEventListener('click', function () { view.setMonth(view.getMonth() + 1); renderCalendar(); });

  /* ---- Return from Stripe Checkout (success_url ?booking=success) --- */
  function maybeShowPaymentResult() {
    var params;
    try { params = new URLSearchParams(location.search || ''); } catch (e) { return; }
    var status = params.get('booking');
    if (!status) return;
    if (history.replaceState) history.replaceState(null, '', location.pathname);
    if (status !== 'success') return;
    var raw = null;
    try { raw = sessionStorage.getItem('teske_booking'); sessionStorage.removeItem('teske_booking'); } catch (e) {}
    if (raw) {
      try {
        var st = JSON.parse(raw);
        clientTz = st.tz || clientTz;
        duration = st.duration; price = st.price;
        selected = { key: st.key, label: st.label, ms: Date.parse(st.iso), iso: st.iso };
        showConfirmation(st.payload);
        return;
      } catch (e) { /* fall through to generic message */ }
    }
    var GENERIC = {
      de: 'Vielen Dank! Ihre Zahlung war erfolgreich und Ihr Termin ist gebucht. Sie erhalten in Kürze eine Bestätigung per E-Mail mit dem Google-Meet-Link.',
      en: 'Thank you! Your payment was successful and your appointment is booked. You will shortly receive a confirmation email with the Google Meet link.',
      ru: 'Спасибо! Оплата прошла успешно, запись оформлена. В ближайшее время вы получите подтверждение по email со ссылкой на Google Meet.'
    };
    el.confirmText.textContent = GENERIC[LANG] || GENERIC.de;
    el.confirmSlot.textContent = '';
    el.confirmMeta.textContent = '';
    if (el.confirmGcal) el.confirmGcal.classList.add('hidden');
    if (el.confirmIcs) el.confirmIcs.classList.add('hidden');
    el.step1.classList.add('hidden');
    el.step2.classList.add('hidden');
    el.step3.classList.remove('hidden');
    setStep(3);
  }

  /* ---- Init -------------------------------------------------------- */
  buildTzOptions();
  paintDurationCards();
  updateSubmitLabel();
  setStep(1);
  setSlotState('placeholder');
  loadForDuration();
  maybeShowPaymentResult();
})();
