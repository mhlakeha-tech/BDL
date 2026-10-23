const CATS = [
  { id: 'all', label: 'الكل' },
  { id: 'life', label: 'طوارئ ونجدة' },
  { id: 'inst', label: 'مؤسسات وخدمات عمومية' },
  { id: 'min', label: 'وزارات' },
  { id: 'hosp', label: 'مستشفيات' },
  { id: 'adm', label: 'إدارات' },
  { id: 'prof', label: 'توثيق ومهن حرة' }
];

const grid = document.getElementById('grid');
const chipsEl = document.getElementById('chips');
const countLine = document.getElementById('countLine');
const emptyEl = document.getElementById('empty');
const q = document.getElementById('q');

let activeCat = 'all';

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

function digitsOf(s) { return String(s || '').replace(/\D+/g, ''); }

function telHref(v) {
  const d = digitsOf(v);
  if (!d) return null;
  if (d.length <= 4) return 'tel:' + d;
  let t = d;
  if (t.startsWith('0')) t = '213' + t.slice(1);
  return 'tel:+' + t;
}

function entryText(e) {
  const l = (e.p || []).map(x => (typeof x === 'string' ? x : (x.d || '') + ' ' + x.v)).join(' ');
  return norm([e.n, e.cl, e.note, e.site, l].join(' '));
}

const SEARCH_TEXT = (typeof DIRECTORY !== 'undefined' ? DIRECTORY : []).map(expression => entryText(expression));

function chipHtml(c, count, active) {
  return '<button class="chip' + (active ? ' active' : '') + '" data-cat="' + c.id + '">' +
    c.label + ' <span class="n">(' + count + ')</span></button>';
}

function renderChips() {
  const counts = CATS.map(c => {
    if (c.id === 'all') return DIRECTORY.length;
    return DIRECTORY.filter(e => e.cat === c.id).length;
  });
  chipsEl.innerHTML = CATS.map((c, i) => chipHtml(c, counts[i], c.id === activeCat)).join('');
}

function buildCard(e) {
  const card = document.createElement('article');
  card.className = 'card cat-' + (CATS.some(c => c.id === e.cat) ? e.cat : 'inst');

  const head = document.createElement('div');
  head.className = 'card-head';
  const h3 = document.createElement('h3');
  h3.textContent = e.n;
  head.appendChild(h3);
  if (e.cl) {
    const loc = document.createElement('span');
    loc.className = 'loc';
    loc.textContent = e.cl;
    head.appendChild(loc);
  }
  card.appendChild(head);

  if (e.note) {
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = e.note;
    card.appendChild(note);
  }

  const badges = [];
  if (e.old) badges.push('<span class="badge old">قد يكون قديما</span>');
  if (e.site) badges.push('<span class="badge site">الموقع: ' + e.site + '</span>');
  if (badges.length) {
    const b = document.createElement('div');
    b.className = 'badges';
    b.innerHTML = badges.join('');
    card.appendChild(b);
  }

  const nums = e.p || [];
  if (nums.length) {
    const ul = document.createElement('ul');
    ul.className = 'numbers';
    for (const item of nums) {
      const isObj = typeof item !== 'string';
      const v = isObj ? item.v : item;
      const d = isObj ? (item.d || '') : '';
      const href = telHref(v);
      const li = document.createElement('li');

      const digits = document.createElement('span');
      const short = digitsOf(v).length <= 4;
      digits.className = 'digits' + (short ? ' short' : '');
      digits.dir = 'ltr';
      digits.textContent = v;
      li.appendChild(digits);

      if (d) {
        const nl = document.createElement('span');
        nl.className = 'nlabel';
        nl.textContent = d;
        li.appendChild(nl);
      }

      const acts = document.createElement('span');
      acts.className = 'actions';
      if (href) {
        const a = document.createElement('a');
        a.className = 'iconbtn call';
        a.href = href;
        a.title = 'اتصل';
        a.setAttribute('aria-label', 'اتصل ' + v);
        a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.24 1.01l-2.2 2.2z"/></svg>';
        acts.appendChild(a);
      }
      const cb = document.createElement('button');
      cb.type = 'button';
      cb.className = 'iconbtn copy';
      cb.title = 'نسخ';
      cb.setAttribute('aria-label', 'نسخ ' + v);
      cb.dataset.num = v;
      cb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/></svg>';
      acts.appendChild(cb);
      li.appendChild(acts);
      ul.appendChild(li);
    }
    card.appendChild(ul);
  }
  return card;
}

function render() {
  const query = norm(q.value.trim());
  const qDigits = digitsOf(query);
  const frag = document.createDocumentFragment();
  let shown = 0;

  for (let i = 0; i < DIRECTORY.length; i++) {
    const e = DIRECTORY[i];
    if (activeCat !== 'all' && e.cat !== activeCat) continue;
    if (query) {
      let ok = SEARCH_TEXT[i].includes(query);
      if (!ok && qDigits && qDigits.length <= 4) {
        ok = (e.p || []).some(x => digitsOf(typeof x === 'string' ? x : x.v).includes(qDigits));
      }
      if (!ok) continue;
    }
    frag.appendChild(buildCard(e));
    shown++;
  }

  grid.innerHTML = '';
  grid.appendChild(frag);
  emptyEl.hidden = shown !== 0;
  const catLabel = CATS.find(c => c.id === activeCat).label;
  countLine.textContent = 'معروض ' + shown + ' من ' + DIRECTORY.length + ' — التصنيف: ' + catLabel + (query ? ' — بحث: ' + q.value.trim() : '');
}

chipsEl.addEventListener('click', ev => {
  const btn = ev.target.closest('.chip');
  if (!btn) return;
  activeCat = btn.dataset.cat;
  renderChips();
  render();
});

grid.addEventListener('click', ev => {
  const copyBtn = ev.target.closest('.copy');
  if (!copyBtn) return;
  const v = copyBtn.dataset.num;
  const done = () => {
    copyBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    copyBtn.classList.add('done');
    snackbar('تم نسخ: ' + v);
    setTimeout(() => {
      copyBtn.classList.remove('done');
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/></svg>';
    }, 1400);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(v).then(done, () => fallbackCopy(v, done));
  } else fallbackCopy(v, done);
});

function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (err) {}
  document.body.removeChild(ta);
  done();
}

let snackTimer = null;
function snackbar(msg) {
  let bar = document.querySelector('.snackbar');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'snackbar';
    bar.innerHTML = '<span></span>';
    document.body.appendChild(bar);
  }
  bar.querySelector('span').textContent = msg;
  bar.classList.add('show');
  clearTimeout(snackTimer);
  snackTimer = setTimeout(() => bar.classList.remove('show'), 1600);
}

q.addEventListener('input', render);
renderChips();
render();
