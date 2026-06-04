/* ------------------------------------------------------------------
   price-calc.js — metric-based price estimator for service pages that
   opt in via `calculator: true` (currently: Codebase-Review).

   Reads four <select>s whose option values are numeric factors:
     #calc-size, #calc-depth, #calc-speed  → multipliers on data-base
     #calc-stack                           → flat € addition
   estimate = round50(base * size * depth * speed + stack)
   The estimate is shown live and written into the CTA's ?min= param so
   the inquiry form prefills the budget. Non-binding by design.
   ------------------------------------------------------------------ */
(function () {
  'use strict';
  var root = document.getElementById('price-calc');
  if (!root) return;

  var base = parseFloat(root.getAttribute('data-base')) || 1000;
  var size = document.getElementById('calc-size');
  var stack = document.getElementById('calc-stack');
  var depth = document.getElementById('calc-depth');
  var speed = document.getElementById('calc-speed');
  var amount = document.getElementById('calc-amount');
  var cta = document.getElementById('calc-cta');
  if (!size || !stack || !depth || !speed || !amount) return;

  var fmt = new Intl.NumberFormat(document.documentElement.lang || 'de', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
  });

  function num(el) { var v = parseFloat(el.value); return isNaN(v) ? 0 : v; }
  function round50(n) { return Math.round(n / 50) * 50; }

  // "Field label: selected option" for one <select> (both localised via the page).
  function fieldSummary(sel) {
    var lab = sel.closest('label');
    var name = lab && lab.querySelector('span') ? lab.querySelector('span').textContent.trim() : '';
    var val = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '';
    return name ? (name + ': ' + val) : val;
  }

  function update() {
    var est = round50(base * num(size) * num(depth) * num(speed) + num(stack));
    amount.textContent = fmt.format(est);
    if (cta) {
      // Carry the estimate (min) AND a human-readable summary of the chosen
      // metrics (details) into the inquiry form, preserving the #contact hash.
      var details = [size, stack, depth, speed].map(fieldSummary).join(' · ');
      var u = new URL(cta.getAttribute('href'), location.origin);
      u.searchParams.set('min', String(est));
      u.searchParams.set('details', details);
      cta.setAttribute('href', u.pathname + u.search + u.hash);
    }
  }

  [size, stack, depth, speed].forEach(function (el) { el.addEventListener('change', update); });
  update();
})();
