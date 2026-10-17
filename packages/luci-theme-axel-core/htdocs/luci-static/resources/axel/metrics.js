'use strict';
'require baseclass';

// Pure formatting/health model. Missing samples never inherit a previous green state.
const valid = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const bounded = value => Math.min(100, Math.max(0, value));
const clean = value => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 160) : '';
function bytes(n) {
  if (!valid(n)) return 'нет данных';
  const units = ['B','KiB','MiB','GiB','TiB']; let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return n.toFixed(n < 10 && i > 0 ? 1 : 0) + ' ' + units[i];
}
function uptime(n) {
  if (!valid(n)) return 'нет данных';
  const day = Math.floor(n / 86400), hour = Math.floor(n / 3600) % 24, minute = Math.floor(n / 60) % 60;
  return (day ? day + ' д ' : '') + hour + ' ч ' + minute + ' мин';
}
function capacity(label, used, total, threshold) {
  if (!valid(used) || !valid(total) || total <= 0 || used > total) return {label, value:'нет данных', state:'unknown', percent:null};
  const percent = bounded(100 * used / total), bad = percent >= threshold;
  return {label, value:bytes(used) + ' / ' + bytes(total) + ' · ' + percent.toFixed(0) + '%', state:bad?'error':'ok', percent, detail:bad?'достигнут порог ' + threshold + '%':'в пределах порога ' + threshold + '%'};
}
function derive(sample, prefs) {
  const board = sample.board || {}, info = sample.info || {}, memory = info.memory || {}, disk = info.root || {};
  const available = valid(memory.available) ? memory.available :
    valid(memory.free) && valid(memory.buffered) && valid(memory.cached) ? memory.free + memory.buffered + memory.cached : null;
  const ramUsed = available != null && valid(memory.total) ? memory.total - available : null;
  const load = Array.isArray(info.load) && valid(info.load[0]) ? info.load[0] / 65535 : null;
  const interfaces = Array.isArray(sample.interfaces) ? sample.interfaces.filter(n=>n && n.interface !== 'loopback').map(n=>({
    name:clean(n.interface), protocol:clean(n.proto), up:typeof n.up === 'boolean'?n.up:null,
    addresses:[...(Array.isArray(n['ipv4-address'])?n['ipv4-address']:[]),...(Array.isArray(n['ipv6-address'])?n['ipv6-address']:[])].map(a=>clean(a.address)).filter(Boolean),
    defaultRoute:Array.isArray(n.route) && n.route.some(r=>(r.target==='0.0.0.0'||r.target==='::') && Number(r.mask)===0)
  })) : null;
  const wans = interfaces && interfaces.filter(n=>n.defaultRoute || /^wan[0-9]*$|^wan6$/.test(n.name));
  let wan = {label:'WAN',value:'не определён',state:'unknown',detail:'Внешний интерфейс не найден; возможен режим точки доступа.'};
  if (wans && wans.length) {
    const up = wans.filter(n=>n.up === true), known = wans.every(n=>typeof n.up==='boolean');
    wan = {label:'WAN',value:up.length?'поднят · '+up.map(n=>n.name).join(', '):known?'не поднят':'нет данных',state:up.length?'ok':known?'error':'unknown',detail:'Статус интерфейса; доступность интернета отдельно не проверяется.'};
  } else if (!interfaces) wan.value='нет данных';
  const radioValues = sample.wireless && typeof sample.wireless==='object' && !Array.isArray(sample.wireless) ? Object.values(sample.wireless).filter(r=>r&&typeof r.up==='boolean') : null;
  const values = {
    hostname:{label:'Хост',value:clean(board.hostname)||'нет данных',state:board.hostname?'info':'unknown'},
    model:{label:'Модель',value:clean(board.model)||'нет данных',state:board.model?'info':'unknown'},
    firmware:{label:'OpenWrt',value:clean(board.release && board.release.version)||'нет данных',state:board.release&&board.release.version?'info':'unknown'},
    uptime:{label:'Аптайм',value:uptime(info.uptime),state:valid(info.uptime)?'info':'unknown'},
    load:{label:'Load 1 мин',value:load===null?'нет данных':load.toFixed(2),state:load===null?'unknown':prefs.loadLimit>0?(load>=prefs.loadLimit?'error':'ok'):'info',detail:'Среднее число задач за минуту, не процент CPU. '+(prefs.loadLimit>0?'Порог: '+prefs.loadLimit: 'Порог не задан.')},
    memory:capacity('RAM',ramUsed,memory.total,prefs.memoryLimit),
    storage:capacity('Хранилище',valid(disk.used)?disk.used*1024:null,valid(disk.total)?disk.total*1024:null,prefs.storageLimit),
    wan
  };
  return {values,interfaces,radios:radioValues?{total:radioValues.length,up:radioValues.filter(r=>r.up).length}:null,receivedAt:sample.receivedAt||null};
}
return baseclass.extend({derive,bytes,uptime});
