'use strict';
'require view';

return view.extend({
  handleSave:null, handleSaveApply:null, handleReset:null,
  render:function() {
    const api = window.AxelThemePreferences;
    if (!api) return E('div', {}, [E('h2', {}, 'Настройки оформления'), E('p', {}, 'Эта панель работает в темах ATLAS и AXEL Mesh. Сначала выберите одну из них в разделе «Система → Язык и тема».')]);
    const values = api.get(), fields = {};
    const status = E('p', {'class':'ax-settings-status', 'role':'status', 'aria-live':'polite'}, '');
    const select = (name, label, options, hint) => {
      const control = E('select', {id:'ax-pref-'+name}, options.map(([value,text]) => E('option', {value,selected:values[name]===value ? '' : null}, text)));
      fields[name] = control;
      return E('div', {'class':'ax-settings-field'}, [E('label', {for:control.id}, label), E('div', {}, [control, E('small', {}, hint)])]);
    };
    const flag = (name,label,hint) => {
      const control=E('input',{id:'ax-pref-'+name,type:'checkbox',checked:values[name] ? '' : null}); fields[name]=control;
      return E('div', {'class':'ax-settings-field'}, [E('label',{for:control.id},label),E('div',{},[control,E('small',{},hint)])]);
    };
    const metricFields={};
    const metricLabels={hostname:'Имя роутера',model:'Модель устройства',firmware:'Версия OpenWrt',uptime:'Время работы',load:'Нагрузка — Load average (1 мин)',memory:'Использование RAM',storage:'Использование хранилища',wan:'Состояние WAN-интерфейса'};
    const metricList=E('div',{'class':'ax-metric-options'},Object.entries(metricLabels).map(([key,label])=>{
      const control=E('input',{id:'ax-metric-'+key,type:'checkbox',checked:values.tickerItems.includes(key)?'':null});metricFields[key]=control;
      return E('label',{for:control.id},[control,E('span',{},label)]);
    }));
    const number=(name,label,min,max,step,hint)=>{
      const input=E('input',{id:'ax-pref-'+name,type:'number',min,max,step,value:values[name]});fields[name]=input;
      return E('div',{'class':'ax-settings-field'},[E('label',{for:input.id},label),E('div',{},[input,E('small',{},hint)])]);
    };
    const read = () => {
      const result=Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value]));
      result.tickerItems=Object.keys(metricFields).filter(key=>metricFields[key].checked);
      return result;
    };
    const write = value => {Object.entries(fields).forEach(([key,input])=>{if(input.type==='checkbox')input.checked=value[key];else input.value=value[key];});Object.keys(metricFields).forEach(key=>{metricFields[key].checked=value.tickerItems.includes(key);});};
    const save=()=>{if(Object.values(fields).some(input=>!input.reportValidity()))return;try { write(api.save(read())); status.textContent='Оформление сохранено в этом браузере. Сетевые настройки не изменены.'; } catch (e) { status.textContent=e.message; }};
    const reset=()=>{try { write(api.reset()); status.textContent='Стандартное оформление этой темы восстановлено. Другие темы не изменены.'; } catch (e) { status.textContent=e.message; }};
    return E('div',{'class':'ax-settings'},[
      E('h2',{},'Настройки '+(api.family==='atlas'?'ATLAS':'AXEL Mesh')),
      E('p',{'class':'ax-settings-note'},'Эти настройки сохраняются только в текущем браузере и отдельно для каждой темы. На другом устройстве оформление останется прежним. Здесь нет изменений сети, VPN, паролей или конфигурации роутера.'),
      E('section',{'class':'cbi-section'},[E('h3',{},'Внешний вид'),
        select('mode','Режим темы',[['auto','Авто — как в системе'],['light','Светлый'],['dark','Тёмный']],'Кнопка Light / Dark в шапке также сохраняет выбранный режим.'),
        select('accent','Акцентный цвет',[['brand','Фирменный'],['blue','Синий'],['teal','Бирюзовый'],['violet','Фиолетовый'],['amber','Янтарный']],'Для светлого и тёмного режима используются отдельные контрастные оттенки.'),
        select('radius','Скругление',[['brand','Фирменное'],['sharp','Без скругления'],['soft','Мягкое — 8 px'],['round','Выраженное — 16 px']],'Панели, поля, диалоги и кнопки; логотип не изменяется.'),
        select('pattern','Подложка',[['none','Чистый фон'],['grid','Сетка'],['dots','Точки']],'Локальный CSS-узор без загрузки сторонних изображений.'),
        flag('transparency','Прозрачность','Лёгкое размытие подложки меню профиля. По умолчанию выключено.')
      ]),
      E('section',{'class':'cbi-section'},[E('h3',{},'Макет и движение'),
        select('width','Ширина содержимого',[['standard','Стандартная — до 1200 px'],['wide','Широкая — до 1440 px'],['fluid','Вся доступная ширина']],'На узком экране содержимое адаптируется к окну.'),
        ...(api.family==='atlas'?[
          select('headerWidth','Выравнивание шапки',[['content','По ширине содержимого'],['full','На весь экран'],['custom','Своя ширина']],'Сдвигает логотип и меню ближе к центру или к краям в обеих полосах шапки. Чёрный фон всегда на всю ширину; размер текста и логотипа не меняется.'),
          number('headerMax','Своя ширина шапки, px',960,2400,1,'Применяется при выборе «Своя ширина». Общая ширина внутренней области: меньше — элементы ближе к центру, больше — дальше друг от друга. На телефоне включается адаптивный режим.')
        ]:[]),
        select('density','Плотность',[['comfortable','Комфортная'],['compact','Компактная']],'Меняет отступы форм и таблиц, не уменьшая размер текста.'),
        flag('animations','Анимации','Бегущая строка и переходы. Системное «уменьшение движения» всегда учитывается.'),
        ...(api.family==='atlas'?[flag('sidebar','Боковая панель','Модули управления и сведения об устройстве. На телефоне доступны через кнопку «Панель».'),flag('banner','Фирменная полоса','Угловой баннер ATLAS над рабочей областью.')]:[])
      ]),
      E('section',{'class':'cbi-section'},[E('h3',{},'Техническая бегущая строка'),
        flag('ticker','Показывать строку','Показатели разделены символом /. Обновляются раз в 10 секунд, пока вкладка видима. Наведение и кнопка паузы останавливают движение, но не обновление значений.'),
        E('div',{'class':'ax-settings-field'},[E('span',{},'Показатели'),metricList]),
        E('p',{'class':'ax-ticker-legend'},[E('span',{'class':'ax-metric-info'},'Синий — информация'),E('span',{'class':'ax-metric-ok'},'Зелёный — норма'),E('span',{'class':'ax-metric-error'},'Красный — внимание'),E('span',{'class':'ax-metric-unknown'},'Серый — нет данных')]),
        number('memoryLimit','Порог RAM, %',1,100,1,'Красный при достижении этого процента. Использование рассчитано через доступную память (MemAvailable); освобождаемый кэш не считается занятой приложениями памятью.'),
        number('storageLimit','Порог хранилища, %',1,100,1,'Красный при достижении этого процента занятого места. Проверяется файловая система root/overlay, не произвольная USB-флешка.'),
        number('loadLimit','Порог Load average',0,128,0.01,'0 — только информация синим. Это среднее число задач, а не процент загрузки CPU; порог выбирается с учётом количества ядер и характера нагрузки.'),
        E('p',{'class':'ax-settings-note'},'Зелёный WAN означает, что внешний интерфейс поднят, а не что интернет проверен. При отсутствии ответа значения становятся серыми. В режиме без анимаций строку можно прокручивать вручную.')
      ]),
      E('div',{'class':'ax-settings-actions'},[E('button',{'class':'cbi-button cbi-button-save',type:'button',click:save},'Сохранить оформление'),E('button',{'class':'cbi-button',type:'button',click:reset},'Вернуть стандартное')]),status
    ]);
  }
});
