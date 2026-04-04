# BuildUI — AI-Powered UI Generator

> Build stunning websites and apps by chatting with AI. Powered by Claude, Gemini, and Watermelon UI components.

![BuildUI](public/logo.svg)

## What is BuildUI?

BuildUI is an AI-powered UI generator that creates production-quality, pixel-perfect web interfaces from natural language prompts — similar to Lovable.dev and Bolt.new. Built for the Watermelon UI Hackathon.

## Features

- **AI UI Generation** — Describe any UI and get complete React + HTML output instantly
- **Multiple AI Models** — Claude 3.5 Sonnet, GPT-4o, Gemini 2.0 Flash with automatic fallback
- **Watermelon UI Components** — AI Input 002/005, Emoji Spree Chips, Run Action Button, Floating Disclosure, Pricing Section
- **Live Preview** — Instant HTML preview with Tailwind CSS
- **Code Export** — Full React/TypeScript source code
- **Authentication** — Google, GitHub, Discord via Clerk
- **Payments** — Razorpay integration for Pro/Business/Enterprise plans
- **Credits System** — 200 free generations per month
- **Stitch MCP** — Google design-to-code integration via MCP

## Tech Stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4
- **Auth** — Clerk (Google, GitHub, Discord)
- **Database** — Neon PostgreSQL + Prisma
- **AI** — OpenRouter (Claude/GPT-4o) + Google Gemini
- **Payments** — Razorpay
- **UI Components** — Shadcn UI + Watermelon UI
- **Animations** — Framer Motion
- **Background Jobs** — Inngest

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/himaydave08/buildui.git
cd buildui
```

### 2. Install dependencies

```bash
npm install
# or
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your API keys in `.env.local` (see `.env.example` for all required variables).

### 4. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server

```bash
npx next dev --port 3000
```

### 6. Run Inngest dev server (in a separate terminal)

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest --no-discovery
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

See `.env.example` for all required environment variables.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `OPENROUTER_API_KEY` | OpenRouter API key (Claude/GPT-4o) |
| `E2b_API_KEY` | E2B Code Interpreter key |
| `RAZORPAY_KEY_ID` | Razorpay test/live key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key (frontend) |

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Deploy

## License

MIT
