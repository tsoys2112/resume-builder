(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = CV.esc;
  const STORE = 'cvbuilder.v1';
  const ACCENTS = ['#1f4e8c', '#0f766e', '#7c3aed', '#be123c', '#c2410c', '#334155', '#0e7490', '#15803d'];

  const blank = () => ({
    photo: '', name: '', title: '', birth: '', location: '', about: '',
    phone: '', email: '', telegram: '', website: '', skills: '',
    experience: [{ role: '', company: '', start: '', end: '', current: false, desc: '' }],
    education: [{ school: '', degree: '', start: '', end: '' }],
    languages: [{ name: '', level: 'native' }],
    ai: null,
    settings: { template: 'modern', accent: ACCENTS[0], lang: 'ru', tone: 'деловой, уверенный', view: 'resume' }
  });

  let state = load() || blank();
  function load() {
    try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && s.settings) return Object.assign(blank(), s, { settings: Object.assign(blank().settings, s.settings) }); } catch (e) {}
    return null;
  }
  let saveT;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }, 300);
  }
  const pref = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };

  /* ---------------- toast ---------------- */
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------------- simple fields ---------------- */
  const form = $('#cvForm');
  function fillSimple() {
    $$('input[name], textarea[name]', form).forEach((el) => { if (!el.closest('.item')) el.value = state[el.name] || ''; });
    $('#cvLang').value = state.settings.lang;
    $('#cvTone').value = state.settings.tone;
    showPhoto();
  }
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.name && !el.closest('.item')) { state[el.name] = el.value; changed(); }
  });

  /* ---------------- repeatable lists ---------------- */
  const LEVELS = ['native', 'c2', 'c1', 'b2', 'b1', 'a2', 'a1'];
  const ITEM = {
    experience: (it) => `
      <div class="row2"><label>Должность<input data-f="role" value="${esc(it.role)}" placeholder="Менеджер по продажам"></label>
      <label>Компания<input data-f="company" value="${esc(it.company)}" placeholder="ООО «Компания»"></label></div>
      <div class="row2"><label>Начало<input type="month" data-f="start" value="${esc(it.start)}"></label>
      <label>Окончание<input type="month" data-f="end" value="${esc(it.end)}" ${it.current ? 'disabled' : ''}></label></div>
      <label style="flex-direction:row;align-items:center;gap:8px;font-weight:500"><input type="checkbox" data-f="current" style="width:auto" ${it.current ? 'checked' : ''}> По настоящее время</label>
      <label>Обязанности и достижения (по строке)<textarea data-f="desc" rows="3" placeholder="Что делали, какие результаты, цифры — ИИ оформит красиво">${esc(it.desc)}</textarea></label>`,
    education: (it) => `
      <label>Учебное заведение<input data-f="school" value="${esc(it.school)}" placeholder="Ташкентский государственный университет"></label>
      <label>Специальность / степень<input data-f="degree" value="${esc(it.degree)}" placeholder="Бакалавр, экономика"></label>
      <div class="row2"><label>Год начала<input data-f="start" inputmode="numeric" value="${esc(it.start)}" placeholder="2010"></label>
      <label>Год окончания<input data-f="end" inputmode="numeric" value="${esc(it.end)}" placeholder="2014"></label></div>`,
    languages: (it) => {
      const t = CV.LABELS.ru.levels;
      return `<div class="row-lang"><label>Язык<input data-f="name" value="${esc(it.name)}" placeholder="Английский"></label>
      <label>Уровень<select data-f="level">${LEVELS.map((l) => `<option value="${l}" ${it.level === l ? 'selected' : ''}>${t[l]}${l.length === 2 ? ' (' + l.toUpperCase() + ')' : ''}</option>`).join('')}</select></label>
      <button type="button" class="icon-btn" data-act="del" title="Удалить" style="width:30px;height:38px">×</button></div>`;
    }
  };
  function renderList(kind) {
    const box = $('#list-' + kind);
    const arr = state[kind];
    if (!arr.length) { box.innerHTML = '<div class="empty">Пока пусто</div>'; return; }
    box.innerHTML = arr.map((it, i) => `
      <div class="item ${kind === 'languages' ? 'compact' : ''}" data-kind="${kind}" data-i="${i}">
        ${kind !== 'languages' ? `<div class="item-tools">
          <button type="button" data-act="up" title="Выше" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-act="down" title="Ниже" ${i === arr.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-act="del" title="Удалить">×</button></div>` : ''}
        ${ITEM[kind](it)}
      </div>`).join('');
  }
  const NEW = {
    experience: () => ({ role: '', company: '', start: '', end: '', current: false, desc: '' }),
    education: () => ({ school: '', degree: '', start: '', end: '' }),
    languages: () => ({ name: '', level: 'b2' })
  };
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.add;
    state[k].push(NEW[k]());
    if (k === 'experience' && state.ai) state.ai.experience = null; // indexes shift — drop AI bullets
    renderList(k); changed();
    const items = $$('#list-' + k + ' .item'); items.at(-1)?.querySelector('input')?.focus();
  }));
  form.addEventListener('input', onItemEdit);
  form.addEventListener('change', onItemEdit);
  function onItemEdit(e) {
    const el = e.target, item = el.closest('.item');
    if (!item || !el.dataset.f) return;
    const obj = state[item.dataset.kind][+item.dataset.i];
    if (el.type === 'checkbox') {
      obj[el.dataset.f] = el.checked;
      const end = item.querySelector('[data-f="end"]'); if (end) end.disabled = el.checked;
    } else obj[el.dataset.f] = el.value;
    changed();
  }
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const item = b.closest('.item'), k = item.dataset.kind, i = +item.dataset.i, arr = state[k];
    if (b.dataset.act === 'del') arr.splice(i, 1);
    if (b.dataset.act === 'up' && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    if (b.dataset.act === 'down' && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
    if (k === 'experience' && state.ai && state.ai.experience) {
      const ex = state.ai.experience;
      if (b.dataset.act === 'del') ex.splice(i, 1);
      if (b.dataset.act === 'up' && i > 0) [ex[i - 1], ex[i]] = [ex[i], ex[i - 1]];
      if (b.dataset.act === 'down' && i < ex.length - 1) [ex[i + 1], ex[i]] = [ex[i], ex[i + 1]];
    }
    renderList(k); changed();
  });

  /* ---------------- photo ---------------- */
  $('#photoInput').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { state.photo = await resizeImage(f, 600); showPhoto(); changed(); }
    catch (err) { toast('Не удалось прочитать изображение'); }
    e.target.value = '';
  });
  $('#photoRemove').addEventListener('click', () => { state.photo = ''; showPhoto(); changed(); });
  function showPhoto() {
    const img = $('#photoPreview');
    img.hidden = !state.photo; if (state.photo) img.src = state.photo;
    $('#photoRemove').hidden = !state.photo;
  }
  function resizeImage(file, max) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onerror = rej;
      r.onload = () => {
        const img = new Image();
        img.onerror = rej;
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.86));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  /* ---------------- templates & colors ---------------- */
  function buildPickers() {
    $('#tplPicker').innerHTML = Object.entries(CV.TEMPLATES).map(([k, t]) =>
      `<button class="tpl-btn ${state.settings.template === k ? 'active' : ''}" data-tpl="${k}" title="${t.name}"><span class="mini"></span><span class="name">${t.name}</span></button>`).join('');
    const custom = !ACCENTS.includes(state.settings.accent);
    $('#swatches').innerHTML = ACCENTS.map((c) =>
      `<button class="sw ${state.settings.accent === c ? 'active' : ''}" data-c="${c}" style="background:${c}" title="${c}" aria-label="Цвет ${c}"></button>`).join('') +
      `<label class="sw-custom ${custom ? 'sw active' : ''}" title="Свой цвет"><input type="color" id="customColor" value="${state.settings.accent}"></label>`;
    document.documentElement.style.setProperty('--sw', state.settings.accent);
  }
  $('#tplPicker').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tpl]'); if (!b) return;
    state.settings.template = b.dataset.tpl; buildPickers(); changed();
  });
  $('#swatches').addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    state.settings.accent = b.dataset.c; buildPickers(); changed();
  });
  $('#swatches').addEventListener('input', (e) => {
    if (e.target.id === 'customColor') { state.settings.accent = e.target.value; document.documentElement.style.setProperty('--sw', e.target.value); changed(); }
  });
  $('#swatches').addEventListener('change', (e) => { if (e.target.id === 'customColor') buildPickers(); });
  $('#cvLang').addEventListener('change', (e) => { state.settings.lang = e.target.value; changed(); });
  $('#cvTone').addEventListener('change', (e) => { state.settings.tone = e.target.value; save(); });

  /* ---------------- views (desktop seg + mobile tabs) ---------------- */
  function setView(v) {
    state.settings.view = v;
    $$('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
    $('#paperWrap').hidden = v !== 'resume';
    $('#siteWrap').hidden = v !== 'site';
    $('#pdfBtn').hidden = $('#printBtn').hidden = v !== 'resume';
    $('#siteBtn').hidden = v !== 'site';
    render(); save();
  }
  $('#viewSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });
  $$('.mtab').forEach((b) => b.addEventListener('click', () => {
    const p = b.dataset.pane;
    $$('.mtab').forEach((x) => x.classList.toggle('active', x === b));
    $('#pane-form').classList.toggle('active', p === 'form');
    $('#pane-preview').classList.toggle('active', p !== 'form');
    if (p !== 'form') setView(p);
    window.scrollTo(0, 0);
  }));
  $$('.dev').forEach((b) => b.addEventListener('click', () => {
    $$('.dev').forEach((x) => x.classList.toggle('active', x === b));
    $('#siteFrame').style.width = b.dataset.w;
  }));

  /* ---------------- render ---------------- */
  let renderT;
  function changed() { save(); clearTimeout(renderT); renderT = setTimeout(render, 120); }
  let lastSite = '';
  function render() {
    const cv = $('#cv');
    cv.className = 'cv t-' + state.settings.template;
    cv.style.setProperty('--accent', state.settings.accent);
    cv.innerHTML = CV.renderResume(state);
    fitPaper();
    if (state.settings.view === 'site') {
      const html = CV.renderSite(state);
      if (html !== lastSite) {
        const fr = $('#siteFrame');
        const y = fr.contentWindow ? fr.contentWindow.scrollY : 0;
        fr.onload = () => { try { fr.contentWindow.scrollTo(0, y); } catch (e) {} };
        fr.srcdoc = html; lastSite = html;
      }
    }
  }
  function fitPaper() {
    const stage = $('#stage'), wrap = $('#paperWrap'), sc = $('#paperScale'), cv = $('#cv');
    if (wrap.hidden || !stage.clientWidth) return;
    const pad = parseFloat(getComputedStyle(stage).paddingLeft) * 2;
    const k = Math.min(1, (stage.clientWidth - pad) / 794);
    sc.style.transform = `scale(${k})`;
    wrap.style.width = 794 * k + 'px';
    wrap.style.height = cv.offsetHeight * k + 'px';
  }
  window.addEventListener('resize', fitPaper);
  if (window.ResizeObserver) new ResizeObserver(fitPaper).observe($('#stage'));

  /* ---------------- AI ---------------- */
  function aiPayload() {
    const { photo, ai, settings, ...rest } = state;
    return Object.assign({}, rest, { lang: settings.lang, tone: settings.tone });
  }
  function setStatus(msg, kind) {
    const s = $('#aiStatus'); s.hidden = !msg; s.className = 'ai-status ' + (kind || ''); s.innerHTML = msg || '';
  }
  async function callServer(data) {
    const r = await fetch('api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) { const err = new Error('no-server'); err.noServer = true; throw err; }
    const j = await r.json();
    if (!r.ok) { const err = new Error(j.error || 'Ошибка сервера'); if (j.code === 'NO_KEY') err.noServer = true; throw err; }
    return j.result;
  }
  async function callDirect(data, key) {
    const model = (pref('cv.model') || CVPrompt.DEFAULT_MODEL).trim();
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(CVPrompt.build(data))
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error?.message || 'Gemini HTTP ' + r.status);
    return CVPrompt.parse(j);
  }
  $('#aiBtn').addEventListener('click', async () => {
    const data = aiPayload();
    if (!data.name && !data.title && !data.experience.some((j) => j.role || j.company)) {
      setStatus('Сначала заполните хотя бы имя, должность и опыт работы.', 'err'); return;
    }
    const btn = $('#aiBtn');
    btn.disabled = true; btn.classList.add('loading'); btn.querySelector('.lbl').textContent = 'Gemini пишет резюме…';
    setStatus('Анализирую опыт, выделяю сильные стороны… обычно 5–15 секунд.');
    try {
      let result;
      const key = pref('cv.key');
      try { result = await callServer(data); }
      catch (e) {
        if (!(e.noServer || e instanceof TypeError)) throw e;
        if (!key) { setStatus('Сервер с ключом Gemini не найден. Разверните проект на Vercel с переменной <b>GEMINI_API_KEY</b> или укажите ключ в настройках ⚙ для локальной работы.', 'err'); openSettings(); return; }
        result = await callDirect(data, key);
      }
      // keep only jobs that exist, aligned by index
      state.ai = normalizeAI(result);
      fillAIEdit(); render(); save();
      setStatus('Готово! Текст можно поправить в блоке «Текст от ИИ» внизу анкеты.', 'ok');
      toast('Резюме сгенерировано ✦');
      if (matchMedia('(max-width: 900px)').matches) $('.mtab[data-pane="resume"]').click();
    } catch (e) {
      setStatus('Ошибка: ' + esc(e.message), 'err');
    } finally {
      btn.disabled = false; btn.classList.remove('loading'); btn.querySelector('.lbl').textContent = 'Сгенерировать резюме с ИИ';
    }
  });
  function normalizeAI(r) {
    r = r || {};
    const filled = state.experience.map((j, i) => ({ j, i }));
    const exp = filled.map((_, i) => ({ achievements: ((r.experience || [])[i] || {}).achievements || [] }));
    return {
      headline: String(r.headline || ''), summary: String(r.summary || ''),
      strengths: (r.strengths || []).map((x) => ({ title: String(x.title || ''), text: String(x.text || '') })).filter((x) => x.title),
      experience: exp,
      skillGroups: (r.skillGroups || []).map((g) => ({ group: String(g.group || ''), items: (g.items || []).map(String) })),
      portfolioIntro: String(r.portfolioIntro || '')
    };
  }
  function fillAIEdit() {
    const has = !!state.ai;
    $('#aiEditCard').hidden = !has;
    if (!has) return;
    $('#aiHeadline').value = state.ai.headline;
    $('#aiSummary').value = state.ai.summary;
    $('#aiStrengths').value = state.ai.strengths.map((s) => s.title + (s.text ? ' — ' + s.text : '')).join('\n');
  }
  $('#aiHeadline').addEventListener('input', (e) => { state.ai.headline = e.target.value; changed(); });
  $('#aiSummary').addEventListener('input', (e) => { state.ai.summary = e.target.value; changed(); });
  $('#aiStrengths').addEventListener('input', (e) => {
    state.ai.strengths = e.target.value.split('\n').map((l) => { const [t, ...rest] = l.split(/\s+[—–-]\s+/); return { title: t.trim(), text: rest.join(' — ').trim() }; }).filter((x) => x.title);
    changed();
  });
  $('#aiClear').addEventListener('click', () => { state.ai = null; fillAIEdit(); setStatus(''); changed(); });

  /* ---------------- settings ---------------- */
  function openSettings() {
    $('#keyInput').value = pref('cv.key') || '';
    $('#modelInput').value = pref('cv.model') || '';
    $('#settingsDlg').showModal();
  }
  $('#settingsBtn').addEventListener('click', openSettings);
  $('#settingsDlg').addEventListener('close', () => {
    if ($('#settingsDlg').returnValue !== 'ok') return;
    pref('cv.key', $('#keyInput').value.trim());
    pref('cv.model', $('#modelInput').value.trim());
    toast('Настройки сохранены');
  });

  /* ---------------- theme ---------------- */
  function applyTheme(t) { document.documentElement.dataset.theme = t; }
  applyTheme(pref('cv.theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('#themeToggle').addEventListener('click', () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(t); pref('cv.theme', t);
  });

  /* ---------------- export ---------------- */
  const fileBase = () => (state.name || 'resume').trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '') || 'resume';
  $('#pdfBtn').addEventListener('click', async () => {
    if (!window.html2pdf) { toast('PDF‑модуль ещё загружается — используйте «Печать»'); return; }
    const btn = $('#pdfBtn'); btn.disabled = true; const old = btn.textContent; btn.textContent = 'Готовлю PDF…';
    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff';
    const clone = $('#cv').cloneNode(true);
    holder.appendChild(clone); document.body.appendChild(holder);
    try {
      await document.fonts?.ready;
      await html2pdf().set({
        margin: 0,
        filename: fileBase() + '_CV.pdf',
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 794 },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait', hotfixes: ['px_scaling'] },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.job', '.edu', '.st', '.lang'] }
      }).from(clone).save();
      toast('PDF скачан');
    } catch (e) { toast('Ошибка PDF: ' + e.message); }
    finally { holder.remove(); btn.disabled = false; btn.textContent = old; }
  });
  $('#printBtn').addEventListener('click', () => { setView('resume'); setTimeout(() => window.print(), 50); });
  $('#siteBtn').addEventListener('click', () => {
    const blob = new Blob([CV.renderSite(state)], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fileBase() + '_portfolio.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Сайт скачан — его можно залить на любой хостинг');
  });

  /* ---------------- sample / reset ---------------- */
  $('#sampleBtn').addEventListener('click', () => {
    const keep = state.settings;
    state = Object.assign(blank(), SAMPLE(), { settings: keep });
    initAll(); toast('Пример загружен — нажмите «Сгенерировать»');
  });
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Очистить все поля анкеты?')) return;
    const keep = state.settings; state = blank(); state.settings = keep; initAll(); setStatus('');
  });
  function SAMPLE() {
    return {
      name: 'Алексей Ким', title: 'Руководитель отдела продаж (FMCG)', birth: '1985-04-12', location: 'Ташкент, Узбекистан',
      about: 'Более 15 лет в продажах и дистрибуции FMCG. Строил отделы продаж с нуля, запускал новые бренды, работал с сетями и дистрибьюторами по всему Узбекистану.',
      phone: '+998 90 123 45 67', email: 'alexey.kim@mail.com', telegram: '@alexeykim', website: 'linkedin.com/in/alexeykim',
      skills: 'B2B‑продажи, управление дистрибуцией, переговоры, построение команды, KPI, бюджетирование, 1С, Excel, CRM, трейд‑маркетинг',
      experience: [
        { role: 'Руководитель отдела продаж', company: 'Aerosol East', start: '2019-03', end: '', current: true, desc: 'Руковожу командой из 25 человек\nВывел продукцию в 3 федеральные сети\nРост продаж +40% за 2 года\nВнедрил CRM и систему KPI' },
        { role: 'Коммерческий директор', company: 'Пивоваренная компания', start: '2012-01', end: '2019-02', current: false, desc: 'Отвечал за продажи и маркетинг по стране\nПерестроил дистрибьюторскую сеть\nЗапуск 5 новых брендов' },
        { role: 'Территориальный менеджер', company: 'Международная FMCG‑компания', start: '2005-06', end: '2011-12', current: false, desc: 'Работа с ключевыми клиентами региона\nРазвитие дистрибьюторов' }
      ],
      education: [{ school: 'Ташкентский государственный экономический университет', degree: 'Магистр, маркетинг', start: '2001', end: '2005' }],
      languages: [{ name: 'Русский', level: 'native' }, { name: 'Узбекский', level: 'c1' }, { name: 'Английский', level: 'b2' }]
    };
  }

  function initAll() {
    fillSimple();
    ['experience', 'education', 'languages'].forEach(renderList);
    buildPickers(); fillAIEdit(); setView(state.settings.view || 'resume'); save();
  }
  initAll();
  document.fonts && document.fonts.ready.then(fitPaper);
})();
