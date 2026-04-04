"use server";

import { MessageRole, MessageType } from "@/generated/prisma/enums";
import db from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/actions";
import { consumeCredits } from "@/lib/usage";
import { AppError } from "@/lib/app-error";
import { generateCode } from "@/lib/generate";

export const createMessage = async (value: string, projectId: string) => {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Please sign in to continue.");

  const project = await db.project.findUnique({
    where: { id: projectId, userId: user.id },
  });
  if (!project) throw new AppError("NOT_FOUND", "Project not found.");

  await consumeCredits();

  const newMessage = await db.message.create({
    data: {
      projectId: project.id,
      content: value,
      role: MessageRole.USER,
      type: MessageType.RESULT,
    },
  });

  // Generate directly — no queue, instant result
  const generated = await generateCode(value);

  const sandboxUrl = generated.html
    ? `data:text/html;charset=utf-8,${encodeURIComponent(generated.html)}`
    : `data:text/html;charset=utf-8,${encodeURIComponent("<html><body style='background:#111;color:white;padding:2rem'><h1>Preview ready</h1></body></html>")}`;

  await db.message.create({
    data: {
      projectId: project.id,
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

  return newMessage;
};

export const getMessages = async (projectId: string) => {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Please sign in to continue.");

  const project = await db.project.findUnique({
    where: { id: projectId, userId: user.id },
  });
  if (!project) throw new AppError("NOT_FOUND", "Project not found.");

  return db.message.findMany({
    where: { projectId: project.id },
    orderBy: { updatedAt: "asc" },
    include: { fragments: true },
  });
};
