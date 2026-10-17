// This harness runs the actual packaged modules with explicit local mock RPC only.
(async function(){
  const E=(tag,attrs={},children=[])=>{const el=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(typeof v==='function')el.addEventListener(k,v);else if(v!=null&&v!==false)el.setAttribute(k,String(v));}for(const c of (Array.isArray(children)?children:[children]))if(c!=null)el.append(c instanceof Node?c:document.createTextNode(String(c)));return el;};
  const baseclass={extend:obj=>obj};let scenario='normal';
  const source=path=>fetch(path).then(r=>r.text());
  const metrics=new Function('baseclass',await source('/metrics.js'))(baseclass);
  const sample=()=>({board:{hostname:'ATLAS Gateway',model:'Тестовый маршрутизатор',kernel:'6.12.94',release:{version:'25.12.5'}},info:{uptime:303000,load:[13107,10000,5000],memory:{total:512*1048576,available:(scenario==='warning'?10:340)*1048576},root:{total:128*1024,used:(scenario==='warning'?125:24)*1024}},interfaces:{interface:[{interface:'wan',proto:'dhcp',up:scenario!=='warning','ipv4-address':[{address:'192.0.2.10'}],route:[{target:'0.0.0.0',mask:0}]},{interface:'lan',proto:'static',up:true,'ipv4-address':[{address:'192.168.50.1'}]}]},wireless:{radio0:{up:true},radio1:{up:true}}});
  const rpc={declare:({method})=>()=>scenario==='offline'?Promise.reject(new Error('Mock offline')):Promise.resolve(sample()[{board:'board',info:'info',dump:'interfaces',getWirelessDevices:'wireless'}[method]])};
  const telemetry=new Function('baseclass','rpc','poll','metrics','E',await source('/telemetry.js'))(baseclass,rpc,{add:(f,n)=>setInterval(f,n*1000)},metrics,E);
  const L={url:(...parts)=>parts.includes('axel-themes')?'#appearance':parts.includes('axel-overview')?'#overview':'#system'};
  const overview=new Function('view','telemetry','E','L',await source('/overview-view.js'))(baseclass,telemetry,E,L).render();
  const settings=new Function('view','E',await source('/settings-view.js'))(baseclass,E).render();
  const nativeDoc=new DOMParser().parseFromString(await source('/native'),'text/html');
  const system=nativeDoc.querySelector('#system-fixture');
  const container=document.querySelector('#fixture-view');
  function section(){const hash=location.hash;container.replaceChildren(hash==='#appearance'?settings:hash==='#system'?system:overview);document.querySelectorAll('.ax-sidebar a,.ax-overview-link').forEach(a=>{if(a.hash===(hash||'#overview'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});}
  addEventListener('hashchange',section);section();
  document.querySelectorAll('[data-scenario]').forEach(button=>button.addEventListener('click',()=>{scenario=button.dataset.scenario;telemetry.refresh();}));
  telemetry.start();
})();
