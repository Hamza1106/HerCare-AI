/**
 * use3DCard — attaches mouse-tracking 3D tilt + spotlight ONLY to
 * .dashboard-tilt-card elements (the quick-action cards on the dashboard).
 * Tilt is intentionally subtle (MAX_TILT reduced to 5deg).
 */
export function init3DCards() {
  const MAX_TILT = 5; // was 12 — much softer now

  function onEnter(e) {
    e.currentTarget.style.animationPlayState = 'paused';
  }

  function onMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const ry = ((x - cx) / cx) * MAX_TILT;
    const rx = -((y - cy) / cy) * MAX_TILT;

    const gx = ((x / rect.width) * 100).toFixed(1) + '%';
    const gy = ((y / rect.height) * 100).toFixed(1) + '%';

    card.style.setProperty('--card-rx', rx.toFixed(2) + 'deg');
    card.style.setProperty('--card-ry', ry.toFixed(2) + 'deg');
    card.style.setProperty('--card-gx', gx);
    card.style.setProperty('--card-gy', gy);
    card.style.transition = 'box-shadow 0.35s ease, border-color 0.25s ease';
  }

  function onLeave(e) {
    const card = e.currentTarget;
    card.style.setProperty('--card-rx', '0deg');
    card.style.setProperty('--card-ry', '0deg');
    card.style.setProperty('--card-gx', '50%');
    card.style.setProperty('--card-gy', '50%');
    card.style.transition =
      'box-shadow 0.35s ease, border-color 0.25s ease, transform 0.55s cubic-bezier(0.2,0.7,0.3,1)';
    e.currentTarget.style.animationPlayState = '';
  }

  function attach(card) {
    if (card._3dAttached) return;
    card._3dAttached = true;
    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  }

  function detach(card) {
    card.removeEventListener('mouseenter', onEnter);
    card.removeEventListener('mousemove', onMove);
    card.removeEventListener('mouseleave', onLeave);
    card._3dAttached = false;
  }

  // Only attach to .dashboard-tilt-card — NOT all .card elements
  document.querySelectorAll('.dashboard-tilt-card').forEach(attach);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.classList?.contains('dashboard-tilt-card')) attach(node);
        node.querySelectorAll?.('.dashboard-tilt-card').forEach(attach);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    document.querySelectorAll('.dashboard-tilt-card').forEach(detach);
  };
}