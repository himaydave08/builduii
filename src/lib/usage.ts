import { RateLimiterPrisma } from "rate-limiter-flexible";
import db from "./db";
import { auth } from "@clerk/nextjs/server";
import { AppError } from "@/lib/app-error";

const parsedInt = (value: string | undefined, fallback: number) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const FREE_POINTS = parsedInt(process.env.USAGE_FREE_POINTS, 200);
export const PRO_POINTS = parsedInt(process.env.USAGE_PRO_POINTS, 500);
export const DURATION = 30 * 24 * 60 * 60;
export const GENERATION_COST = 1;

function isRateLimiterRes(e: unknown): e is { remainingPoints: number; msBeforeNext: number } {
  return (
    typeof e === "object" &&
    e !== null &&
    "remainingPoints" in e &&
    "msBeforeNext" in e &&
    !(e instanceof Error)
  );
}

export async function getUsageTracker() {
  const { has } = await auth();
  const hasProAccess = has({ plan: "pro" });

  return new RateLimiterPrisma({
    storeClient: db,
    tableName: "Usage",
    points: hasProAccess ? PRO_POINTS : FREE_POINTS,
    duration: DURATION,
  });
}

export async function consumeCredits() {
  const { userId } = await auth();

  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Please sign in to continue.");
  }

  try {
    const usageTracker = await getUsageTracker();
    await usageTracker.consume(userId, GENERATION_COST);
  } catch (e: unknown) {
    if (e instanceof AppError) throw e;
    if (isRateLimiterRes(e)) {
      throw new AppError(
        "RATE_LIMIT",
        "You've reached your generation limit for now. Try again later or upgrade your plan."
      );
    }
    console.error("consumeCredits:", e);
    throw new AppError(
      "USAGE_ERROR",
      "We couldn't verify your usage. Please try again in a moment."
    );
  }
}

export async function getUsageStatus() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const usageTracker = await getUsageTracker();
    const result = await usageTracker.get(userId);
    return result ?? null;
  } catch (error) {
    console.error("Error getting usage:", error);
    return null;
  }
}
