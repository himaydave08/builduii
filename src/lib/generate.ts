"use server";

import { SYSTEM_PROMPT } from "@/prompt";

export type GeneratedResult = {
  title: string;
  response: string;
  html: string;
  files: Record<string, string>;
};

const getGeminiKey = () => process.env.GEMINI_API_KEY?.trim() || "";
const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY?.trim() || "";

// Enhance vague prompts so beginners get great output too
function enhancePrompt(prompt: string): string {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  const VISUAL_SUFFIX = ` Use radial gradient glow backgrounds, glass morphism cards, gradient text on headings, hover lift animations, and a fixed navbar with blur. Make it look like a real shipped product from a top tech company — pixel-perfect, production-quality.`;

  // Detect app type and enrich
  const enhancements: Array<[RegExp, string]> = [
    [/netflix|streaming|movies?|shows?|hotstar|disney|hulu/i,
      `${p}. Build a complete streaming platform UI with: fixed navbar with logo and nav links, full-width hero banner (90vh) with radial gradient glow and CTA buttons, multiple horizontal scrolling rows of content cards (Trending Now, Top Picks, New Releases, Continue Watching), each card with gradient poster placeholder and hover scale effect, modal on card click showing details with backdrop blur. Dark theme (#141414). Use real movie names: Stranger Things, Ozark, The Crown, Squid Game, Wednesday, Dark, Money Heist, Peaky Blinders.${VISUAL_SUFFIX}`],
    [/spotify|music|songs?|playlist|audio/i,
      `${p}. Build a complete music streaming UI with: left sidebar (bg:#000, logo, nav links, playlists list), main content area (bg:#121212) with featured playlists 3x2 grid and recently played row, fixed bottom player bar (bg:#181818) with track info, playback controls, progress bar, and volume. Green (#1db954) accent. Use real song names: Blinding Lights, As It Was, Flowers, Anti-Hero, Unholy. Use real artist names: The Weeknd, Harry Styles, Miley Cyrus, Taylor Swift.${VISUAL_SUFFIX}`],
    [/youtube|video|channel|watch/i,
      `${p}. Build a complete video platform UI with: fixed top navbar (bg:#0f0f0f) with YouTube logo, search bar, and icons, left sidebar with nav links and icons, main video grid (3 columns) with 16:9 gradient thumbnails, channel avatar, title, views, and time. Include category chips row. Dark theme (#0f0f0f). Use real-sounding video titles.${VISUAL_SUFFIX}`],
    [/dashboard|admin|analytics|stats|metrics/i,
      `${p}. Build a complete admin dashboard with: left sidebar (bg:#0a0a0a, w:240px) with icon+label nav, top header with search and profile avatar, 4 KPI stat cards with colored icons and trend percentages, a bar chart using CSS divs, and a data table with status badges and pagination. Dark theme. Use realistic data.${VISUAL_SUFFIX}`],
    [/airbnb|hotel|booking|rental|property/i,
      `${p}. Build a complete property listing UI with: navbar with search and login, hero with search bar, property grid with cards (gradient image placeholder, title, price, rating stars, location), filter sidebar. Use real-sounding property names and locations.${VISUAL_SUFFIX}`],
    [/twitter|x\.com|social|feed|post|tweet/i,
      `${p}. Build a complete social feed UI with: left sidebar (logo, nav, profile), main feed with posts (avatar, name, handle, content, engagement buttons), right sidebar (trending topics, who to follow). Dark theme. Use realistic usernames and content.${VISUAL_SUFFIX}`],
    [/ecommerce|store|shop|product|cart/i,
      `${p}. Build a complete e-commerce UI with: navbar with cart icon and badge, hero banner, product grid with cards (gradient image, name, price, rating, add to cart button), filter sidebar, cart drawer. Use realistic product names and prices.${VISUAL_SUFFIX}`],
    [/kanban|board|task|project|todo/i,
      `${p}. Build a complete kanban board with: header with project name and actions, 4 columns (Backlog, In Progress, Review, Done), task cards with priority color badges, assignee avatars, and due dates, add task button per column. Dark theme. Use realistic task names.${VISUAL_SUFFIX}`],
    [/landing|saas|startup|product page/i,
      `${p}. Build a complete SaaS landing page with: fixed navbar (logo + nav + CTA), hero section (90vh, radial glow, huge gradient headline, subtitle, 2 CTA buttons, stats row), features grid (6 cards with icons), pricing section (3 cards, middle highlighted with gradient border), testimonials grid, and footer. Dark theme.${VISUAL_SUFFIX}`],
  ];

  for (const [pattern, enhanced] of enhancements) {
    if (pattern.test(lower)) return enhanced;
  }

  // Generic enhancement
  if (p.length < 80) {
    return `${p}. Build a complete, production-quality UI with: a fixed navbar, hero section with gradient glow background, main content area with at least 10 items in a grid, and a footer. Use a modern dark theme.${VISUAL_SUFFIX}`;
  }

  // Always append visual suffix even to detailed prompts
  return `${p}${VISUAL_SUFFIX}`;
}

