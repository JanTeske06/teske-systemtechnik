/* ------------------------------------------------------------------
 * math-engine-console.js — lazy, self-hosted live demo of the Math Engine
 * The real engine runs in the browser via Pyodide (Python -> WebAssembly).
 * Everything is served from this domain: /static/pyodide/ + the math_engine
 * wheel. No third-party requests, nothing leaves the visitor's machine.
 * Markup hook: an element with [data-me-console]; see the case study page.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  var root = document.querySelector('[data-me-console]');
  if (!root) return;

  var PYODIDE_URL = '/static/pyodide/';
  var WHEEL_URL = '/static/pyodide/wheels/math_engine-0.6.7-py3-none-any.whl';

  var startBtn = root.querySelector('[data-me-start]');
  var btnLabel = root.querySelector('[data-me-btnlabel]');
  var btnHint = root.querySelector('[data-me-btnhint]');
  var chevron = root.querySelector('[data-me-chevron]');
  var ui = root.querySelector('[data-me-ui]');
  var outEl = root.querySelector('[data-me-output]');
  var form = root.querySelector('[data-me-form]');
  var input = root.querySelector('[data-me-input]');
  var statusEl = root.querySelector('[data-me-status]');

  var T = {
    loading: root.getAttribute('data-t-loading') || 'Loading Python environment…',
    ready: root.getAttribute('data-t-ready') || 'math-engine v0.6.7 · evaluate() — ready.',
    failed: root.getAttribute('data-t-failed') || 'Could not load the demo. Please reload the page.',
    hide: root.getAttribute('data-t-hide') || 'Collapse demo',
    show: root.getAttribute('data-t-show') || 'Show demo'
  };

  var pyodide = null;
  var booting = false;
  var booted = false;
  var collapsed = false;

  function print(text, kind) {
    var div = document.createElement('div');
    div.className = 'me-line' + (kind ? ' me-' + kind : '');
    div.textContent = text;
    outEl.appendChild(div);
    outEl.scrollTop = outEl.scrollHeight;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (typeof window.loadPyodide !== 'undefined') return resolve();
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('script load failed')); };
      document.head.appendChild(s);
    });
  }

  function render() {
    ui.classList.toggle('hidden', collapsed);
    if (btnLabel) btnLabel.textContent = collapsed ? T.show : T.hide;
    if (chevron) chevron.classList.toggle('rotate-180', collapsed);
  }

  async function boot() {
    if (booting) return;
    booting = true;
    startBtn.disabled = true;
    statusEl.textContent = T.loading;
    try {
      await loadScript(PYODIDE_URL + 'pyodide.js');
      pyodide = await window.loadPyodide({ indexURL: PYODIDE_URL });
      var buf = await (await fetch(WHEEL_URL)).arrayBuffer();
      await pyodide.unpackArchive(buf, 'zip');
      await pyodide.runPythonAsync('import math_engine');
      booted = true;
      collapsed = false;
      startBtn.disabled = false;
      statusEl.textContent = '';
      if (btnHint) btnHint.classList.add('hidden');
      if (chevron) chevron.classList.remove('hidden');
      render();
      print(T.ready, 'sys');
      input.focus();
    } catch (err) {
      statusEl.textContent = T.failed;
      startBtn.disabled = false;
      booting = false;
    }
  }

  async function evaluate(expr) {
    print('>>> ' + expr, 'in');
    try {
      pyodide.globals.set('__me_expr', expr);
      var r = await pyodide.runPythonAsync('str(math_engine.evaluate(__me_expr))');
      print(r, 'ok');
    } catch (err) {
      var msg = String(err && err.message ? err.message : err)
        .split('\n').filter(function (l) { return l.trim(); }).pop() || 'Error';
      msg = msg.replace(/^[\w.]*Error:\s*/, '').trim();
      print('! ' + msg, 'err');
    }
  }

  startBtn.addEventListener('click', function () {
    if (!booted) { boot(); return; }
    collapsed = !collapsed;
    render();
    if (!collapsed && input) input.focus();
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var v = input.value.trim();
    if (!v || !pyodide) return;
    evaluate(v);
    input.value = '';
  });

  root.querySelectorAll('[data-me-ex]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var v = chip.getAttribute('data-me-ex');
      if (pyodide) { evaluate(v); input.focus(); }
      else if (input) { input.value = v; }
    });
  });
})();
