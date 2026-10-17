'use strict';
'require baseclass';
'require rpc';
'require poll';
'require axel.metrics as metrics';

const boardCall=rpc.declare({object:'system',method:'board',reject:true});
const infoCall=rpc.declare({object:'system',method:'info',reject:true});
const interfacesCall=rpc.declare({object:'network.interface',method:'dump',reject:true});
const wirelessCall=rpc.declare({object:'luci-rpc',method:'getWirelessDevices',reject:true});
let board=null, boardAt=0, sample={}, running=false, pending=null, track=null, trackKey='', listeners=[];
const prefs=()=>window.AxelThemePreferences?window.AxelThemePreferences.get():{ticker:true,tickerItems:['uptime','load','memory','storage','wan'],memoryLimit:90,storageLimit:90,loadLimit:0};
const model=()=>metrics.derive(sample,prefs());
const receive=call=>Promise.resolve().then(call).catch(()=>null);
function statusText(m) { return m.label + ': ' + m.value + (m.state==='error'?' · внимание':''); }
function paintTicker(data) {
  const windowEl=document.querySelector('.ax-ticker'); if (!windowEl) return;
  const selected=prefs().tickerItems;
  if (!track || trackKey!==selected.join('|')) {
    trackKey=selected.join('|'); track=E('div',{'class':'ax-ticker-track'});
    for (let copy=0;copy<2;copy++) {
      const group=E('div',{'class':'ax-ticker-copy','aria-hidden':copy?'true':null});
      selected.forEach(key=>group.append(E('span',{'data-ax-metric':key}),E('b',{'class':'ax-ticker-slash','aria-hidden':'true'},'/')));
      if (!selected.length) group.append(E('span',{'class':'ax-metric-unknown'},'Выберите показатели в настройках оформления'));
      track.append(group);
    }
    track.style.animationDuration=Math.max(30,selected.length*7)+'s';
    windowEl.replaceChildren(track);
  }
  track.querySelectorAll('[data-ax-metric]').forEach(el=>{
    const m=data.values[el.dataset.axMetric];el.textContent=statusText(m);el.className='ax-metric-'+m.state;el.title=m.detail||'';
  });
}
function publish() {
  const data=model(); paintTicker(data);
  listeners.forEach(fn=>{try{fn(data,sample);}catch(error){console.warn('AXEL view update failed',error.name);}});
}
function refresh() {
  if (pending) return pending;
  if (document.hidden || (!prefs().ticker && !listeners.length)) return Promise.resolve();
  const getBoard=!board || Date.now()-boardAt>60000 ? receive(boardCall).then(value=>{board=value;boardAt=Date.now();return value;}):Promise.resolve(board);
  pending=Promise.all([getBoard,receive(infoCall),receive(interfacesCall),listeners.length?receive(wirelessCall):Promise.resolve(null)]).then(([b,i,n,w])=>{
    sample={board:b,info:i,interfaces:n&&Array.isArray(n.interface)?n.interface:null,wireless:w,receivedAt:Date.now()};publish();
  }).finally(()=>{pending=null;});
  return pending;
}
function start() {
  if (running) return; running=true;
  publish(); refresh(); poll.add(refresh,10);
  document.addEventListener('axel-preferences-change',()=>{publish();refresh();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
}
return baseclass.extend({start,refresh,subscribe(fn){listeners.push(fn);start();fn(model(),sample);refresh();return()=>{listeners=listeners.filter(x=>x!==fn);};}});
