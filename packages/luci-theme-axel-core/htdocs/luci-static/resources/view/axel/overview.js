'use strict';
'require view';
'require axel.telemetry as telemetry';

const link=(path,text)=>E('a',{href:L.url.apply(L,path.split('/'))},text);
const state=m=>E('span',{'class':'ax-health ax-metric-'+m.state,title:m.detail||''},m.value+(m.state==='error'?' · внимание':''));
const pair=(label,value)=>E('div',{'class':'ax-kv'},[E('dt',{},label),E('dd',{},value)]);
function panel(title,content,action) {
  return E('section',{'class':'ax-dash-box'},[E('div',{'class':'ax-box-heading'},[E('h3',{},title),action||E('span')]),content]);
}
return view.extend({
  handleSave:null,handleSaveApply:null,handleReset:null,
  render:function() {
    const live=E('span',{'class':'ax-live-label'},'Получение данных…');
    const kpis=E('div',{'class':'ax-kpis'}), interfaces=E('tbody'), device=E('dl',{'class':'ax-device-info'}), resources=E('div',{'class':'ax-resources'});
    const connectionNote=E('p',{'class':'ax-dash-note'},'WAN: состояние интерфейса, без проверки доступности интернета.');
    const table=E('table',{'class':'ax-interface-table'},[E('thead',{},E('tr',{},['Интерфейс','Протокол','Состояние','Адрес'].map(x=>E('th',{scope:'col'},x)))),interfaces]);
    const host=E('div',{'class':'ax-dashboard'},[
      E('div',{'class':'ax-page-heading'},[E('div',{},[E('div',{'class':'ax-breadcrumb'},'NETWORK CONTROL / Обзор системы'),E('h2',{},'Обзор системы'),E('p',{},'Состояние сети и устройства в одном месте.')]),live]),
      kpis,
      panel('Сетевые интерфейсы',E('div',{'class':'ax-table-scroll',tabindex:0,'aria-label':'Состояние сетевых интерфейсов'},table),link('admin/network/network','Все интерфейсы ↗')),
      E('div',{'class':'ax-dash-lower'},[panel('Информация об устройстве',device),panel('Ресурсы системы',resources,link('admin/system/axel-themes','Пороги ↗'))]),
      connectionNote,
      E('p',{'class':'ax-dash-note'},[link('admin/status/overview','Открыть полную штатную сводку LuCI'),' · Данные обновляются раз в 10 секунд. Настройки сети на этой странице не меняются.'])
    ]);
    telemetry.subscribe((data,sample)=>{
      const v=data.values;
      live.textContent=sample.info?'Обновлено · '+new Date(data.receivedAt).toLocaleTimeString():'Системные данные недоступны';
      live.className='ax-live-label '+(sample.info?'ax-metric-info':'ax-metric-unknown');
      const metric=(label,value,note)=>E('div',{'class':'ax-kpi'},[E('span',{},label),E('strong',{},value),E('small',{},note)]);
      kpis.replaceChildren(
        metric('Подключение WAN',state(v.wan),'Состояние внешнего интерфейса'),
        metric('Беспроводная сеть',data.radios?data.radios.up+' / '+data.radios.total:'—','Активных радиомодулей / всего'),
        metric('Время работы',v.uptime.value,'С последнего запуска роутера')
      );
      interfaces.replaceChildren(...(data.interfaces&&data.interfaces.length?data.interfaces.map(n=>E('tr',{},[
        E('td',{'data-title':'Интерфейс'},E('strong',{},n.name)),E('td',{'data-title':'Протокол'},n.protocol||'—'),
        E('td',{'data-title':'Состояние'},state({value:n.up===true?'Поднят':n.up===false?'Не поднят':'Нет данных',state:n.up===true?'ok':'unknown'})),
        E('td',{'class':'ax-address','data-title':'Адрес'},n.addresses.join(' · ')||'—')
      ])):[E('tr',{},E('td',{colspan:4},data.interfaces?'Нет активных записей интерфейсов.':'Данные интерфейсов недоступны.'))]));
      const b=sample.board||{};
      device.replaceChildren(pair('Имя хоста',v.hostname.value),pair('Модель',v.model.value),pair('Платформа','OpenWrt '+v.firmware.value),pair('Ядро',b.kernel||'нет данных'),pair('Время работы',v.uptime.value));
      resources.replaceChildren(...['memory','storage'].map(key=>{
        const m=v[key];return E('div',{'class':'ax-resource'},[
          E('div',{'class':'ax-resource-label'},[E('span',{},m.label),state(m)]),
          E('div',{'class':'ax-resource-bar',role:'progressbar','aria-label':m.label,'aria-valuemin':0,'aria-valuemax':100,'aria-valuenow':m.percent===null?null:Math.round(m.percent),'aria-valuetext':m.value},
            E('span',{'class':m.state==='error'?'ax-resource-error':'',style:'width:'+(m.percent===null?0:m.percent)+'%'}))
        ]);
      }),E('div',{'class':'ax-resource-label'},[E('span',{},'Нагрузка · Load 1 мин'),state(v.load)]),E('p',{'class':'ax-dash-note'},'Load average — среднее число задач, не процент CPU.'));
    });
    return host;
  }
});
