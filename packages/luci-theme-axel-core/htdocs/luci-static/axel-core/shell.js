(function () {
  'use strict';
  const root = document.documentElement;
  const modeButtons = document.querySelectorAll('[data-ax-mode]');
  function updateMode() {
    const dark = root.dataset.darkmode === 'true';
    modeButtons.forEach(button => {
      button.textContent = dark ? '☀ Light' : '☾ Dark';
      button.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
      button.setAttribute('aria-pressed', String(dark));
    });
    document.querySelectorAll('[data-ax-mode-value]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.axModeValue===(dark?'dark':'light'))));
  }
  modeButtons.forEach(button => button.addEventListener('click', () => {
    const prefs = window.AxelThemePreferences;
    const mode = root.dataset.darkmode === 'true' ? 'light' : 'dark';
    if (prefs) {
      try { prefs.save(Object.assign(prefs.get(), {mode})); }
      catch (_) { root.dataset.darkmode = String(mode === 'dark'); }
    } else root.dataset.darkmode = String(mode === 'dark');
    updateMode();
  }));
  updateMode();
  document.querySelectorAll('[data-ax-mode-value]').forEach(button=>button.addEventListener('click',()=>{
    try { window.AxelThemePreferences.save(Object.assign(window.AxelThemePreferences.get(),{mode:button.dataset.axModeValue})); }
    catch (_) { root.dataset.darkmode=String(button.dataset.axModeValue==='dark');updateMode(); }
  }));
  document.addEventListener('axel-preferences-change', updateMode);
  const tickerControl = document.querySelector('[data-ax-ticker]');
  if (tickerControl) tickerControl.addEventListener('click', () => {
    const paused = tickerControl.getAttribute('aria-pressed') !== 'true';
    tickerControl.setAttribute('aria-pressed', String(paused));
    tickerControl.setAttribute('aria-label', paused ? 'Продолжить бегущую строку' : 'Приостановить бегущую строку');
    tickerControl.textContent = paused ? '▶' : 'Ⅱ';
    const ticker = document.querySelector('.ax-ticker');
    if (ticker) ticker.dataset.paused=String(paused);
  });
  const panelToggle=document.querySelector('[data-ax-panel]');
  const compact=matchMedia('(max-width: 900px)');
  function updatePanel(){if(panelToggle)panelToggle.setAttribute('aria-expanded',String(compact.matches?root.dataset.axMobilePanel==='true':root.dataset.axSidebar!=='false'));}
  if(panelToggle)panelToggle.addEventListener('click',()=>{
    if(compact.matches){root.dataset.axMobilePanel=String(root.dataset.axMobilePanel!=='true');updatePanel();return;}
    try{window.AxelThemePreferences.save(Object.assign(window.AxelThemePreferences.get(),{sidebar:root.dataset.axSidebar==='false'}));}
    catch(_){root.dataset.axSidebar=String(root.dataset.axSidebar==='false');}
    updatePanel();
  });
  updatePanel();document.addEventListener('axel-preferences-change',updatePanel);
  compact.addEventListener('change',updatePanel);
  document.querySelectorAll('.ax-sidebar a,.ax-overview-link').forEach(a=>{if(a.pathname===location.pathname)a.setAttribute('aria-current','page');});
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
