/* Resume templates + portfolio site generator */
(function () {
  const L = {
    ru: {
      profile: 'Профиль', strengths: 'Сильные стороны', experience: 'Опыт работы', education: 'Образование',
      skills: 'Навыки', languages: 'Языки', contacts: 'Контакты', present: 'н.в.', born: 'Дата рождения',
      about: 'Обо мне', contactMe: 'Связаться', writeMe: 'Написать', footer: 'Сайт‑портфолио',
      years: (n) => n + ' ' + plural(n, 'год', 'года', 'лет'),
      months: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
      levels: { native: 'Родной', c2: 'Свободный', c1: 'Продвинутый', b2: 'Выше среднего', b1: 'Средний', a2: 'Базовый', a1: 'Начальный' },
      namePh: 'Ваше имя', titlePh: 'Должность', emptyExp: 'Добавьте опыт работы в анкете',
      ctaText: 'Открыт к новым проектам и предложениям. Свяжитесь со мной удобным способом.'
    },
    en: {
      profile: 'Profile', strengths: 'Key strengths', experience: 'Experience', education: 'Education',
      skills: 'Skills', languages: 'Languages', contacts: 'Contact', present: 'Present', born: 'Date of birth',
      about: 'About', contactMe: 'Contact', writeMe: 'Get in touch', footer: 'Portfolio',
      years: (n) => n + ' y.o.',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      levels: { native: 'Native', c2: 'Proficient', c1: 'Advanced', b2: 'Upper‑intermediate', b1: 'Intermediate', a2: 'Elementary', a1: 'Beginner' },
      namePh: 'Your name', titlePh: 'Job title', emptyExp: 'Add your work experience in the form',
      ctaText: 'Open to new projects and opportunities. Reach out any way you like.'
    },
    uz: {
      profile: 'Profil', strengths: 'Kuchli tomonlar', experience: 'Ish tajribasi', education: 'Taʼlim',
      skills: 'Koʻnikmalar', languages: 'Tillar', contacts: 'Kontaktlar', present: 'h.v.', born: 'Tugʻilgan sana',
      about: 'Men haqimda', contactMe: 'Bogʻlanish', writeMe: 'Yozish', footer: 'Portfolio sayti',
      years: (n) => n + ' yosh',
      months: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
      levels: { native: 'Ona tili', c2: 'Erkin', c1: 'Yuqori', b2: 'Oʻrtadan yuqori', b1: 'Oʻrta', a2: 'Boshlangʻich', a1: 'Dastlabki' },
      namePh: 'Ismingiz', titlePh: 'Lavozim', emptyExp: 'Anketada ish tajribasini qoʻshing',
      ctaText: 'Yangi loyihalar va takliflarga ochiqman. Qulay usulda bogʻlaning.'
    }
  };
  const LEVEL_SCORE = { native: 5, c2: 5, c1: 4, b2: 3, b1: 3, a2: 2, a1: 1 };

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function fmtMonth(v, t) {
    if (!v) return '';
    const m = /^(\d{4})-(\d{2})/.exec(v);
    return m ? t.months[+m[2] - 1] + ' ' + m[1] : v;
  }
  function period(a, b, cur, t) {
    const s = fmtMonth(a, t), e = cur ? t.present : fmtMonth(b, t);
    return [s, e].filter(Boolean).join(' — ');
  }
  function fmtBirth(v, t) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    if (!m) return v || '';
    const d = new Date(+m[1], +m[2] - 1, +m[3]), now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
    return `${m[3]}.${m[2]}.${m[1]}` + (age > 0 && age < 120 ? ` (${t.years(age)})` : '');
  }

  const ICONS = {
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16s1.5-1 4-1 4 2 6 2 4-1 4-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/>'
  };
  const icon = (n, size = 13) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

  function linkFor(kind, v) {
    v = String(v).trim();
    if (kind === 'phone') return 'tel:' + v.replace(/[^\d+]/g, '');
    if (kind === 'mail') return 'mailto:' + v;
    if (kind === 'send') return 'https://t.me/' + v.replace(/^@|^https?:\/\/t\.me\//, '');
    if (kind === 'globe') return /^https?:/.test(v) ? v : 'https://' + v;
    return '';
  }

  /* Build a normalized view model from app state */
  function model(s) {
    const t = L[s.settings.lang] || L.ru;
    const ai = s.ai || {};
    const contacts = [];
    if (s.phone) contacts.push({ ic: 'phone', v: s.phone });
    if (s.email) contacts.push({ ic: 'mail', v: s.email });
    if (s.telegram) contacts.push({ ic: 'send', v: s.telegram });
    if (s.website) contacts.push({ ic: 'globe', v: s.website });
    contacts.forEach((c) => (c.href = linkFor(c.ic, c.v)));
    const extra = [];
    if (s.location) extra.push({ ic: 'pin', v: s.location });
    if (s.birth) extra.push({ ic: 'cake', v: fmtBirth(s.birth, t) });

    const jobs = (s.experience || []).filter((j) => j.role || j.company).map((j, i) => {
      const aiJob = (ai.experience || [])[i];
      let bullets = aiJob && aiJob.achievements && aiJob.achievements.length ? aiJob.achievements
        : String(j.desc || '').split(/\n+/).map((x) => x.replace(/^[\s•\-–*]+/, '').trim()).filter(Boolean);
      return { role: j.role, company: j.company, period: period(j.start, j.end, j.current, t), bullets };
    });
    const edu = (s.education || []).filter((e) => e.school || e.degree).map((e) => ({
      degree: e.degree, school: e.school, period: [e.start, e.end].filter(Boolean).join(' — ')
    }));
    const flatSkills = String(s.skills || '').split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
    const skillGroups = (ai.skillGroups || []).filter((g) => g.items && g.items.length);
    const langs = (s.languages || []).filter((l) => l.name).map((l) => ({
      name: l.name, level: t.levels[l.level] || l.level || '', score: LEVEL_SCORE[l.level] || 3
    }));
    const nameParts = String(s.name || '').trim().split(/\s+/);
    return {
      t, photo: s.photo, name: s.name || t.namePh, nameParts, initials: (nameParts[0]?.[0] || '') + (nameParts[1]?.[0] || ''),
      title: s.title || t.titlePh, headline: ai.headline || '', summary: ai.summary || s.about || '',
      strengths: (ai.strengths || []).filter((x) => x.title), contacts, extra, jobs, edu,
      skills: flatSkills, skillGroups, langs, portfolioIntro: ai.portfolioIntro || ''
    };
  }

  /* ---------- shared blocks ---------- */
  const photo = (m) => m.photo ? `<img class="photo" src="${m.photo}" alt="">` : `<div class="photo-ph">${esc(m.initials.toUpperCase() || 'CV')}</div>`;
  const sec = (title, body, cls = '') => body ? `<section class="sec ${cls}"><h2 class="sec-t">${esc(title)}</h2>${body}</section>` : '';
  const summaryB = (m) => m.summary ? `<p class="summary">${esc(m.summary).replace(/\n/g, '<br>')}</p>` : '';
  const strengthsB = (m) => m.strengths.length ? `<div class="strengths">${m.strengths.map((x) => `<div class="st"><b>${esc(x.title)}</b>${x.text ? `<p>${esc(x.text)}</p>` : ''}</div>`).join('')}</div>` : '';
  const jobsB = (m) => m.jobs.length ? m.jobs.map((j) => `
    <div class="job">
      <div class="job-head"><div class="job-role">${esc(j.role)}</div><div class="job-date">${esc(j.period)}</div></div>
      ${j.company ? `<div class="job-co">${esc(j.company)}</div>` : ''}
      ${j.bullets.length ? `<ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
    </div>`).join('') : `<p class="empty-hint">${esc(m.t.emptyExp)}</p>`;
  const eduB = (m) => m.edu.map((e) => `<div class="edu"><div class="edu-deg">${esc(e.degree)}</div><div class="edu-sch">${esc(e.school)}${e.period ? ' · ' + esc(e.period) : ''}</div></div>`).join('');
  const skillsB = (m) => {
    if (m.skillGroups.length) return m.skillGroups.map((g) => `<div class="sk-group"><b>${esc(g.group)}</b><div class="chips">${g.items.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div></div>`).join('');
    return m.skills.length ? `<div class="chips">${m.skills.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div>` : '';
  };
  const langsB = (m) => m.langs.map((l) => `<div class="lang"><div><b>${esc(l.name)}</b> <span class="lvl">${esc(l.level)}</span></div><div class="dots">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= l.score ? 'on' : ''}"></i>`).join('')}</div></div>`).join('');
  const contactsB = (m, withExtra = true) => {
    const all = withExtra ? [...m.extra, ...m.contacts] : m.contacts;
    return all.length ? `<ul class="contacts">${all.map((c) => `<li><span class="ic">${icon(c.ic)}</span><span>${esc(c.v)}</span></li>`).join('')}</ul>` : '';
  };
  const metaInline = (m) => [...m.extra, ...m.contacts].map((c) => `<span><b>${icon(c.ic, 11)}</b>${esc(c.v)}</span>`).join('');

  /* ---------- templates ---------- */
  const TEMPLATES = {
    classic: { name: 'Классика', render(m) {
      return `
      <div class="head">${photo(m)}<div>
        <h1>${esc(m.name)}</h1><div class="role">${esc(m.title)}</div>
        ${m.headline ? `<div class="headline">${esc(m.headline)}</div>` : ''}
        <div class="meta">${metaInline(m)}</div></div></div>
      <div class="cols"><div>
        ${sec(m.t.profile, summaryB(m))}
        ${sec(m.t.strengths, strengthsB(m))}
        ${sec(m.t.experience, jobsB(m))}
      </div><div>
        ${sec(m.t.skills, skillsB(m))}
        ${sec(m.t.education, eduB(m))}
        ${sec(m.t.languages, langsB(m))}
      </div></div>`;
    } },
    modern: { name: 'Модерн', render(m) {
      return `
      <aside class="side">${photo(m)}
        ${sec(m.t.contacts, contactsB(m))}
        ${sec(m.t.skills, skillsB(m))}
        ${sec(m.t.languages, langsB(m))}
        ${sec(m.t.education, eduB(m))}
      </aside>
      <div class="main">
        <h1>${esc(m.name)}</h1><div class="role">${esc(m.title)}</div>
        ${m.headline ? `<div class="headline">${esc(m.headline)}</div>` : '<div class="headline"></div>'}
        ${sec(m.t.profile, summaryB(m))}
        ${sec(m.t.strengths, strengthsB(m))}
        ${sec(m.t.experience, jobsB(m))}
      </div>`;
    } },
    minimal: { name: 'Минимал', render(m) {
      const first = m.nameParts.length > 1 ? esc(m.nameParts.slice(0, -1).join(' ')) + ' <b>' + esc(m.nameParts.at(-1)) + '</b>' : '<b>' + esc(m.name) + '</b>';
      const row = (title, body) => body ? `<div class="row"><h2 class="sec-t">${esc(title)}</h2><div>${body}</div></div>` : '';
      const langs = m.langs.length ? `<div class="langs-inline">${m.langs.map((l) => `<span><b>${esc(l.name)}</b> — ${esc(l.level)}</span>`).join('')}</div>` : '';
      return `
      <div class="head"><div>
        <h1>${s.name ? first : esc(m.name)}</h1><div class="role">${esc(m.title)}</div>
        <div class="meta">${metaInline(m)}</div></div>${m.photo ? photo(m) : ''}</div>
      <div class="rule"></div>
      ${row(m.t.profile, (m.headline ? `<p><b>${esc(m.headline)}</b></p>` : '') + summaryB(m))}
      ${row(m.t.strengths, strengthsB(m))}
      ${row(m.t.experience, jobsB(m))}
      ${row(m.t.education, eduB(m))}
      ${row(m.t.skills, skillsB(m))}
      ${row(m.t.languages, langs)}`;
    } },
    creative: { name: 'Креатив', render(m) {
      return `
      <div class="band"><h1>${esc(m.name)}</h1><div class="role">${esc(m.title)}</div>
        ${m.headline ? `<div class="headline">${esc(m.headline)}</div>` : ''}${photo(m)}</div>
      <div class="meta-bar">${metaInline(m)}</div>
      <div class="body"><div>
        ${sec(m.t.profile, summaryB(m))}
        ${sec(m.t.strengths, strengthsB(m))}
        ${sec(m.t.experience, jobsB(m))}
      </div><div>
        ${sec(m.t.skills, skillsB(m))}
        ${sec(m.t.languages, langsB(m))}
        ${sec(m.t.education, eduB(m))}
      </div></div>`;
    } }
  };
  let s; // current state for minimal template's name check

  function renderResume(state) {
    s = state;
    const m = model(state);
    const tpl = TEMPLATES[state.settings.template] || TEMPLATES.classic;
    return tpl.render(m);
  }

  /* ---------- Portfolio mini-site (standalone HTML) ---------- */
  function renderSite(state) {
    const m = model(state);
    const accent = state.settings.accent;
    const t = m.t;
    const lang = state.settings.lang === 'uz' ? 'uz' : state.settings.lang;
    const intro = m.portfolioIntro || m.summary;
    const primary = m.contacts.find((c) => c.ic === 'send') || m.contacts.find((c) => c.ic === 'mail') || m.contacts[0];
    const skillItems = m.skillGroups.length ? m.skillGroups : (m.skills.length ? [{ group: '', items: m.skills }] : []);
    const css = `
:root{--a:${accent};--a2:color-mix(in srgb,var(--a) 12%,#fff);--ink:#141824;--sub:#5d6475;--bg:#fff;--soft:#f6f7fb;--line:#e6e8ef}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit}.wrap{max-width:1080px;margin:0 auto;padding:0 24px}
nav{position:sticky;top:0;z-index:5;background:rgba(255,255,255,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
nav .wrap{display:flex;align-items:center;justify-content:space-between;height:60px;gap:16px}
.logo{font-weight:800;letter-spacing:-.02em;text-decoration:none}.logo span{color:var(--a)}
.links{display:flex;gap:22px;font-size:14px;font-weight:500}.links a{text-decoration:none;color:var(--sub)}.links a:hover{color:var(--a)}
.hero{position:relative;overflow:hidden;background:linear-gradient(135deg,var(--a),color-mix(in srgb,var(--a) 60%,#000));color:#fff}
.hero:before{content:"";position:absolute;right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:rgba(255,255,255,.08)}
.hero .wrap{display:grid;grid-template-columns:1.4fr 1fr;gap:40px;align-items:center;padding-top:80px;padding-bottom:80px;position:relative}
.kicker{display:inline-block;font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;background:rgba(255,255,255,.15);padding:6px 12px;border-radius:99px}
h1{font-size:clamp(36px,6vw,64px);line-height:1.05;letter-spacing:-.03em;margin:18px 0 12px}
.lead{font-size:clamp(16px,2vw,19px);opacity:.9;max-width:560px;margin:0}
.btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:12px;font-weight:600;text-decoration:none;font-size:15px}
.btn.w{background:#fff;color:var(--a)}.btn.o{border:1px solid rgba(255,255,255,.5);color:#fff}
.ph{justify-self:center;width:min(320px,70vw);aspect-ratio:1;border-radius:32px;overflow:hidden;border:6px solid rgba(255,255,255,.25);box-shadow:0 30px 60px rgba(0,0,0,.25);transform:rotate(2deg);background:rgba(255,255,255,.12);display:grid;place-items:center;font-size:72px;font-weight:800}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
section{padding:80px 0}section.alt{background:var(--soft)}
.h2{font-size:clamp(26px,4vw,36px);letter-spacing:-.02em;margin:0 0 8px}.eyebrow{color:var(--a);font-weight:700;font-size:13px;letter-spacing:.12em;text-transform:uppercase}
.about{font-size:18px;color:#2c3242;max-width:760px;white-space:pre-line}
.facts{display:flex;flex-wrap:wrap;gap:10px 24px;margin-top:20px;color:var(--sub);font-size:15px}.facts span{display:flex;gap:8px;align-items:center}.facts svg{color:var(--a)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-top:32px}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(20,24,36,.08)}
.num{width:40px;height:40px;border-radius:12px;background:var(--a2);color:var(--a);display:grid;place-items:center;font-weight:800;margin-bottom:14px}
.card h3{margin:0 0 6px;font-size:18px}.card p{margin:0;color:var(--sub)}
.tl{margin-top:32px;position:relative;padding-left:28px}.tl:before{content:"";position:absolute;left:7px;top:6px;bottom:6px;width:2px;background:var(--line)}
.ti{position:relative;margin-bottom:28px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px 24px}
.ti:before{content:"";position:absolute;left:-27px;top:26px;width:14px;height:14px;border-radius:50%;background:var(--a);box-shadow:0 0 0 5px var(--a2)}
.ti .top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px 16px;align-items:baseline}
.ti h3{margin:0;font-size:19px}.co{color:var(--a);font-weight:600}.date{color:var(--sub);font-size:14px;background:var(--soft);padding:3px 10px;border-radius:99px}
.ti ul{margin:12px 0 0;padding-left:18px;color:#343b4b}.ti li{margin:4px 0}
.sk{margin-top:28px}.sk h4{margin:18px 0 10px;font-size:15px}.chips{display:flex;flex-wrap:wrap;gap:10px}
.chip{padding:8px 14px;border-radius:99px;background:#fff;border:1px solid var(--line);font-weight:500;font-size:14px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:40px}
.edu{padding:16px 0;border-bottom:1px solid var(--line)}.edu b{display:block}.edu span{color:var(--sub);font-size:14px}
.lg{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--line);gap:12px}
.bar{width:140px;height:8px;border-radius:9px;background:var(--line);overflow:hidden;flex:none}.bar i{display:block;height:100%;background:var(--a);border-radius:9px}
.lg small{color:var(--sub);display:block}
.contact{background:var(--ink);color:#fff;text-align:center}.contact .lead{margin:12px auto 0;opacity:.75}
.cl{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:28px}
.cl a{display:inline-flex;gap:10px;align-items:center;padding:12px 18px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);text-decoration:none;font-weight:500}
.cl a:hover{background:var(--a)}
footer{background:var(--ink);color:rgba(255,255,255,.5);text-align:center;padding:0 0 32px;font-size:13px}
.rv{opacity:0;transform:translateY(18px);transition:opacity .6s,transform .6s}.rv.in{opacity:1;transform:none}
@media(max-width:760px){.links{display:none}.kicker{font-size:11px;letter-spacing:.06em}.hero .wrap{grid-template-columns:1fr;padding-top:48px;padding-bottom:56px;text-align:center}.hero .lead{margin:0 auto}.btns{justify-content:center}.ph{grid-row:1;width:180px;border-radius:28px}section{padding:56px 0}.two{grid-template-columns:1fr;gap:16px}.bar{width:90px}.wrap{padding:0 16px}}
@media print{.rv{opacity:1;transform:none}nav{position:static}}`;
    const js = `(function(){var els=document.querySelectorAll('.rv');if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});els.forEach(function(e){io.observe(e)})})();`;
    const nav = [
      intro && `<a href="#about">${esc(t.about)}</a>`,
      m.jobs.length && `<a href="#exp">${esc(t.experience)}</a>`,
      skillItems.length && `<a href="#skills">${esc(t.skills)}</a>`,
      `<a href="#contact">${esc(t.contactMe)}</a>`
    ].filter(Boolean).join('');
    const body = `
<nav><div class="wrap"><a class="logo" href="#top">${esc(m.nameParts[0] || 'CV')}<span>.</span></a><div class="links">${nav}</div></div></nav>
<header class="hero" id="top"><div class="wrap">
  <div><span class="kicker">${esc(m.title)}</span><h1>${esc(m.name)}</h1>
  ${m.headline ? `<p class="lead">${esc(m.headline)}</p>` : ''}
  <div class="btns">${primary ? `<a class="btn w" href="${esc(primary.href)}" target="_blank" rel="noopener">${icon(primary.ic, 16)} ${esc(t.writeMe)}</a>` : ''}${m.jobs.length ? `<a class="btn o" href="#exp">${esc(t.experience)} →</a>` : ''}</div></div>
  <div class="ph">${m.photo ? `<img src="${m.photo}" alt="${esc(m.name)}">` : esc(m.initials.toUpperCase() || 'CV')}</div>
</div></header>
${intro ? `<section id="about"><div class="wrap rv"><div class="eyebrow">${esc(t.about)}</div><p class="about">${esc(intro)}</p>
  ${m.extra.length ? `<div class="facts">${m.extra.map((c) => `<span>${icon(c.ic, 16)}${esc(c.v)}</span>`).join('')}</div>` : ''}</div></section>` : ''}
${m.strengths.length ? `<section class="alt"><div class="wrap"><div class="eyebrow">${esc(t.strengths)}</div><h2 class="h2">${esc(t.strengths)}</h2>
  <div class="grid">${m.strengths.map((x, i) => `<div class="card rv"><div class="num">${String(i + 1).padStart(2, '0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text || '')}</p></div>`).join('')}</div></div></section>` : ''}
${m.jobs.length ? `<section id="exp"><div class="wrap"><div class="eyebrow">${esc(t.experience)}</div><h2 class="h2">${esc(t.experience)}</h2>
  <div class="tl">${m.jobs.map((j) => `<div class="ti rv"><div class="top"><div><h3>${esc(j.role)}</h3><div class="co">${esc(j.company || '')}</div></div>${j.period ? `<span class="date">${esc(j.period)}</span>` : ''}</div>${j.bullets.length ? `<ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div></div></section>` : ''}
${skillItems.length ? `<section class="alt" id="skills"><div class="wrap rv"><div class="eyebrow">${esc(t.skills)}</div><h2 class="h2">${esc(t.skills)}</h2>
  <div class="sk">${skillItems.map((g) => `${g.group ? `<h4>${esc(g.group)}</h4>` : ''}<div class="chips">${g.items.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div>`).join('')}</div></div></section>` : ''}
${m.edu.length || m.langs.length ? `<section><div class="wrap two">
  ${m.edu.length ? `<div class="rv"><div class="eyebrow">${esc(t.education)}</div>${m.edu.map((e) => `<div class="edu"><b>${esc(e.degree)}</b><span>${esc(e.school)}${e.period ? ' · ' + esc(e.period) : ''}</span></div>`).join('')}</div>` : '<div></div>'}
  ${m.langs.length ? `<div class="rv"><div class="eyebrow">${esc(t.languages)}</div>${m.langs.map((l) => `<div class="lg"><div><b>${esc(l.name)}</b><small>${esc(l.level)}</small></div><div class="bar"><i style="width:${l.score * 20}%"></i></div></div>`).join('')}</div>` : ''}
</div></section>` : ''}
<section class="contact" id="contact"><div class="wrap rv"><div class="eyebrow" style="color:#fff;opacity:.6">${esc(t.contactMe)}</div><h2 class="h2">${esc(t.writeMe)}</h2><p class="lead">${esc(t.ctaText)}</p>
  <div class="cl">${m.contacts.map((c) => `<a href="${esc(c.href)}" target="_blank" rel="noopener">${icon(c.ic, 16)}${esc(c.v)}</a>`).join('')}</div></div></section>
<footer>© ${new Date().getFullYear()} ${esc(m.name)} · ${esc(t.footer)}</footer>`;
    return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(m.name)} — ${esc(m.title)}</title><meta name="description" content="${esc(m.headline || m.title)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${css}</style></head><body>${body}<script>${js}<\/script></body></html>`;
  }

  window.CV = { TEMPLATES, LABELS: L, renderResume, renderSite, esc };
})();
