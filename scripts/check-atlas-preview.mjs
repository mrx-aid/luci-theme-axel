import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fragment = readFileSync(new URL('../design/atlas.fragment.html', import.meta.url), 'utf8');
assert.ok(Buffer.byteLength(fragment) < 1_000_000, 'Inline preview must remain under 1 MB');
assert.ok(!/<(?:html|body|head)(?:\s|>)/i.test(fragment), 'Source must be an HTML fragment');
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(fragment), 'No router or network access');
assert.ok(!fragment.includes('192.168.1.1'), 'Do not embed the live router address');
assert.ok(fragment.includes('container:atlas / inline-size'), 'Respond to the actual panel width');
assert.ok(fragment.includes('@container atlas (max-width:700px)'), 'Small-screen table layout must exist');
assert.ok(fragment.includes("revision:'heritage-05'"), 'Expected ticker and profile revision');
assert.ok(fragment.includes('data-action="ticker"') && fragment.includes('tickerPaused:state.tickerPaused'), 'Ticker must have a persistent pause control');
assert.ok(fragment.includes('@media(prefers-reduced-motion:reduce)'), 'Ticker must respect reduced motion');
assert.ok(fragment.includes('data-lucide="chevron-down"') && !fragment.includes('⌄'), 'Account must use an aligned icon, not a baseline-dependent glyph');
assert.ok(fragment.includes('class="at-account-wrap"') && fragment.includes('width:min(318px,calc(100cqi - 28px))'), 'Account panel must anchor to its trigger and fit the panel width');
assert.ok(fragment.includes('data-mode="light"') && fragment.includes('data-mode="dark"'), 'Both theme buttons must exist');
assert.ok(fragment.includes('mode:state.mode'), 'Theme selection must be remembered');
assert.ok(fragment.includes('at-cell-label') && fragment.includes('aria-hidden'), 'Mobile labels must not duplicate table headers for screen readers');
assert.ok(fragment.includes('new ResizeObserver'), 'Navigation must follow actual available width');
assert.ok(fragment.includes('data:image/png;base64,'), 'Original embedded logo is required');
const avatar = fragment.match(/data-atlas-avatar="preload\.png" src="data:image\/png;base64,([A-Za-z0-9+/=]+)"/);
assert.ok(avatar, 'Use the supplied ATLAS avatar placeholder');
assert.deepEqual(Buffer.from(avatar[1], 'base64'), readFileSync(new URL('../design/assets/atlas/preload.png', import.meta.url)), 'Avatar must match the unmodified original');
for (const match of fragment.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  new Function(match[1]); // Parse only; no DOM code or user data is executed.
}
const luminance = hex => {
  const value = hex.slice(1);
  const rgb = value.length === 3 ? [...value].map(c => c + c).join('') : value;
  const c = [0, 2, 4].map(i => parseInt(rgb.slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
};
const contrast = (a, b) => {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const palettes = [...fragment.matchAll(/^#atlas-heritage(?:\[data-mode=dark\])?\{([^\n]+)\}/gm)];
assert.equal(palettes.length, 2);
for (const [index, match] of palettes.entries()) {
  const colors = Object.fromEntries([...match[1].matchAll(/--at-([\w-]+):(#[\da-f]{3,6});/gi)].map(m => [m[1], m[2]]));
  colors.white = '#ffffff';
  for (const [foreground, background] of [['ink', 'canvas'], ['muted', 'surface'], ['secondary', 'soft'], ['blue-dark', 'soft'], ['ok-ink', 'ok-bg'], ['white', 'action']]) {
    assert.ok(contrast(colors[foreground], colors[background]) >= 4.5, `Palette ${index}: ${foreground}/${background} must stay readable`);
  }
}
console.log('PASS: ATLAS syntax, responsive hooks, Light/Dark controls and key text contrast pairs, embedded logo, no router/network calls.');
console.log('This is a prototype source check, not a LuCI installation test.');
