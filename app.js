const $ = id => document.getElementById(id);
const lessons = [
  ['Переменные','Храни значение под именем. Объявляй через let, если планируешь присвоить новое значение. Для постоянной привязки используй const.','let points = 3;\npoints += 2; // теперь 5','Чему равно points после points *= 2?',['5','10','25'],1,'После сложения получилось 5. Умножаем на 2 и получаем 10.'],
  ['Типы и строки','Число и строка из цифр имеют разные типы. Если один из операндов плюса — строка, числа в таком выражении могут превратиться в текст.','const price = "12";\nNumber(price) + 3; // 15','Что вернёт "12" + 3?',['15','"123"','Ошибку'],1,'Строка и число соединяются в строку "123".'],
  ['Условия','Условие выбирает ветку программы. Оператор >= включает граничное значение, а > исключает его.','const age = 18;\nif (age >= 18) {\n  console.log("Вход открыт");\n}','Какое условие истинно при age = 18?',['age > 18','age < 18','age >= 18'],2,'Знак равенства включает возраст 18 в допустимый диапазон.'],
  ['Циклы','Цикл for повторяет действие. Сначала задаём счётчик, перед каждым шагом проверяем условие, после шага обновляем счётчик.','let sum = 0;\nfor (let i = 1; i <= 3; i++) {\n  sum += i;\n}','Чему равен sum после цикла из урока?',['3','6','9'],1,'Складываются три значения счётчика: 1 + 2 + 3 = 6.'],
  ['Функции','Функция получает аргументы через параметры. return завершает вызов и передаёт вычисленное значение обратно.','function double(n) {\n  return n * 2;\n}\ndouble(4); // 8','Что вернёт double(double(3))?',['6','9','12'],2,'Сначала double(3) возвращает 6, затем double(6) возвращает 12.'],
  ['Массивы','Массив объединяет значения по порядку. Индексы начинаются с нуля. Метод map создаёт новый массив, применяя функцию к каждому элементу.','const nums = [2, 4, 6];\nconst squares = nums.map(n => n * n);','Чему равен squares[1]?',['4','16','36'],1,'Элемент с индексом 1 — второе число. Его квадрат равен 16.']
];
function node(tag, content) {
  const element = document.createElement(tag);
  element.textContent = content;
  return element;
}
let completed = new Set();
try { completed = new Set(JSON.parse(localStorage.getItem('studio-lessons'))); } catch {}
function progress() {
  const count = lessons.filter((_, i) => completed.has(i)).length;
  $('progress').textContent = 'Пройдено уроков: ' + count + ' из ' + lessons.length;
  $('bar').value = count;
}
lessons.forEach(([title, explanation, example], i) => {
  const card = node('details','');
  const mark = node('button','');
  const label = () => mark.textContent = completed.has(i) ? '✓ Пройдено · снять отметку' : 'Отметить пройденным';
  label();
  mark.onclick = () => {
    if (completed.has(i)) completed.delete(i); else completed.add(i);
    try { localStorage.setItem('studio-lessons', JSON.stringify([...completed])); } catch {}
    label(); progress();
  };
  card.append(node('summary',title),node('p',explanation),node('pre',example),mark);
  $('topics').append(card);
});
progress();
function quiz() {
  let right = 0, answered = 0;
  $('quiz').replaceChildren();
  const score = () => $('score').textContent = 'Правильно: ' + right + ' · Отвечено: ' + answered + ' из 6';
  score();
  lessons.forEach(([title,,,question,options,key,why]) => {
    const card = node('article','');
    card.append(node('small',title),node('h3',question));
    const feedback = node('p','');
    feedback.className = 'feedback';
    feedback.setAttribute('aria-live','polite');
    options.forEach((option,i) => {
      const button = node('button',option);
      button.onclick = () => {
        answered++; if (i === key) right++;
        card.querySelectorAll('button').forEach(b => b.disabled = true);
        feedback.textContent = (i === key ? 'Верно! ' : 'Правильный ответ: ' + options[key] + '. ') + why;
        score();
      };
      card.append(button);
    });
    card.append(feedback); $('quiz').append(card);
  });
}
$('retry').onclick = quiz;
quiz();
const tasks = [
  ['Удвоение','Верни число x, умноженное на два.',[[3,6],[-2,-4],[0,0]]],
  ['Чётность','Верни true для чётного целого числа x и false для нечётного.',[[0,true],[3,false],[-4,true]]],
  ['Сумма массива','Верни сумму чисел массива x. Для пустого массива верни 0.',[[[1,2,3],6],[[],0],[[-2,5],3]]],
  ['Инициалы','x — массив слов. Собери первые буквы в одну строку в верхнем регистре.',[[['Анна','Миронова'],'АМ'],[[],''],[['иван'],'И']]]
];
const drafts = tasks.map(() => 'function solve(x) {\n  // Напиши решение здесь\n  return x;\n}');
tasks.forEach(([title], i) => $('task').add(new Option(title,i)));
let active = 0;
let cancel = () => {};
function selectTask() {
  cancel();
  drafts[active] = $('code').value || drafts[active];
  active = Number($('task').value);
  $('prompt').textContent = tasks[active][1];
  $('code').value = drafts[active];
  $('out').textContent = 'Здесь появится результат проверки.';
}
$('task').onchange = selectTask;
selectTask();
function checkCases(cases) {
  try {
    const lines = cases.map(([input, expected]) => {
      const given = JSON.stringify(input);
      const actual = solve(input);
      return (Object.is(actual,expected) ? '✓' : '✗') + ' Вход: ' + given + ' → ' + JSON.stringify(actual) + ' (ожидается ' + JSON.stringify(expected) + ')';
    });
    postMessage(lines.join('\n'));
  } catch (err) { postMessage('Ошибка: ' + err.message); }
}
$('run').onclick = () => {
  cancel();
  const source = $('code').value + '\n(' + checkCases.toString() + ')(' + JSON.stringify(tasks[active][2]) + ');';
  const url = URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  const worker = new Worker(url);
  $('out').textContent = 'Проверяем…';
  const finish = message => { cancel(); $('out').textContent = message; };
  const timer = setTimeout(() => finish('Время вышло. Проверь условие завершения цикла.'),2000);
  cancel = () => { worker.terminate(); clearTimeout(timer); URL.revokeObjectURL(url); cancel = () => {}; };
  worker.onmessage = e => finish(e.data);
  worker.onerror = e => finish('Ошибка в коде: ' + e.message);
};
const videos = [
  ['fcMcf_4PjfI','JavaScript с нуля','Курс с практикой','photo-1498050108023-c5249f4df085'],
  ['Bluxbh9CaQ0','Основы JavaScript','От переменных до работы с DOM','photo-1515879218367-8466d910aaa4']
];
videos.forEach(([id,title,description,photo]) => {
  const link = node('a','');
  link.className = 'film'; link.href = 'https://www.youtube.com/watch?v=' + id;
  link.target = '_blank'; link.rel = 'noopener noreferrer';
  const img = new Image(); img.alt = ''; img.loading = 'lazy';
  img.src = 'https://images.unsplash.com/' + photo + '?auto=format&fit=crop&w=720&q=80';
  img.onerror = () => img.remove();
  link.append(img,node('small','ВЛАДИЛЕН МИНИН'),node('h3',title),node('p',description),node('strong','Смотреть на YouTube ↗'));
  $('films').append(link);
});
