type GeneratedFragment = {
  title: string;
  sandboxUrl: string;
  files: Record<string, string>;
  response: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const normalize = (prompt: string) => prompt.toLowerCase();

const getGeminiApiKey = () => {
  const direct = process.env.GEMINI_API_KEY?.trim();
  if (direct) return direct;
  const withSpace = process.env["GEMINI_API_KEY "]?.trim();
  if (withSpace) return withSpace;
  return "";
};

const getOpenRouterApiKey = () => process.env.OPENROUTER_API_KEY?.trim() || "";

const buildTemplate = (prompt: string) => {
  const value = normalize(prompt);
  if (value.includes("spotify") || value.includes("music")) {
    return {
      title: "spotify-style-player",
      heading: "Spotify-Style Music Player",
      body: "Sidebar playlists, album pane, and playback controls with dark mode.",
      cards: ["Liked Songs", "Daily Mix", "Top Hits", "Chill Vibes"],
    };
  }
  if (value.includes("netflix") || value.includes("movie")) {
    return {
      title: "netflix-style-home",
      heading: "Netflix-Style Homepage",
      body: "Hero banner, movie rows, and detail-focused dark UI sections.",
      cards: ["Trending", "Top Rated", "Action", "Sci-Fi"],
    };
  }
  if (value.includes("youtube") || value.includes("video")) {
    return {
      title: "youtube-style-home",
      heading: "YouTube-Style Video Feed",
      body: "Sidebar navigation and responsive video card grid layout.",
      cards: ["For You", "Gaming", "Music", "Live"],
    };
  }
  if (value.includes("kanban")) {
    return {
      title: "kanban-board",
      heading: "Kanban Board",
      body: "Columns with draggable-looking task cards in a clean board layout.",
      cards: ["Todo", "In Progress", "Review", "Done"],
    };
  }
  return {
    title: "custom-app-starter",
    heading: "Prompt-Based Starter",
    body: "Starter generated from your prompt with a clean, dark, responsive layout.",
    cards: ["Section A", "Section B", "Section C", "Section D"],
  };
};

const fallbackFragment = (prompt: string): GeneratedFragment => {
  const template = buildTemplate(prompt);
  const safePrompt = escapeHtml(prompt);
  const cardsHtml = template.cards
    .map(
      (item) =>
        `<div class="card"><div class="dot"></div><span>${escapeHtml(item)}</span></div>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${template.heading}</title>
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; font-family: Inter, Arial, sans-serif; background: #07090f; color: #e5e7eb; }
      .wrap { max-width: 980px; margin: 0 auto; padding: 32px 20px; }
      .hero { border: 1px solid #1f2937; border-radius: 16px; background: linear-gradient(180deg,#111827,#0b1020); padding: 24px; }
      h1 { margin: 0 0 12px; font-size: 32px; }
      p { margin: 0 0 10px; color: #cbd5e1; line-height: 1.5; }
      .prompt { font-size: 13px; color: #94a3b8; background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; }
      .grid { margin-top: 18px; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
      .card { display: flex; align-items: center; gap: 10px; border: 1px solid #1f2937; border-radius: 12px; background: #0f172a; padding: 12px; }
      .dot { width: 10px; height: 10px; border-radius: 999px; background: #22c55e; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>${template.heading}</h1>
        <p>${template.body}</p>
        <p class="prompt">Prompt: ${safePrompt}</p>
        <div class="grid">${cardsHtml}</div>
      </section>
    </div>
  </body>
</html>`;

  const pageTsx = `"use client";

const items = ${JSON.stringify(template.cards)};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#07090f] text-slate-200 p-8">
      <section className="max-w-5xl mx-auto border border-slate-800 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0b1020] p-6">
        <h1 className="text-3xl font-bold mb-3">${template.heading}</h1>
        <p className="text-slate-300 mb-2">${template.body}</p>
        <p className="text-xs text-slate-400 mb-5">Prompt: ${prompt.replaceAll('"', '\\"')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-3">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
`;

  const layoutTsx = `export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

  return {
    title: template.title,
    sandboxUrl: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    files: {
      "app/page.tsx": pageTsx,
      "app/layout.tsx": layoutTsx,
    },
    response: `Generated a ${template.heading.toLowerCase()} starter based on your prompt.`,
  };
};

const extractJsonFromText = (value: string) => {
  const fenced = value.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];
  return value;
};

const QUALITY_BAR = [
  "Deliver a PRODUCT-QUALITY UI, not a placeholder: implement the full layout the user asked for (e.g. sidebars, nav, grids, modals, players, tables) using semantic HTML and Tailwind-style utility classes in TSX.",
  "html must be a self-contained dark-mode preview with inline <style> that closely matches the TSX UI (same structure, colors, spacing).",
  "Use realistic mock data (arrays of items), useState for interactivity where the prompt mentions local state, and clear visual hierarchy (typography scale, spacing, borders).",
  "Split complex UI into small components in files under app/ if needed; keep app/page.tsx as the main screen.",
  "Avoid generic one-line descriptions: the visible UI must clearly reflect the user's exact scenario.",
].join("\n");

type AiFragmentSchema = {
  title: string;
  response: string;
  html: string;
  files: Record<string, string>;
};

const buildAiFragment = (data: AiFragmentSchema): GeneratedFragment => ({
  title: data.title || "generated-ui",
  response:
    data.response || "Generated a UI based on your prompt with layout and code.",
  sandboxUrl: `data:text/html;charset=utf-8,${encodeURIComponent(data.html || "")}`,
  files: data.files || {},
});

const callGeminiForFragment = async (
  prompt: string,
  signal: AbortSignal
): Promise<GeneratedFragment> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const instruction = [
    "You are a senior UI engineer.",
    "Generate one polished response for the user's product prompt.",
    "Return ONLY JSON with keys: title, response, html, files.",
    "files must include app/page.tsx and app/layout.tsx.",
    QUALITY_BAR,
    "Do not include markdown fences outside JSON.",
    "",
    `USER_PROMPT: ${prompt}`,
  ].join("\n");

  const payload = {
    contents: [
      {
        parts: [{ text: instruction }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini request failed (${res.status})`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini response is empty");
  }

  const parsed = JSON.parse(extractJsonFromText(text)) as AiFragmentSchema;
  if (!parsed?.html || !parsed?.files?.["app/page.tsx"]) {
    throw new Error("Gemini output missing required fields");
  }

  return buildAiFragment(parsed);
};

const callOpenRouterForFragment = async (
  prompt: string,
  signal: AbortSignal
): Promise<GeneratedFragment> => {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const instruction = [
    "You are a senior frontend engineer and UI designer.",
    "Generate one polished response for the user's product prompt.",
    "Return ONLY valid JSON with keys: title, response, html, files.",
    "files must include app/page.tsx and app/layout.tsx.",
    "Code should be complete and runnable in Next.js app router.",
    QUALITY_BAR,
    "",
    `USER_PROMPT: ${prompt}`,
  ].join("\n");

  const model =
    process.env.OPENROUTER_MODEL?.trim() || "anthropic/claude-sonnet-4.5";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "BuildUI Local",
    },
    body: JSON.stringify({
      model,
      temperature: 0.42,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Output must be strict JSON only. No markdown wrappers or extra text.",
        },
        {
          role: "user",
          content: instruction,
        },
      ],
    }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`OpenRouter request failed (${res.status})`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("OpenRouter response is empty");
  }

  const parsed = JSON.parse(extractJsonFromText(text)) as AiFragmentSchema;
  if (!parsed?.html || !parsed?.files?.["app/page.tsx"]) {
    throw new Error("OpenRouter output missing required fields");
  }
  return buildAiFragment(parsed);
};

export const generatePromptFragment = async (
  prompt: string,
  timeoutMs = 170000
): Promise<GeneratedFragment> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    try {
      return await callOpenRouterForFragment(prompt, controller.signal);
    } catch (openRouterError) {
      console.error("OpenRouter generation failed, trying Gemini:", openRouterError);
      return await callGeminiForFragment(prompt, controller.signal);
    }
  } catch (error) {
    console.error("Falling back to template fragment:", error);
    return fallbackFragment(prompt);
  } finally {
    clearTimeout(timer);
  }
};