function injectTailwind(result: GeneratedResult): GeneratedResult {
  if (!result.html) return result;
  let html = result.html;
  if (!html.includes("tailwindcss")) {
    html = html.replace("</head>", `  <script src="https://cdn.tailwindcss.com"></script>\n</head>`);
  }
  if (!html.includes('class="dark"') && !html.includes("class='dark'")) {
    html = html.replace("<html", '<html class="dark"');
  }
  result.html = html;
  return result;
}

function extractJson(text: string): GeneratedResult {
  // Strip markdown fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim()) as GeneratedResult;
}

async function callOpenRouter(prompt: string): Promise<GeneratedResult> {
  const key = getOpenRouterKey();
  if (!key) throw new Error("No OPENROUTER_API_KEY");

  // Models — Claude first for best visual quality, GPT-4o as fallback
  const models = [
    { id: "anthropic/claude-3.5-sonnet:beta", json: false },
    { id: "openai/gpt-4o", json: true },
    { id: "openai/gpt-4o-mini", json: true },
  ];

  for (const model of models) {
    try {
      const body: Record<string, unknown> = {
        model: model.id,
        temperature: 0.5,
        max_tokens: 32000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `USER PROMPT: ${prompt}\n\nReturn ONLY valid JSON, no markdown fences.` },
        ],
      };

      // Only add response_format for models that support it
      if (model.json) {
        body.response_format = { type: "json_object" };
      }

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "BuildUI",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn(`OpenRouter ${model.id} failed ${res.status}:`, err.slice(0, 200));
        continue;
      }

      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content;
      if (!text) continue;

      const parsed = extractJson(text);
      if (!parsed.files || !parsed.html) continue;

      return injectTailwind(parsed);
    } catch (e) {
      console.warn(`OpenRouter ${model.id} error:`, e);
      continue;
    }
  }

  throw new Error("All OpenRouter models failed");
}

async function callGemini(prompt: string): Promise<GeneratedResult> {
  const key = getGeminiKey();
  if (!key) throw new Error("No GEMINI_API_KEY");

  const models = ["gemini-1.5-flash", "gemini-1.5-pro"];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUSER PROMPT: ${prompt}\n\nReturn ONLY valid JSON.` }] }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 16384,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (res.status === 429) { console.warn(`Gemini ${model} rate limited`); continue; }
      if (!res.ok) { console.warn(`Gemini ${model} failed: ${res.status}`); continue; }

      const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      const parsed = extractJson(text);
      if (!parsed.files || !parsed.html) continue;

      return injectTailwind(parsed);
    } catch (e) {
      console.warn(`Gemini ${model} error:`, e);
      continue;
    }
  }

  throw new Error("All Gemini models failed");
}

export async function generateCode(prompt: string): Promise<GeneratedResult> {
  const enhanced = enhancePrompt(prompt);

  // Retry up to 3 times with exponential backoff for 429s
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const wait = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
      await new Promise(r => setTimeout(r, wait));
    }

    try {
      return await callOpenRouter(enhanced);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429") && attempt < 2) {
        console.warn(`Rate limited, retrying in ${attempt + 1}s...`);
        continue;
      }
      console.error("OpenRouter failed:", e);
      break;
    }
  }

  // Fallback to Gemini
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
    try {
      return await callGemini(enhanced);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429") && attempt < 1) continue;
      console.error("Gemini failed:", e);
      break;
    }
  }

  throw new Error("Generation failed. Please try again in a moment.");
}
