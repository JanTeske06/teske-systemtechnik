/* Lightweight image lightbox with click-to-zoom + drag-to-pan.
   Hooks anchors marked with [data-lightbox] so clicking opens the linked
   image inside a near-fullscreen <dialog>. Click on the image once to zoom
   in (2x), drag to pan, click again to zoom back out.
   No-JS fallback: the anchor still works as a regular link. */
(function () {
  const CLICK_ZOOM = 2;
  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const WHEEL_STEP = 0.2;
  const EASE = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
  const EASE_FAST = 'transform 0.08s linear';

  function createDialog() {
    const dlg = document.createElement('dialog');
    dlg.id = 'img-lightbox';
    Object.assign(dlg.style, {
      position: 'fixed',
      inset: '0',
      margin: '0',
      padding: '0',
      maxWidth: 'none',
      maxHeight: 'none',
      width: '100vw',
      height: '100vh',
      border: 'none',
      background: 'rgba(12, 10, 9, 0.94)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      overflow: 'hidden',
      color: 'inherit',
    });

    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      boxSizing: 'border-box',
      cursor: 'zoom-out',
      overflow: 'hidden',
    });

    const img = document.createElement('img');
    Object.assign(img.style, {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      borderRadius: '0.5rem',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      cursor: 'zoom-in',
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      transformOrigin: 'center center',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    });
    img.alt = '';
    img.draggable = false;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      width: '2.75rem',
      height: '2.75rem',
      borderRadius: '9999px',
      border: 'none',
      background: 'rgba(28, 25, 23, 0.85)',
      color: '#f5f5f4',
      fontSize: '1.75rem',
      lineHeight: '1',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.15s ease',
      zIndex: '10',
    });
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(68, 64, 60, 0.95)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(28, 25, 23, 0.85)';
    });

    wrap.appendChild(img);
    wrap.appendChild(closeBtn);
    dlg.appendChild(wrap);
    document.body.appendChild(dlg);

    // --- State for zoom + pan ---
    let scale = 1;                // current scale (continuous, 1..MAX_SCALE)
    let dragging = false;
    let wasDrag = false;          // true once the cursor has moved past DRAG_THRESHOLD during a press
    let startX = 0, startY = 0;   // anchor for translate calculation
    let downX = 0, downY = 0;     // raw mousedown position for drag-threshold check
    let offsetX = 0, offsetY = 0;
    const DRAG_THRESHOLD = 5;     // px movement before a press counts as a drag

    const isZoomed = () => scale > 1.001;

    const applyTransform = () => {
      img.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    };

    const updateCursor = () => {
      if (dragging) img.style.cursor = 'grabbing';
      else if (isZoomed()) img.style.cursor = 'grab';
      else img.style.cursor = 'zoom-in';
    };

    const resetZoom = () => {
      scale = 1;
      dragging = false;
      wasDrag = false;
      offsetX = 0;
      offsetY = 0;
      img.style.transition = EASE;
      updateCursor();
      applyTransform();
    };

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dlg.close();
    });

    // Click on backdrop (outside the image) closes the dialog.
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target === dlg) dlg.close();
    });

    // Click on image: toggle 1x <-> CLICK_ZOOM, but only if this wasn't a drag.
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      if (wasDrag) {
        wasDrag = false;
        return;
      }
      if (!isZoomed()) {
        scale = CLICK_ZOOM;
        offsetX = 0;
        offsetY = 0;
        img.style.transition = EASE;
        applyTransform();
        updateCursor();
      } else {
        resetZoom();
      }
    });

    // Wheel anywhere inside the lightbox: zoom in/out, prevent page-scroll.
    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + dir * WHEEL_STEP));
      if (next === scale) return;
      scale = next;
      if (scale === 1) {
        offsetX = 0;
        offsetY = 0;
      }
      img.style.transition = EASE_FAST;
      updateCursor();
      applyTransform();
    }, { passive: false });

    // Drag-to-pan: only active while zoomed.
    img.addEventListener('mousedown', (e) => {
      if (!isZoomed() || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      wasDrag = false;
      downX = e.clientX;
      downY = e.clientY;
      startX = e.clientX - offsetX;
      startY = e.clientY - offsetY;
      img.style.cursor = 'grabbing';
      img.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      offsetX = e.clientX - startX;
      offsetY = e.clientY - startY;
      applyTransform();
      if (!wasDrag) {
        const dx = e.clientX - downX;
        const dy = e.clientY - downY;
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
          wasDrag = true;
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      img.style.transition = EASE;
      updateCursor();
      // wasDrag remains true if the cursor moved past threshold;
      // the next click handler will consume + reset it.
    });

    // Reset state when the dialog closes.
    dlg.addEventListener('close', () => {
      resetZoom();
      img.removeAttribute('src');
    });

    return { dlg, img };
  }

  function init() {
    const triggers = document.querySelectorAll('a[data-lightbox]');
    if (!triggers.length) return;
    if (typeof HTMLDialogElement === 'undefined') return;

    const { dlg, img } = createDialog();

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        // Allow middle-click / ctrl-click to keep native open-in-new-tab.
        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        const href = trigger.getAttribute('href');
        const innerImg = trigger.querySelector('img');
        img.src = href;
        img.alt = innerImg ? (innerImg.alt || '') : '';
        dlg.showModal();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
