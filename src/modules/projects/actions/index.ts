"use server"

import db from "@/lib/db"
import { MessageRole, MessageType } from "@/generated/prisma/enums"
import { generateSlug } from "random-word-slugs"
import { getCurrentUser } from "@/modules/auth/actions"
import { consumeCredits } from "@/lib/usage"
import { AppError } from "@/lib/app-error"
import { generateCode } from "@/lib/generate"

export const createProject = async (value: string) => {
  const user = await getCurrentUser()
  if (!user) throw new AppError("UNAUTHORIZED", "Please sign in to continue.")
  await consumeCredits()

  const newProject = await db.project.create({
    data: {
      name: generateSlug(2, { format: "kebab" }),
      userId: user.id,
      messages: {
        create: {
          content: value,
          role: MessageRole.USER,
          type: MessageType.RESULT,
        },
      },
    },
  })

  // Generate directly — no queue, instant result
  const generated = await generateCode(value)

  const sandboxUrl = generated.html
    ? `data:text/html;charset=utf-8,${encodeURIComponent(generated.html)}`
    : `data:text/html;charset=utf-8,${encodeURIComponent("<html><body style='background:#111;color:white;padding:2rem'><h1>Preview ready</h1></body></html>")}`

  await db.message.create({
    data: {
      projectId: newProject.id,
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
  })

  return newProject
}

export const getProjects = async () => {
  const user = await getCurrentUser()
  if (!user) throw new AppError("UNAUTHORIZED", "Please sign in to continue.")
  return db.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  })
}

export const getProjectById = async (projectId: string) => {
  const user = await getCurrentUser()
  if (!user) throw new AppError("UNAUTHORIZED", "Please sign in to continue.")
  const project = await db.project.findUnique({
    where: { id: projectId, userId: user.id },
  })
  if (!project) throw new AppError("NOT_FOUND", "Project not found.")
  return project
}
