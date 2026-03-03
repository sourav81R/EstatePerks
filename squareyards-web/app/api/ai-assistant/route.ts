import { NextResponse } from "next/server";

type AIRequest = {
  question?: string;
  context?: Record<string, unknown>;
};

function buildPrompt(question: string, context?: Record<string, unknown>) {
  return [
    "You are an Indian real-estate advisor.",
    "Give practical, concise responses.",
    "When user asks property/investment questions, give next-step guidance.",
    "",
    `Question: ${question}`,
    "",
    "Context:",
    JSON.stringify(context || {}, null, 2),
  ].join("\n");
}

async function callGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const base = (process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta").replace(
    /\/$/,
    "",
  );

  const response = await fetch(
    `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 420 },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Gemini request failed");
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const message = parts
    .map((part: { text?: string }) => (typeof part.text === "string" ? part.text.trim() : ""))
    .filter(Boolean)
    .join("\n")
    .trim();

  return message || null;
}

async function callOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const base = (process.env.OPENAI_API_BASE || "https://api.openai.com/v1").replace(/\/$/, "");

  const response = await fetch(`${base}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: 0.3,
      max_output_tokens: 420,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "OpenAI request failed");
  }

  const data = await response.json();
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }
  return null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as AIRequest;
  const question = String(body.question || "").trim();
  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  const prompt = buildPrompt(question, body.context);

  try {
    const geminiReply = await callGemini(prompt);
    if (geminiReply) {
      return NextResponse.json({ answer: geminiReply, provider: "gemini" });
    }

    const openaiReply = await callOpenAI(prompt);
    if (openaiReply) {
      return NextResponse.json({ answer: openaiReply, provider: "openai" });
    }

    return NextResponse.json({
      answer:
        "Live AI keys are not configured yet. Share your budget, city, and timeline and I can still suggest a shortlist flow.",
      provider: "fallback",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate AI response." },
      { status: 500 },
    );
  }
}
