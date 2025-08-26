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
    // Hono에서 multipart 받기 (File API 형태)
    const form = await c.req.formData();
    const prompt = String(form.get("prompt") || "");

    const images = form.getAll("images").filter(Boolean);

    // Gemini contents 구성: 이미지(여러개 가능) + 텍스트
    const contents: any[`[시스템 instruction] : 
      당신은 식물전문가 입니다. 사용자의 이미지에 따라서 병충해 여부나 
      건강상태를 알려 주세요. 사용자는 이미지는 보내지만, prompt는 보낼수도,
      안보낼수도 있습니다.
      
      [사용자 질문: ]`] = [];

    for (const part of images) {
      if (part instanceof File) {
        const mimeType = part.type || "image/jpeg";
        const buf = Buffer.from(await part.arrayBuffer());
        const b64 = buf.toString("base64");
        contents.push({
          inlineData: { mimeType, data: b64 },
        });
      }
    }

    if (prompt) contents.push({ text: prompt });

    if (contents.length === 0) {
      return c.json({ error: "이미지 또는 프롬프트를 제공하세요." }, 400);
    }

    // Gemini 2.5 Flash에 질의 (텍스트 응답)
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    const text = result.text || "";
    return c.json({ text });
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
