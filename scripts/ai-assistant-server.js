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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_BASE = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');

function writeJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

async function generateAssistantAnswer(payload) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing in .env');
  }

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
        'You are EstatePerks AI Support, a practical assistant similar to Gemini.',
        'Rules:',
        '- Answer in a helpful, conversational tone with concise structure.',
        '- Give actionable next steps for real-estate user tasks in India.',
        '- Use app context and conversation; do not invent unavailable actions.',
        '- If details are missing, state what to provide next.',
        '- Keep response concise (4-8 lines).',
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

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    writeJson(res, 200, { ok: true, model: OPENAI_MODEL });
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

  writeJson(res, 404, { error: 'Not Found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[ai-server] Listening on http://0.0.0.0:${PORT}`);
  console.log(`[ai-server] Endpoint: POST /api/ai-assistant`);
  if (!OPENAI_API_KEY) {
    console.log('[ai-server] OPENAI_API_KEY is missing. Add it in .env');
  }
});
