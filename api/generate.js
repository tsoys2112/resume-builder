// Vercel Serverless Function: POST /api/generate
// Ключ Gemini хранится только на сервере: Vercel → Settings → Environment Variables → GEMINI_API_KEY
const P = require('../js/prompt.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Только POST' });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'На сервере не задан GEMINI_API_KEY', code: 'NO_KEY' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const data = (body && body.data) || {};
  if (!data.name && !data.title && !(data.experience || []).length) {
    return res.status(400).json({ error: 'Заполните хотя бы имя, должность или опыт' });
  }

  const model = (process.env.GEMINI_MODEL || P.DEFAULT_MODEL).replace(/[^\w.\-]/g, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(P.build(data))
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = json?.error?.message || `Gemini HTTP ${r.status}`;
      return res.status(r.status === 429 ? 429 : 502).json({ error: msg });
    }
    return res.status(200).json({ result: P.parse(json), model });
  } catch (e) {
    return res.status(502).json({ error: 'Ошибка обращения к Gemini: ' + e.message });
  }
};
