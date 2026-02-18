const fs = require('fs');
const http = require('http');
const path = require('path');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const envRaw = fs.readFileSync(filePath, 'utf8');
  for (const line of envRaw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(path.join(process.cwd(), '.env'));

const PORT = Number(process.env.AI_ASSISTANT_PORT || 8787);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_BASE = (process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_BASE = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_API_BASE = (process.env.RESEND_API_BASE || 'https://api.resend.com').replace(/\/$/, '');
const NEWSLETTER_FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'onboarding@resend.dev';
const NEWSLETTER_FROM_NAME = process.env.NEWSLETTER_FROM_NAME || 'EstatePerks';
const NEWSLETTER_SUBJECT = process.env.NEWSLETTER_SUBJECT || 'You are subscribed to EstatePerks updates';

function writeJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function compactJson(value) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendNewsletterWelcomeEmail(email) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is missing in .env');
  }

  const from = NEWSLETTER_FROM_NAME
    ? `${NEWSLETTER_FROM_NAME} <${NEWSLETTER_FROM_EMAIL}>`
    : NEWSLETTER_FROM_EMAIL;

  const response = await fetch(`${RESEND_API_BASE}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: NEWSLETTER_SUBJECT,
      html: [
        '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">',
        '<h2 style="margin:0 0 12px;">Welcome to EstatePerks</h2>',
        '<p style="margin:0 0 8px;">Your email subscription is now active.</p>',
        '<p style="margin:0;">You will receive the latest property alerts and updates.</p>',
        '</div>',
      ].join(''),
      text: 'Welcome to EstatePerks. Your email subscription is now active. You will receive the latest property alerts and updates.',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error?.message || `Email provider error ${response.status}`;
    throw new Error(message);
  }
}

function extractTextFromResponsesApi(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const output = Array.isArray(data?.output) ? data.output : [];
  const chunks = [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === 'string' && part.text.trim()) {
        chunks.push(part.text.trim());
      }
    }
  }
  return chunks.join('\n').trim();
}

function extractTextFromGemini(data) {
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
  const chunks = [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      if (typeof part?.text === 'string' && part.text.trim()) {
        chunks.push(part.text.trim());
      }
    }
  }
  return chunks.join('\n').trim();
}

function buildAssistantPrompts(payload) {
  const question = String(payload?.question || '').trim();
  if (!question) {
    throw new Error('Question is required');
  }

  const assistantMode = payload?.assistantMode === 'support' ? 'support' : 'property';
  const property = payload?.property || {};
  const metrics = payload?.metrics || {};
  const appContext = payload?.appContext || {};
  const recentConversation = Array.isArray(payload?.recentConversation)
    ? payload.recentConversation.slice(-8)
    : [];

  const systemPrompt = assistantMode === 'support'
    ? [
        'You are EstatePerks AI Chat Assist powered by Gemini.',
        'Rules:',
        '- The user can ask about any topic; answer clearly and directly.',
        '- If the user asks real-estate questions, add practical India-focused next steps.',
        '- Use app context when relevant; do not invent unavailable product actions.',
        '- For medical, legal, and financial advice, include a short caution.',
        '- If details are missing, ask exactly what is needed next.',
        '- Keep responses concise and structured.',
      ].join('\n')
    : [
      'You are an AI Property Assistant for an Indian real-estate app.',
        'Rules:',
        '- Ground every answer in provided property data and metrics.',
        '- Be practical and specific. Mention trade-offs, not hype.',
        '- Keep response concise (4-8 lines).',
        '- If data is missing, say what is missing and what to verify on site visit.',
        '- Never fabricate legal/financial certainty. Use cautious language.',
      ].join('\n');

  const userPrompt = assistantMode === 'support'
    ? [
        `Question: ${question}`,
        'App context:',
        compactJson(appContext),
        'Recent conversation:',
        compactJson(recentConversation),
      ].join('\n\n')
    : [
        `Question: ${question}`,
        'Property data:',
        compactJson(property),
        'Calculated metrics:',
        compactJson(metrics),
        'Recent conversation:',
        compactJson(recentConversation),
      ].join('\n\n');

  return { systemPrompt, userPrompt };
}

async function generateWithGemini(systemPrompt, userPrompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in .env');
  }

  const endpoint = `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 520,
        topP: 0.9,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errText = data?.error?.message || `Gemini error ${response.status}`;
    throw new Error(errText);
  }

  const answer = extractTextFromGemini(data);
  if (!answer) {
    throw new Error('Gemini returned an empty response');
  }
  return answer;
}

async function generateWithOpenAI(systemPrompt, userPrompt) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing in .env');
  }

  const response = await fetch(`${OPENAI_API_BASE}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_output_tokens: 420,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const errText = data?.error?.message || `OpenAI error ${response.status}`;
    throw new Error(errText);
  }

  const answer = extractTextFromResponsesApi(data);
  if (!answer) {
    throw new Error('Model returned an empty response');
  }
  return answer;
}

async function generateAssistantAnswer(payload) {
  const { systemPrompt, userPrompt } = buildAssistantPrompts(payload);

  if (GEMINI_API_KEY) {
    return generateWithGemini(systemPrompt, userPrompt);
  }
  if (OPENAI_API_KEY) {
    return generateWithOpenAI(systemPrompt, userPrompt);
  }

  throw new Error('Missing AI credentials. Set GEMINI_API_KEY (recommended) or OPENAI_API_KEY in .env');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    writeJson(res, 200, {
      ok: true,
      provider: GEMINI_API_KEY ? 'gemini' : (OPENAI_API_KEY ? 'openai' : 'none'),
      model: GEMINI_API_KEY ? GEMINI_MODEL : OPENAI_MODEL,
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/ai-assistant') {
    try {
      const body = await readJsonBody(req);
      const answer = await generateAssistantAnswer(body);
      writeJson(res, 200, { answer });
    } catch (error) {
      writeJson(res, 500, {
        error: error instanceof Error ? error.message : 'Unknown server error',
      });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/newsletter/subscribe') {
    try {
      const body = await readJsonBody(req);
      const email = String(body?.email || '').trim().toLowerCase();
      if (!isValidEmail(email)) {
        writeJson(res, 400, { error: 'Please provide a valid email address.' });
        return;
      }

      await sendNewsletterWelcomeEmail(email);
      writeJson(res, 200, { ok: true, message: 'Subscription email sent.' });
    } catch (error) {
      writeJson(res, 500, {
        error: error instanceof Error ? error.message : 'Unknown server error',
      });
    }
    return;
  }

  writeJson(res, 404, { error: 'Not Found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[ai-server] Listening on http://0.0.0.0:${PORT}`);
  console.log(`[ai-server] Endpoint: POST /api/ai-assistant`);
  console.log(`[ai-server] Endpoint: POST /api/newsletter/subscribe`);
  if (GEMINI_API_KEY) {
    console.log(`[ai-server] AI provider: Gemini (${GEMINI_MODEL})`);
  } else if (OPENAI_API_KEY) {
    console.log(`[ai-server] AI provider: OpenAI (${OPENAI_MODEL})`);
    console.log('[ai-server] Tip: set GEMINI_API_KEY to use Gemini for chat assist.');
  } else {
    console.log('[ai-server] No AI key found. Add GEMINI_API_KEY (recommended) or OPENAI_API_KEY in .env');
  }
  if (!RESEND_API_KEY) {
    console.log('[ai-server] RESEND_API_KEY is missing. Newsletter emails are disabled.');
  }
});
