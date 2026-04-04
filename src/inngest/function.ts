import { inngest } from "./client";
import db from "@/lib/db";
import { MessageRole, MessageType } from "@/generated/prisma/enums";
import { SYSTEM_PROMPT } from "@/prompt";

const getGeminiApiKey = () => process.env.GEMINI_API_KEY?.trim() || "";
const getOpenRouterApiKey = () => process.env.OPENROUTER_API_KEY?.trim() || "";

type GeneratedFiles = Record<string, string>;

async function callGemini(prompt: string): Promise<{ title: string; response: string; files: GeneratedFiles; html: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUSER PROMPT: ${prompt}` }] }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 16384,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini failed: ${res.status}`);
  const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini empty response");
  return JSON.parse(text);
}

async function callOpenRouter(prompt: string): Promise<{ title: string; response: string; files: GeneratedFiles; html: string }> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

  const model = process.env.OPENROUTER_MODEL?.trim() || "anthropic/claude-sonnet-4-5";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "BuildUI",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `USER PROMPT: ${prompt}` },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter failed: ${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter empty response");
  return JSON.parse(text);
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent", timeouts: { finish: "5m" } },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    // Single step: generate code + save — no sandbox, instant preview via data URL
    const result = await step.run("generate-and-save", async () => {
      let generated: { title: string; response: string; files: GeneratedFiles; html?: string };

      try {
        generated = await callOpenRouter(event.data.value);
      } catch (err) {
        console.error("OpenRouter failed, trying Gemini:", err);
        generated = await callGemini(event.data.value);
      }

      // Use html field for instant preview (no sandbox needed)
      const sandboxUrl = generated.html
        ? `data:text/html;charset=utf-8,${encodeURIComponent(generated.html)}`
        : `data:text/html;charset=utf-8,${encodeURIComponent("<html><body style='background:#111;color:white;font-family:sans-serif;padding:2rem'><h1>Preview ready — check Code tab</h1></body></html>")}`;

      await db.message.create({
        data: {
          projectId: event.data.projectId,
          content: generated.response || "Here's what I built for you.",
          role: MessageRole.ASSISTANT,
          type: MessageType.RESULT,
          fragments: {
            create: {
              sandboxUrl,
              title: generated.title || "Generated App",
              files: generated.files,
            },
          },
        },
      });

      return { title: generated.title, files: generated.files };
    });

    return result;
  }
);
