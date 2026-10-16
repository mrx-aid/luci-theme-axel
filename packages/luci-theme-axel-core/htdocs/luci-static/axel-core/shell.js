(function () {
  'use strict';
  const root = document.documentElement;
  const modeButtons = document.querySelectorAll('[data-ax-mode]');
  function updateMode() {
    const dark = root.dataset.darkmode === 'true';
    modeButtons.forEach(button => {
      button.textContent = dark ? '☀ Light' : '☾ Dark';
      button.setAttribute('aria-pressed', String(dark));
    });
  }
  modeButtons.forEach(button => button.addEventListener('click', () => {
    root.dataset.darkmode = String(root.dataset.darkmode !== 'true');
    try { localStorage.setItem('axel-luci-mode:' + root.dataset.axelTheme, root.dataset.darkmode === 'true' ? 'dark' : 'light'); } catch (_) {}
    updateMode();
  }));
  updateMode();
  const toggle = document.querySelector('[data-ax-nav]');
  const header = document.querySelector('.ax-header');
  const account = document.querySelector('.ax-account');
  function closeMenu() { if (toggle) toggle.setAttribute('aria-expanded','false'); if (header) header.classList.remove('ax-nav-open'); }
  if (toggle) toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded',String(open)); header.classList.toggle('ax-nav-open',open);
    if (account) account.open = false;
  });
  if (account) account.addEventListener('toggle', () => { if (account.open) closeMenu(); });
  document.addEventListener('click', event => {
    if (account && !account.contains(event.target)) account.open = false;
    if (header && !header.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (account && account.open) { account.open = false; account.querySelector('summary').focus(); }
    if (toggle && toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); }
  });
})();
