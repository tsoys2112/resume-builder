/* Shared prompt builder — used by the browser (window.CVPrompt) and by the Vercel function (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CVPrompt = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const LANGS = { ru: 'русском', en: 'английском (English)', uz: 'узбекском (латиница, Oʻzbekcha)' };

  const schema = {
    type: 'OBJECT',
    properties: {
      headline: { type: 'STRING' },
      summary: { type: 'STRING' },
      strengths: { type: 'ARRAY', items: { type: 'OBJECT', properties: { title: { type: 'STRING' }, text: { type: 'STRING' } }, required: ['title', 'text'] } },
      experience: { type: 'ARRAY', items: { type: 'OBJECT', properties: { achievements: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['achievements'] } },
      skillGroups: { type: 'ARRAY', items: { type: 'OBJECT', properties: { group: { type: 'STRING' }, items: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['group', 'items'] } },
      portfolioIntro: { type: 'STRING' }
    },
    required: ['headline', 'summary', 'strengths', 'experience', 'skillGroups', 'portfolioIntro']
  };

  function clip(s, n) { return String(s == null ? '' : s).slice(0, n); }

  /* Keep only the fields the model needs (no photo), with length limits */
  function sanitize(d) {
    d = d || {};
    return {
      lang: ['ru', 'en', 'uz'].includes(d.lang) ? d.lang : 'ru',
      tone: clip(d.tone || 'деловой', 60),
      name: clip(d.name, 120), title: clip(d.title, 160), birth: clip(d.birth, 20), location: clip(d.location, 120),
      about: clip(d.about, 2000), skills: clip(d.skills, 1500),
      experience: (Array.isArray(d.experience) ? d.experience : []).slice(0, 12).map((j) => ({
        role: clip(j.role, 160), company: clip(j.company, 160), start: clip(j.start, 20),
        end: j.current ? 'по настоящее время' : clip(j.end, 20), desc: clip(j.desc, 2500)
      })),
      education: (Array.isArray(d.education) ? d.education : []).slice(0, 8).map((e) => ({
        school: clip(e.school, 200), degree: clip(e.degree, 200), start: clip(e.start, 10), end: clip(e.end, 10)
      })),
      languages: (Array.isArray(d.languages) ? d.languages : []).slice(0, 10).map((l) => ({ name: clip(l.name, 60), level: clip(l.level, 20) }))
    };
  }

  function build(raw) {
    const d = sanitize(raw);
    const system = [
      'Ты — опытный HR‑консультант и карьерный копирайтер. Ты пишешь сильные, честные резюме, которые проходят ATS и цепляют рекрутера.',
      `Пиши ВСЁ на ${LANGS[d.lang]} языке. Тон: ${d.tone}.`,
      'Правила:',
      '- Не выдумывай факты, компании, цифры, сертификаты. Используй только данные кандидата. Если цифр нет — формулируй достижения качественно, без конкретных чисел.',
      '- Начинай пункты опыта с сильного глагола действия, показывай результат и масштаб.',
      '- Без клише вроде «ответственный, коммуникабельный, стрессоустойчивый».',
      'Верни JSON:',
      '- headline: одна строка до 110 символов — позиционирование кандидата (кто он и в чём ценность).',
      '- summary: профессиональное описание от третьего лица без местоимений, 3–4 предложения, 50–90 слов, с акцентом на опыт, экспертизу и результат.',
      '- strengths: ровно 4 сильные стороны: title (2–4 слова) и text (одно предложение‑доказательство на основе опыта).',
      `- experience: массив ровно из ${d.experience.length} элементов в том же порядке, что и входной опыт; для каждого achievements — 3–5 пунктов (до 180 символов каждый). Если описания мало — 2–3 пункта, логично вытекающих из должности, без выдуманных цифр.`,
      '- skillGroups: 2–4 группы навыков (например «Продажи», «Управление», «Инструменты»), по 3–8 коротких пунктов; включи все навыки кандидата, можно добавить очевидно следующие из опыта.',
      '- portfolioIntro: текст для сайта‑портфолио от первого лица, 2–3 предложения, живой и тёплый.'
    ].join('\n');
    const user = 'Данные кандидата (JSON):\n' + JSON.stringify(d, null, 1);
    return {
      contents: [{ role: 'user', parts: [{ text: user }] }],
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: { temperature: 0.7, responseMimeType: 'application/json', responseSchema: schema }
    };
  }

  function parse(apiJson) {
    const parts = (((apiJson || {}).candidates || [])[0] || {}).content?.parts || [];
    const text = parts.map((p) => p.text || '').join('').trim();
    if (!text) {
      const why = apiJson?.promptFeedback?.blockReason || apiJson?.candidates?.[0]?.finishReason || 'пустой ответ';
      throw new Error('Модель не вернула текст (' + why + ')');
    }
    const m = text.match(/\{[\s\S]*\}/);
    return JSON.parse(m ? m[0] : text);
  }

  return { build, parse, sanitize, DEFAULT_MODEL: 'gemini-flash-latest' };
});
