import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from "hono/cors";
import * as dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

import gemini_route from "./router/gemini_route.js"

const app = new Hono();

// .env.development 읽을건지, .env.production 읽을건지 결정
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: envFile });

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["*"],
  })
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
app.post("/api/gemini/simple", async (c) => {
  try {
    const form = await c.req.formData();
    const prompt = String(form.get("prompt") || "");
    const images = form.getAll("images").filter(Boolean);

    // 1) Part 배열 생성
    const parts: any[] = [];

    for (const f of images) {
      if (f instanceof File) {
        const mimeType = f.type || "image/jpeg";
        const buf = Buffer.from(await f.arrayBuffer());
        parts.push({
          inlineData: { mimeType, data: buf.toString("base64") },
        });
      }
    }

    if (prompt) {
      parts.push({ text: prompt });
    } else {
      // 프롬프트가 없을 때도 한국어 지시가 전달되도록 최소 안내문 추가
      parts.unshift({ text: "이 사진을 보고 한국어로 간단히 설명하고, 병충해/건강 상태를 추정해줘." });
    }

    if (parts.length === 0) {
      return c.json({ error: "이미지 또는 프롬프트를 제공하세요." }, 400);
    }

    // 2) 시스템 지시(한국어 고정)
    const SYSTEM_KO = `
당신은 식물 전문가입니다. 사용자가 보낸 식물 사진을 보고
병충해 여부와 건강 상태를 간단히 판단해 주세요.
답변은 반드시 한국어로, 짧고 명확하게 작성하세요.
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // parts를 하나의 user 콘텐츠로 래핑
      contents: [{ role: "user", parts }],
      // 한국어로 답하게 하는 시스템 지시
      config: { systemInstruction: SYSTEM_KO, responseMimeType: "text/plain" },
    }); // systemInstruction 사용 예시는 공식 문서의 Node 샘플에도 있습니다. :contentReference[oaicite:1]{index=1}

    return c.json({ text: result.text || "" });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message || "서버 오류" }, 500);
  }
});


app.route('/api/file', gemini_route);

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
