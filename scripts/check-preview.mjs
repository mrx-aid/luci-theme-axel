import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const fragment = read('design/prototype.fragment.html');
const preview = read('preview/index.html');
const tokens = JSON.parse(read('design/tokens.json'));
assert.deepEqual(Object.keys(tokens.themes), ['axel', 'atlas', 'mrx']);
for (const theme of Object.values(tokens.themes)) {
  assert.ok(fragment.includes(`data-variant="${theme.name}"`), `Missing variant: ${theme.name}`);
  assert.ok(fragment.includes(theme.background), `Missing palette: ${theme.name}`);
}
assert.ok(Buffer.byteLength(fragment) < 1_000_000);
assert.ok(!/<(?:html|body|head)(?:\s|>)/i.test(fragment), 'Editable source must be a fragment');
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(fragment), 'Prototype must not access a router or API');
assert.ok(!/192\.168\.1\.1|BEGIN (?:OPENSSH |RSA )?PRIVATE KEY/.test(fragment));
assert.ok(preview.startsWith('<!doctype html>'), 'Export must be standalone');
for (const match of fragment.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  new Function(match[1]); // Parse only: no DOM or application code is executed.
}
console.log('OK: three variants, valid tokens and script syntax, no router API calls in the prototype.');
console.log('This is a source check, not an installed LuCI compatibility test.');
