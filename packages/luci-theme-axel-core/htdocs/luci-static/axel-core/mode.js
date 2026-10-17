(function () {
  'use strict';
  const root = document.documentElement;
  const family = root.dataset.axelTheme === 'atlas' ? 'atlas' : 'axel';
  const key = 'axel-luci-preferences-v1:' + family;
  const metrics = ['hostname','model','firmware','uptime','load','memory','storage','wan'];
  const defaults = { mode:family === 'atlas' ? 'light' : 'dark', accent:'brand', radius:'brand', density:'comfortable', width:'wide', animations:true, ticker:true, tickerText:'', tickerItems:['uptime','load','memory','storage','wan'], memoryLimit:90, storageLimit:90, loadLimit:0, sidebar:true, banner:true, pattern:'none', transparency:false };
  const copy = value => Object.assign({}, value, {tickerItems:value.tickerItems.slice()});
  defaults.headerWidth='content';defaults.headerMax=1440;
  const choices = { mode:['auto','light','dark'], accent:['brand','blue','teal','violet','amber'], radius:['brand','sharp','soft','round'], density:['comfortable','compact'], width:['standard','wide','fluid'], headerWidth:['full','content','custom'], pattern:['none','grid','dots'] };
  function normalize(value) {
    const out = copy(defaults);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
    Object.keys(choices).forEach(name => { if (choices[name].includes(value[name])) out[name] = value[name]; });
    ['animations','ticker','transparency','sidebar','banner'].forEach(name => { if (typeof value[name] === 'boolean') out[name] = value[name]; });
    if (Array.isArray(value.tickerItems)) out.tickerItems = metrics.filter(name => value.tickerItems.includes(name));
    ['memoryLimit','storageLimit'].forEach(name => { if (Number.isFinite(value[name]) && value[name] >= 1 && value[name] <= 100) out[name] = Math.round(value[name]); });
    if (Number.isFinite(value.loadLimit) && value.loadLimit >= 0 && value.loadLimit <= 128) out.loadLimit = Math.round(value.loadLimit * 100) / 100;
    if (Number.isFinite(value.headerMax) && value.headerMax >= 960 && value.headerMax <= 2400) out.headerMax=Math.round(value.headerMax);
    if (typeof value.tickerText === 'string') out.tickerText = value.tickerText.replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,160).trim();
    return out;
  }
  let prefs;
  try { prefs = normalize(JSON.parse(localStorage.getItem(key))); }
  catch (_) { prefs = normalize(null); }
  try {
    if (!localStorage.getItem(key)) {
      const legacy = localStorage.getItem('axel-luci-mode:' + family);
      if (legacy === 'light' || legacy === 'dark') prefs.mode = legacy;
    }
  } catch (_) {}
  const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
  function apply() {
    const dark = prefs.mode === 'auto' ? !!(media && media.matches) : prefs.mode === 'dark';
    root.dataset.darkmode = String(dark);
    root.dataset.axAnimations = String(prefs.animations);
    root.dataset.axDensity = prefs.density;
    root.dataset.axPattern = prefs.pattern;
    root.dataset.axTransparency = String(prefs.transparency);
    root.dataset.axSidebar = String(prefs.sidebar);
    root.dataset.axBanner = String(prefs.banner);
    root.dataset.axHeaderWidth = prefs.headerWidth;
    root.style.setProperty('--ax-header-custom',prefs.headerMax+'px');
    root.style.setProperty('--ax-content-width', {standard:'1200px',wide:'1440px',fluid:'20000px'}[prefs.width]);
    if (prefs.radius === 'brand') root.style.removeProperty('--ax-radius');
    else root.style.setProperty('--ax-radius', {sharp:'0px',soft:'8px',round:'16px'}[prefs.radius]);
    if (prefs.accent === 'brand') {
      ['--ax-accent','--ax-on-accent','--ax-soft'].forEach(name => root.style.removeProperty(name));
    } else {
      const palettes = {blue:['#0566d9','#72b2ff'],teal:['#087c69','#78e6ce'],violet:['#7446bd','#c5a3ff'],amber:['#936000','#ffd27c']};
      root.style.setProperty('--ax-accent', palettes[prefs.accent][dark ? 1 : 0]);
      root.style.setProperty('--ax-on-accent', dark ? '#101721' : '#ffffff');
      root.style.setProperty('--ax-soft', dark ? '#263040' : '#edf1f7');
    }
    const ticker = document.querySelector('.ax-ticker');
    const tickerControl = document.querySelector('[data-ax-ticker]');
    if (tickerControl) tickerControl.hidden = !prefs.ticker || !prefs.animations;
    if (ticker) {
      ticker.hidden = !prefs.ticker;
      const text = ticker.querySelector('.ax-ticker-fallback');
      if (text) {
        if (!text.dataset.originalText) text.dataset.originalText = text.textContent;
        text.textContent = prefs.tickerText || text.dataset.originalText;
      }
    }
    document.dispatchEvent(new Event('axel-preferences-change'));
  }
  window.AxelThemePreferences = Object.freeze({
    family,
    metrics: metrics.slice(),
    get: () => copy(prefs),
    defaults: () => copy(defaults),
    normalize,
    save(value) {
      const next = normalize(value);
      try { localStorage.setItem(key, JSON.stringify(next)); }
      catch (_) { throw new Error('Браузер запретил сохранение оформления. Проверьте разрешение локального хранилища.'); }
      prefs = next; apply(); return this.get();
    },
    reset() { return this.save(defaults); }
  });
  apply();
  document.addEventListener('DOMContentLoaded', apply, {once:true});
  if (media && media.addEventListener) media.addEventListener('change', () => { if (prefs.mode === 'auto') apply(); });
})();
