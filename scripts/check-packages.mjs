import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const core='packages/luci-theme-axel-core/';
for(const name of ['axel-core','axel','atlas']) assert.match(read('packages/luci-theme-'+name+'/Makefile'),/call BuildPackage/,'SDK scan marker');
for(const name of ['axel','atlas']) {
  const path='packages/luci-theme-'+name+'/';
  assert.match(read(path+'Makefile'),/\+luci-theme-axel-core/);
  assert.match(read(path+'ucode/template/themes/'+name+'/header.ut'),/themes\/axel-core\/header/);
  assert.match(read(path+'ucode/template/themes/'+name+'/footer.ut'),/themes\/axel-core\/footer/);
  const defaults=read(path+'root/etc/uci-defaults/90_luci-theme-'+name);
  assert.doesNotMatch(defaults,/mediaurlbase|network\.|firewall\.|dhcp\./);
  assert.match(read(path+'Makefile'),/mediaurlbase=\/luci-static\/bootstrap/);
}
for(const filename of ['mode.js','shell.js']) {
  const js=read(core+'htdocs/luci-static/axel-core/'+filename);
  new Function(js);
  assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|eval\(/);
}
const header=read(core+'ucode/template/themes/axel-core/header.ut');
for(const hook of ['No password set!','initramfs','JavaScript required!','id="topmenu"','id="tabmenu"','id="indicators"','id="maincontent"']) assert.ok(header.includes(hook),hook);
assert.match(read(core+'ucode/template/themes/axel-core/footer.ut'),/L.require\('menu-bootstrap'\)/);
const css=read(core+'htdocs/luci-static/axel-core/theme.css');
for(const hook of ['prefers-reduced-motion','focus-visible','max-width:600px','max-width:900px','data-darkmode=true','.vpn-tunneling']) assert.ok(css.includes(hook),hook);
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
const digest=path=>createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex');
for(const [original,dest] of [['atlas_logo_white.png','atlas-logo-white.png'],['preload.png','preload.png']]) assert.equal(digest('design/assets/atlas/'+original),digest('packages/luci-theme-atlas/htdocs/luci-static/atlas/'+dest));
assert.equal(existsSync(new URL('../packages/luci-theme-mrx',import.meta.url)),false,'MRx stays pending design approval');
console.log('PASS package sources, native LuCI hooks, original assets, JS syntax and isolation. SDK/device validation remains separate.');
