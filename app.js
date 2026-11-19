const $ = id => document.getElementById(id);
const colors = ['#dafa87','#c6b1fc','#ffb99e','#a8ded4','#f4d184','#c7c8ff'];
let data = {};
try { data = JSON.parse(localStorage.getItem('kod-studio-v2')) || {}; } catch {}
let index = 0, cleanup = () => {};
function state(i) {
  return data[i] ||= {stage:0, watched:0};
}
function save() {
  try { localStorage.setItem('kod-studio-v2', JSON.stringify(data)); } catch {}
}
function el(tag, text, cls) {
  const n = document.createElement(tag);
  n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function button(text, fn) {
  const b = el('button',text);
  b.onclick = fn;
  return b;
}
function catalog() {
  $('cards').replaceChildren(); $('awards').replaceChildren();
  $('count').textContent = courses.filter((_,i) => state(i).stage === 3).length + ' / 6';
  courses.forEach(([category,title,symbol,desc],i) => {
    const s = state(i), card = el('article','','card');
    card.style.setProperty('--t',colors[i]);
    const tile = el('div','','tile');
    tile.setAttribute('aria-hidden','true'); tile.append(el('b',symbol));
    card.append(tile,el('small',category.toUpperCase(),'tag'),el('h3',title),el('p',desc),
      button(s.stage === 3 ? 'Открыть сертификат ↗' : s.stage || s.watched ? 'Продолжить →' : 'Начать маршрут →',() => openRoute(i)));
    $('cards').append(card);
    const award = el('div','','award');
    award.append(el('strong',title), s.stage === 3 ? button('Получить ↓',() => openRoute(i)) : el('small','Пройдено ' + s.stage + '/3'));
    $('awards').append(award);
  });
}
function openRoute(i) {
  index = i; $('room').showModal(); render();
}
$('close').onclick = () => $('room').close();
$('room').onclose = () => { cleanup(); catalog(); };
function advance() {
  state(index).stage++; save(); catalog(); render();
}
function render() {
  cleanup(); cleanup = () => {};
  const c = courses[index], s = state(index), host = $('content');
  $('route').textContent = 'МАРШРУТ ' + String(index+1).padStart(2,'0') + ' / 06';
  $('title').textContent = c[1]; host.replaceChildren(); $('steps').replaceChildren();
  ['Видео','Тест','Практика','Сертификат'].forEach((name,i) => {
    $('steps').append(el('span',(i<s.stage?'✓ ':i+1+'. ')+name,'step'+(i===s.stage?' current':'')));
  });
  if (s.stage === 0) showVideo(host,c,s);
  else if (s.stage === 1) showQuiz(host,c);
  else if (s.stage === 2) showPractice(host,c);
  else showAward(host,c,s);
  $('room').scrollTop = 0;
}
function showVideo(host,c,s) {
  const v = document.createElement('video');
  v.controls = true; v.playsInline = true; v.preload = 'auto';
  v.src = 'media/lesson-'+(index+1)+'.mp4';
  const status = el('p','Загрузка видео…');
  const next = button('Перейти к тесту →',advance); next.disabled = true;
  const transcript = el('details',''); transcript.append(el('summary','Конспект урока'));
  c[4].forEach(([title,code,desc]) => transcript.append(el('h3',title),el('pre',code),el('p',desc)));
  let frontier = s.watched || 0;
  function track() {
    if (!Number.isFinite(v.duration)) return;
    for(let i=0;i<v.played.length;i++) {
      if(v.played.start(i)<=frontier+0.12) frontier=Math.max(frontier,v.played.end(i));
    }
    if (!v.seeking && v.currentTime>frontier+.5) v.currentTime=frontier;
    s.watched=frontier; save();
    const complete = frontier>=v.duration-.13;
    next.disabled=!complete;
    status.textContent = complete ? 'Видео пройдено. Тест открыт.' : 'Просмотрено '+ Math.floor(frontier)+' из '+Math.round(v.duration)+' сек.';
  }
  v.onloadedmetadata=()=>{frontier=Math.min(frontier,v.duration); v.currentTime=frontier; track();};
  v.onseeking=()=>{if(v.currentTime>frontier+.12)v.currentTime=frontier;};
  v.ontimeupdate=v.onended=track;
  v.onerror=()=>{status.textContent='Не удалось открыть видео. Распакуй архив целиком, включая папку media.';};
  cleanup=()=>{v.ontimeupdate=v.onended=v.onseeking=v.onloadedmetadata=null;v.pause();};
  host.append(el('p','Посмотри видеоразбор с русскими пояснениями на экране. Тест откроется после просмотра.'),v,status,transcript,next);
}
function showQuiz(host,c) {
  host.append(el('p','Ответь правильно на оба вопроса, чтобы открыть практику.'));
  const fields=c[5].map(([question,answers],i)=>{
    const field=el('fieldset','');field.append(el('legend',question));
    answers.forEach((answer,j)=>{
      const label=el('label',''), radio=document.createElement('input');
      radio.type='radio';radio.name='question'+i;radio.value=j;
      label.append(radio,document.createTextNode(' '+answer));field.append(label);
    });
    host.append(field);return field;
  });
  const msg=el('p','','feedback');msg.setAttribute('role','status');
  host.append(button('Проверить ответы',()=>{
    const wrong=fields.flatMap((f,i)=>f.querySelector(':checked')?.value===String(c[5][i][2])?[]:[i+1]);
    if(!wrong.length)advance();else msg.textContent='Попробуй ещё раз. Проверь вопросы: '+wrong.join(', ')+'.';
  }),msg);
}
function showPractice(host,c) {
  const label=el('label','Редактор JavaScript');label.htmlFor='editor';
  const code=document.createElement('textarea');code.id='editor';code.spellcheck=false;
  code.value=state(index).draft ?? 'function solve(x) {\n  return x;\n}';
  code.oninput=()=>{state(index).draft=code.value;save();};
  const msg=el('pre','Здесь появятся результаты проверки.');msg.setAttribute('role','status');
  const next=button('Получить сертификат →',()=>{state(index).date=new Date().toLocaleDateString('ru-RU');advance();});
  next.hidden=true;
  code.addEventListener('input',()=>next.hidden=true);
  const run=button('▷ Проверить решение',()=>{
    const source=code.value+'\n;self.onmessage = ({data}) => { try { postMessage({value:solve(data)}); } catch(e) {postMessage({error:e.message});} };';
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
    const w=new Worker(url);run.disabled=true;code.readOnly=true;next.hidden=true;
    let test=0,passed=true;msg.textContent='';
    const timer=setTimeout(()=>{msg.textContent+='Проверка остановлена. Проверь условие цикла.';stop();},2500);
    function stop(){clearTimeout(timer);w.terminate();URL.revokeObjectURL(url);run.disabled=false;code.readOnly=false;cleanup=()=>{};}
    cleanup=stop;
    w.onerror=e=>{msg.textContent='Ошибка: '+e.message;stop();};
    w.onmessage=e=>{
      const [input,expected]=c[7][test];
      let actual;
      try {actual=JSON.stringify(e.data?.value);} catch {actual='неподдерживаемый результат';}
      const ok=actual===JSON.stringify(expected);
      passed=passed&&ok;
      msg.textContent+=(ok?'✓ ':'✗ ')+JSON.stringify(input)+' → '+(e.data?.error||actual)+' · ожидается '+JSON.stringify(expected)+'\n';
      if(++test<c[7].length)w.postMessage(c[7][test][0]);else{stop();next.hidden=!passed;}
    };
    w.postMessage(c[7][0][0]);
  });
  host.append(el('p',c[6]),label,code,run,msg,next);
}
function showAward(host,c,s) {
  const label=el('label','Имя и фамилия для сертификата');label.htmlFor='recipient';
  const name=document.createElement('input');name.type='text';name.id='recipient';name.maxLength=65;name.value=data.name||'';
  const msg=el('p','');msg.setAttribute('role','status');
  host.append(el('p','Маршрут завершён. Все три этапа пройдены!'),label,name,button('Скачать сертификат PNG ↓',()=>{
    if(!name.value.trim()){msg.textContent='Сначала введи имя.';name.focus();return;}
    data.name=name.value.trim();save();
    const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#211c30';ctx.fillRect(0,0,1600,1000);
    ctx.fillStyle=colors[index];ctx.fillRect(0,0,28,1000);
    ctx.strokeStyle='#746689';ctx.lineWidth=3;ctx.strokeRect(64,60,1472,880);
    function line(text,y,size,color,bold=false){
      ctx.fillStyle=color;ctx.font=(bold?'bold ':'')+size+'px Arial';ctx.fillText(text,120,y,1360);
    }
    line('КОД / СТУДИЯ                                      JAVASCRIPT  /  0'+(index+1),158,34,colors[index],true);
    line('Сертификат',330,128,'#ffffff',true);
    line('об успешном прохождении учебного маршрута',410,43,'#e8e1f3');
    line(data.name,550,77,colors[index],true);line('Маршрут «'+c[1]+'»',665,58,'#fff',true);
    line('Видеоразбор  /  тестирование  /  практическая работа',750,33,'#e8e1f3');
    line('Автор: Русинов Давид, 11А Класс     •     '+s.date,870,30,'#e8e1f3');
    canvas.toBlob(blob=>{
      if(!blob){msg.textContent='Не удалось создать изображение.';return;}
      const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download='JS-сертификат-'+c[1]+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);msg.textContent='Файл сертификата готов.';
    },'image/png');
  }),msg);
}
catalog();
