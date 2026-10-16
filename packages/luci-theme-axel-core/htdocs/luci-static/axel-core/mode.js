(function () {
  'use strict';
  const root = document.documentElement;
  const key = 'axel-luci-mode:' + root.dataset.axelTheme;
  let value;
  try { value = localStorage.getItem(key); } catch (_) { /* Private mode / disabled storage. */ }
  if (value === 'light' || value === 'dark') root.dataset.darkmode = String(value === 'dark');
})();
