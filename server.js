import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadLocalEnv();
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 5177);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^"|"$/g, "");
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
  if (!body.trim()) return {};
  return JSON.parse(body);
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

function getDeepSeekConfig(payload = {}) {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DEEPSEEK_BASE_URL || payload.settings?.baseUrl || "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL || payload.settings?.model || "deepseek-chat",
    temperature: Number(process.env.DEEPSEEK_TEMPERATURE || payload.settings?.temperature || 0.4),
    maxTokens: Number(process.env.DEEPSEEK_MAX_TOKENS || payload.settings?.maxTokens || 2400)
  };
}

async function callDeepSeek({ payload, messages, temperature, maxTokens }) {
  const config = getDeepSeekConfig(payload);
  const timeout = withTimeout(30000);

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    signal: timeout.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature: temperature ?? config.temperature,
      max_tokens: maxTokens ?? config.maxTokens,
      messages
    })
  }).finally(timeout.done);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || "DeepSeek API 调用失败，请检查配置或稍后重试。");
    error.status = response.status;
    throw error;
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    const error = new Error("DeepSeek 返回为空。");
    error.status = 502;
    throw error;
  }
  return content;
}

function cleanOptimizedPrompt(content) {
  let text = String(content || "").trim();

  text = text
    .replace(/^好的[，,。\s\S]*?以下是(?:优化后的)?\s*Prompt[：:]\s*/i, "")
    .replace(/^遵照[，,。\s\S]*?以下是(?:优化后的)?\s*Prompt[：:]\s*/i, "")
    .replace(/^以下是(?:优化后的)?\s*Prompt[：:]\s*/i, "")
    .replace(/^这是(?:优化后的)?\s*Prompt[：:]\s*/i, "")
    .trim();

  const markerIndex = text.search(/(?:^|\n)\s*(?:---\s*)?\n?\s*(#{1,3}\s+|\*\*[^*\n]+[：:])/);
  if (markerIndex > 0) {
    text = text.slice(markerIndex).trim();
  }

  return text.replace(/^---+\s*/, "").replace(/\s*---+\s*$/g, "").trim();
}

async function optimizePrompt(req, res) {
  try {
    const payload = await readJson(req);
    if (!getDeepSeekConfig(payload).apiKey) {
      return sendJson(res, 400, {
        ok: false,
        message: "后端未配置 DEEPSEEK_API_KEY。请在环境变量中配置后重启服务。"
      });
    }

    const draftPrompt = String(payload.draftPrompt || "").trim();
    if (!draftPrompt) {
      return sendJson(res, 422, { ok: false, message: "draftPrompt 不能为空。" });
    }

    const optimizedPrompt = await callDeepSeek({
      payload,
      temperature: 0.2,
      messages: [
          {
            role: "system",
            content:
              "你是 Prompt 重写器，不是任务执行者。你的唯一任务是把用户提供的 Draft Prompt 改写成一个可复制给另一个 AI 的“提示词模板”。最高优先级原则：原始需求优先。必须严格保留用户原始需求中的任务类型、任务对象、交付物、领域边界和真实意图；AIM、需求控制、输出标准等模块只能增强表达和约束输出，不能替换、扩写、脑补或转移原始需求。严禁把“做某物”改成“教练建议”，把“分析某物”改成“执行方案”，把“设计产品”改成“领域指导”，或把任何需求改写成另一个任务。严禁回答 Draft Prompt 里的任务，严禁给学习计划、训练计划、分析结论、代码、日志、建议或任何任务结果。只能输出给 AI 的指令文本，必须保留“你需要/请你/输出时”等指令语气。禁止输出寒暄、解释、确认语、'以下是'、'优化后的Prompt'、分隔线或包装说明。不得新增用户未选择的真实性验证、双重来源、反证检查或自检要求。"
          },
          {
            role: "user",
            content: JSON.stringify(
              {
                task: "rewrite_prompt_only_do_not_answer",
                outputRules: [
                  "只输出最终提示词模板本体",
                  "不要执行提示词里的任务",
                  "不要生成任何任务答案、计划、日志、结论或建议",
                  "必须以原始需求为最高优先级，模块只能增强原始需求，不能改变任务对象、交付物或领域边界",
                  "必须使用指令语气，让另一个 AI 知道它要如何回答",
                  "第一行应是提示词标题，例如：# AI Agent 入门指南生成提示词",
                  "不要新增未选择模块要求"
                ],
                draftPrompt
              },
              null,
              2
            )
          }
        ]
    });

    return sendJson(res, 200, { ok: true, optimizedPrompt: cleanOptimizedPrompt(optimizedPrompt) });
  } catch (error) {
    const aborted = error?.name === "AbortError";
    return sendJson(res, aborted ? 504 : error.status || 500, {
      ok: false,
      message: aborted ? "DeepSeek API 请求超时，请稍后重试。" : error.message || "服务端处理失败。"
    });
  }
}

async function suggestAim(req, res) {
  try {
    const payload = await readJson(req);
    if (!getDeepSeekConfig(payload).apiKey) {
      return sendJson(res, 400, {
        ok: false,
        message: "后端未配置 DEEPSEEK_API_KEY。请在环境变量中配置后重启服务。"
      });
    }

    const request = payload.request || {};
    const userInput = String(request.userInput || "").trim();
    const requestType = payload.requestType || "general";
    if (!userInput) {
      return sendJson(res, 422, { ok: false, message: "请先填写一句话需求。" });
    }

    const content = await callDeepSeek({
      payload,
      temperature: 0.7,
      maxTokens: 1800,
      messages: [
        {
          role: "system",
          content:
            "你是产品化 Prompt 助手，只为 AIM 提问法补齐字段。最高优先级原则：原始需求优先。必须严格保留用户原始需求中的任务类型、任务对象、交付物、领域边界和真实意图；AIM 字段只能补齐角色、问题、目标和输出格式，不能把原始需求改写成另一个任务。Actor 必须服务于原始需求，而不是只根据领域名生成泛化角色。currentProblem、shortGoal、longGoal、expectedOutput 都必须围绕原始需求本身。必须返回严格 JSON，不要 Markdown，不要解释。JSON 结构：{\"suggestions\":[{\"title\":\"方案名\",\"actor\":\"AI角色\",\"currentProblem\":\"当前问题\",\"shortGoal\":\"短期目标\",\"longGoal\":\"长期目标\",\"expectedOutput\":\"期望输出格式\"}]}。给 3 个差异明显的方案，内容中文、具体、可编辑。"
        },
        {
          role: "user",
          content: [
            `一句话需求：${userInput}`,
            request.background ? `背景：${request.background}` : "",
            request.goal ? `目标：${request.goal}` : "",
            request.constraints ? `限制条件：${request.constraints}` : "",
            `需求类型参考：${requestType}`,
            "特别要求：先理解并保留原始需求本身，再补齐 AIM；不要根据领域关键词把任务偷换成另一个方向。"
          ]
            .filter(Boolean)
            .join("\n")
        }
      ]
    });

    const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions.slice(0, 3) : [];
    if (!suggestions.length) {
      return sendJson(res, 502, { ok: false, message: "DeepSeek 没有返回可用的 AIM 补齐方案。" });
    }

    return sendJson(res, 200, { ok: true, suggestions });
  } catch (error) {
    const aborted = error?.name === "AbortError";
    return sendJson(res, aborted ? 504 : error.status || 500, {
      ok: false,
      message: aborted ? "DeepSeek API 请求超时，请稍后重试。" : error.message || "服务端处理失败。"
    });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const rawPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(publicDir, rawPath));
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not a file");
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    createReadStream(filePath).pipe(res);
  } catch {
    const html = await readFile(path.join(publicDir, "index.html"));
    res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
    res.end(html);
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/config-status") {
    sendJson(res, 200, {
      ok: true,
      deepseekConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
    });
    return;
  }
  if (req.method === "POST" && req.url === "/api/optimize") {
    optimizePrompt(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/suggest-aim") {
    suggestAim(req, res);
    return;
  }
  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }
  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method Not Allowed");
});

server.listen(port, () => {
  console.log(`AI Prompt Modular App running at http://localhost:${port}`);
});
