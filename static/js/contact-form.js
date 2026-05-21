/* ------------------------------------------------------------------
 * contact-form.js — multilingual Forminit handler for the homepage
 * contact form. Shows Sending, Success/Error state on the submit
 * button, resets after 5s, never reloads the page.
 *
 * Labels are pulled from /static/data/i18n.json via TeskeProjects.
 * Submission goes through Forminit SDK (formId 7u05vqgqcf7), which must
 * be loaded before this script via /sdk/v1/forminit.js.
 *
 * Requires the following DOM IDs to exist:
 *   #contact-form        — the <form> element (no action attribute)
 *   #contact-submit      — the submit <button>
 *   #contact-submit-text — an inner <span> with the label text
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  // Local fallbacks used if TeskeProjects helpers are unavailable
  // (e.g. page loaded contact-form.js without projects-data.js).
  const FALLBACK = {
    de: { sending: 'Wird gesendet…', success: 'Erfolgreich gesendet ✓', error: 'Fehler — bitte erneut versuchen' },
    en: { sending: 'Sending…',       success: 'Sent successfully ✓',     error: 'Failed — please try again' },
    ru: { sending: 'Отправка…',      success: 'Отправлено ✓',            error: 'Ошибка — попробуйте ещё раз' },
  };

  function detectLang() {
    if (window.TeskeProjects && typeof window.TeskeProjects.detectLang === 'function') {
      return window.TeskeProjects.detectLang();
    }
    const htmlLang = (document.documentElement.lang || 'de').toLowerCase();
    if (htmlLang.indexOf('en') === 0) return 'en';
    if (htmlLang.indexOf('ru') === 0) return 'ru';
    return 'de';
  }

  function labelFactory(lang) {
    const helpers = window.TeskeProjects;
    const bag = FALLBACK[lang] || FALLBACK.de;
    return function (key) {
      const mapped = 'contact' + key.charAt(0).toUpperCase() + key.slice(1);
      if (helpers && typeof helpers.label === 'function') {
        const v = helpers.label(mapped, lang);
        if (v) return v;
      }
      return bag[key];
    };
  }

  // -----------------------------------------------------------------
  // Service / Budget dropdown logic.
  // Hooks into the same #contact-form. Reads the <option data-min>
  // attributes set in markup, applies prefill from ?service= URL param,
  // and switches the budget field between optional/required + auto-fills
  // the min value. When "custom" is picked, the project-name text input
  // becomes visible. When a specific service is picked, the project-name
  // field is hidden (the dropdown carries the service identity already).
  // -----------------------------------------------------------------
  function initServiceDropdown(form) {
    const select = form.querySelector('#contact-service');
    const projectRow = form.querySelector('#contact-project-row');
    const projectInput = form.querySelector('#contact-project');
    const budget = form.querySelector('#contact-budget');
    const budgetMinLabel = form.querySelector('#contact-budget-min');
    const budgetOptional = form.querySelector('#contact-budget-optional');
    const budgetError = form.querySelector('#contact-budget-error');
    if (!select || !budget) return null;

    const locale = budget.getAttribute('data-locale') || 'de-DE';
    const minPrefix = budget.getAttribute('data-min-prefix') || 'Min';
    const errorText = budget.getAttribute('data-error-text') || 'Minimum:';

    function applyState(value) {
      const opt = select.options[select.selectedIndex];
      const min = opt ? parseInt(opt.getAttribute('data-min') || '0', 10) : 0;

      if (value === 'custom') {
        if (projectRow) projectRow.classList.remove('hidden');
        if (projectInput) projectInput.value = '';
        budget.required = false;
        budget.min = '0';
        budget.value = '';
        if (budgetMinLabel) budgetMinLabel.textContent = '';
        if (budgetOptional) budgetOptional.style.display = '';
      } else if (min > 0) {
        if (projectRow) projectRow.classList.add('hidden');
        if (projectInput) projectInput.value = '';
        budget.required = true;
        budget.min = String(min);
        budget.value = String(min);
        if (budgetMinLabel) budgetMinLabel.textContent = minPrefix + ': ' + min.toLocaleString(locale) + ' €';
        if (budgetOptional) budgetOptional.style.display = 'none';
      } else {
        // "---" no service
        if (projectRow) projectRow.classList.remove('hidden');
        if (projectInput) projectInput.value = '';
        budget.required = false;
        budget.min = '0';
        budget.value = '';
        if (budgetMinLabel) budgetMinLabel.textContent = '';
        if (budgetOptional) budgetOptional.style.display = '';
      }
      validateBudget();
    }

    function validateBudget() {
      if (!budgetError) return true;
      if (!budget.required) {
        budgetError.classList.add('hidden');
        budget.classList.remove('border-orange-500');
        return true;
      }
      const v = parseInt(budget.value, 10);
      const min = parseInt(budget.min, 10);
      if (isNaN(v) || v < min) {
        budgetError.textContent = errorText + ' ' + min.toLocaleString(locale) + ' € netto';
        budgetError.classList.remove('hidden');
        budget.classList.add('border-orange-500');
        return false;
      }
      budgetError.classList.add('hidden');
      budget.classList.remove('border-orange-500');
      return true;
    }

    // Prefill from URL ?service=<slug>
    const params = new URLSearchParams(location.search);
    const slugFromUrl = params.get('service');
    if (slugFromUrl) {
      // Check if option exists for that slug
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === slugFromUrl) {
          select.value = slugFromUrl;
          break;
        }
      }
    }
    applyState(select.value);

    select.addEventListener('change', function () { applyState(select.value); });
    budget.addEventListener('input', validateBudget);
    budget.addEventListener('blur', validateBudget);

    // "Not sure yet" checkbox: when ticked, pin the budget to the minimum for
    // the currently selected service (or 0 if none).
    const notSure = form.querySelector('#contact-budget-notsure');
    if (notSure) {
      notSure.addEventListener('change', function () {
        if (notSure.checked) {
          const min = parseInt(budget.min, 10) || 0;
          budget.value = String(min);
          validateBudget();
        }
      });
    }

    return { validateBudget: validateBudget };
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contact-form');
    const button = document.getElementById('contact-submit');
    const btnText = document.getElementById('contact-submit-text');
    if (!form || !button || !btnText) return;

    const dropdown = initServiceDropdown(form);
    const lang = detectLang();
    // Preload i18n config so labels resolve without a flash of the fallback.
    if (window.TeskeProjects && typeof window.TeskeProjects.loadConfig === 'function') {
      window.TeskeProjects.loadConfig().catch(function () {});
    }

    const t = labelFactory(lang);
    const originalLabel = btnText.innerHTML;
    const COLORS = {
      success: '#10b981', /* emerald-500 */
      error: '#ef4444',   /* red-500    */
    };

    function resetButton() {
      button.style.backgroundColor = '';
      button.style.color = '';
      button.disabled = false;
      btnText.innerHTML = originalLabel;
    }

    function showSending() {
      button.disabled = true;
      btnText.textContent = t('sending');
    }

    function showResult(ok) {
      button.style.backgroundColor = ok ? COLORS.success : COLORS.error;
      button.style.color = '#ffffff';
      btnText.textContent = ok ? t('success') : t('error');
      if (ok) form.reset();
      button.disabled = !ok; // allow retry on error immediately
      setTimeout(resetButton, 5000);
    }

    // Forminit form ID — see https://app.forminit.com/forms/<id>
    const FORMINIT_FORM_ID = '7u05vqgqcf7';

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      // Budget validation gate — only triggers when a service was picked
      if (dropdown && typeof dropdown.validateBudget === 'function' && !dropdown.validateBudget()) {
        const budget = form.querySelector('#contact-budget');
        if (budget) budget.focus();
        return;
      }
      // Native validation for the remaining required fields (name/email/message)
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Forminit SDK must have loaded by submit time. If not, fall back to a
      // user-visible error instead of silently dropping the submission.
      if (typeof window.Forminit !== 'function') {
        showResult(false);
        return;
      }

      showSending();

      const forminit = new window.Forminit();
      forminit.submit(FORMINIT_FORM_ID, new FormData(form))
        .then(function (result) {
          if (result && result.error) {
            showResult(false);
            return;
          }
          showResult(true);
          if (result && result.redirectUrl) {
            location.href = result.redirectUrl;
          }
        })
        .catch(function () { showResult(false); });
    });
  });
})();
