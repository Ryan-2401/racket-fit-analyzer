/**
 * AI 호출 서버 함수 (Vercel Serverless Function)
 * 브라우저 → POST /api/ai {prompt, tier} → AI 응답 {text, model}
 *
 * API 키는 코드에 넣지 않고 Vercel 환경 변수에만 둔다.
 *   GEMINI_API_KEY     구글 Gemini API 키 (무료 등급 가능)  ─┐ 둘 중 하나만 넣으면 된다.
 *   ANTHROPIC_API_KEY  Anthropic Claude API 키 (유료)      ─┘ 둘 다 있으면 Claude를 쓴다.
 *   ACCESS_CODE        (선택) 넣으면 주소 끝에 ?code=값 을 붙인 링크로 연 사람만 AI를 쓸 수 있다.
 *   GEMINI_MODEL_QUICK / GEMINI_MODEL_DEFAULT / CLAUDE_MODEL_QUICK / CLAUDE_MODEL_DEFAULT
 *                      (선택) 모델 이름을 바꿀 때만.
 */
const MODELS = {
  gemini: {
    quick: process.env.GEMINI_MODEL_QUICK || "gemini-3.5-flash-lite",
    default: process.env.GEMINI_MODEL_DEFAULT || "gemini-3.8-flash",
  },
  claude: {
    quick: process.env.CLAUDE_MODEL_QUICK || "claude-haiku-5-5",
    default: process.env.CLAUDE_MODEL_DEFAULT || "claude-sonnet-5-5",
  },
};
const MAX_PROMPT = 12000;            // 앱 프롬프트는 4천 자 안팎. 그보다 훨씬 긴 요청은 거절
const WINDOW_MS = 10 * 60 * 1000;    // 같은 접속자(IP)당 10분에
const MAX_REQ = 80;                  // 80번까지 (실험실 36회 + 분석 여유)
const hits = new Map();

function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (list.length >= MAX_REQ) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  return false;
}

async function callClaude(prompt, model) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 1024, temperature: 0.2, messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(40000),
  });
  if (!r.ok) throw Object.assign(new Error("claude " + r.status), { status: r.status });
  const data = await r.json();
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
}

async function callGemini(prompt, model) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    }),
    signal: AbortSignal.timeout(40000),
  });
  if (!r.ok) throw Object.assign(new Error("gemini " + r.status), { status: r.status });
  const data = await r.json();
  return ((data.candidates || [])[0]?.content?.parts || []).map(p => p.text || "").join("");
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST로 요청해 주세요" });

  const code = process.env.ACCESS_CODE;
  if (code && req.headers["x-access-code"] !== code) return res.status(401).json({ error: "접근 코드가 맞지 않아요" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (tooMany(ip)) return res.status(429).json({ error: "요청이 너무 많아요. 잠시 뒤 다시 시도해 주세요" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const prompt = typeof body?.prompt === "string" ? body.prompt : "";
  const tier = body?.tier === "default" ? "default" : "quick";
  if (!prompt || prompt.length > MAX_PROMPT) return res.status(400).json({ error: "요청 내용이 비었거나 너무 길어요" });

  const provider = process.env.ANTHROPIC_API_KEY ? "claude" : process.env.GEMINI_API_KEY ? "gemini" : null;
  if (!provider) return res.status(503).json({ error: "서버에 API 키가 설정되지 않았어요" });
  const model = MODELS[provider][tier];

  try {
    const text = provider === "claude" ? await callClaude(prompt, model) : await callGemini(prompt, model);
    return res.status(200).json({ text, model });
  } catch (e) {
    if (e.status === 429) return res.status(429).json({ error: "AI 서비스 요청 한도에 걸렸어요" });
    console.error("AI call failed:", provider, model, e.status || e.name || e.message); // 키나 후기 내용은 로그에 남기지 않는다
    return res.status(502).json({ error: "AI 서비스가 응답하지 않아요" });
  }
};
