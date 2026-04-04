import { AppError } from "@/lib/app-error";

const INTERNAL_HINTS = [
  "prisma",
  "database",
  "econn",
  "socket",
  "timeout",
  "fetch failed",
  "internal server",
  "all providers",
  "openrouter",
  "gemini",
];

function looksInternal(message: string) {
  const lower = message.toLowerCase();
  return INTERNAL_HINTS.some((h) => lower.includes(h));
}

export function getActionErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (!msg || looksInternal(msg) || msg.length > 220) {
      return "Something went wrong. Please try again.";
    }
    if (msg === "Unauthorized" || msg.toLowerCase().includes("unauthorized")) {
      return "Please sign in to continue.";
    }
    return msg;
  }
  return "Something went wrong. Please try again.";
}
