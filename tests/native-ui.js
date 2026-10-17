// Local regression harness; never shipped in a router package.
(async function(){
  const E=(tag,attrs={},children=[])=>{const el=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(typeof v==='function')el.addEventListener(k,v);else if(v!=null&&v!==false)el.setAttribute(k,String(v));}for(const c of (Array.isArray(children)?children:[children]))if(c!=null)el.append(c instanceof Node?c:document.createTextNode(String(c)));return el;};
  const source=await(await fetch('/settings-view.js')).text();
  const page=new Function('view','E',source)({extend:obj=>obj},E);
  document.querySelector('#settings-fixture').append(page.render());
  function section(){const settings=location.hash==='#appearance';document.querySelector('#settings-fixture').hidden=!settings;document.querySelector('#system-fixture').hidden=settings;}
  addEventListener('hashchange',section);section();
})();
