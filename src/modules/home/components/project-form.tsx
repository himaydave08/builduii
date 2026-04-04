"use client"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'
import { useCreateProject } from '@/modules/projects/hooks/project'
import { getActionErrorMessage } from '@/lib/action-error'
import { AiInput005, ThinkingMode } from '@/components/watermelon/ai-input-005'
import type { MessageInput } from '@/components/watermelon/ai-input-005'

const PROJECT_TEMPLATES = [
  { id: '1', label: 'Netflix clone', emoji: '🎬', prompt: 'Build a Netflix-style homepage with a hero banner (use a nice, dark-mode compatible gradient here), movie sections, responsive cards, and a modal for viewing details using mock data and local state. Use dark mode.' },
  { id: '2', label: 'Admin dashboard', emoji: '📦', prompt: 'Create an admin dashboard with a sidebar, stat cards, a chart placeholder, and a basic table with filter and pagination using local state. Modern professional look.' },
  { id: '3', label: 'Kanban board', emoji: '📋', prompt: 'Build a kanban board with columns (Todo, In Progress, Review, Done), task cards with priority badges, and add/remove task functionality using local state.' },
  { id: '4', label: 'File manager', emoji: '🗂️', prompt: 'Build a file manager with folder list, file grid, and options to rename or delete items using mock data and local state.' },
  { id: '5', label: 'YouTube clone', emoji: '📺', prompt: 'Build a YouTube-style homepage with mock video thumbnails, a category sidebar, and a modal preview with title and description using local state.' },
  { id: '6', label: 'Store page', emoji: '🛍️', prompt: 'Build a store page with category filters, a product grid, and local cart logic to add and remove items.' },
  { id: '7', label: 'Airbnb clone', emoji: '🏡', prompt: 'Build an Airbnb-style listings grid with mock data, filter sidebar, and a modal with property details using local state.' },
  { id: '8', label: 'Spotify clone', emoji: '🎵', prompt: 'Build a Spotify-style music player with a sidebar for playlists, a main area for song details, and playback controls. Use dark mode.' },
  { id: '9', label: 'Chat app', emoji: '💬', prompt: 'Build a modern chat application with a contacts sidebar, message thread, and message input. Use local state for messages. Dark theme.' },
  { id: '10', label: 'Portfolio', emoji: '🧑‍💻', prompt: 'Build a developer portfolio with hero section, skills grid, projects showcase, and contact form. Modern dark theme.' },
  { id: '11', label: 'Landing page', emoji: '🚀', prompt: 'Build a SaaS landing page with hero, features section, pricing cards, testimonials, and CTA. Modern dark theme.' },
  { id: '12', label: 'Blog', emoji: '📝', prompt: 'Build a blog homepage with featured post hero, article grid, categories sidebar, and newsletter signup. Clean modern design.' },
]

const ProjectForm = () => {
  const router = useRouter()
  const { mutateAsync, isPending } = useCreateProject()
  const [messages, setMessages] = useState<MessageInput[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const handleSend = async (content: string, _mode: ThinkingMode) => {
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content,
    }])
    try {
      const res = await mutateAsync(content)
      router.push(`/projects/${res.id}`)
      toast.success("Project created successfully")
    } catch (error) {
      toast.error(getActionErrorMessage(error))
      setMessages((prev) => prev.slice(0, -1))
    }
  }

  const handleChipClick = (template: typeof PROJECT_TEMPLATES[0]) => {
    setSelected(template.id)
    handleSend(template.prompt, ThinkingMode.NORMAL)
  }

  return (
    <div className="space-y-6">
      {/* Watermelon-style chips */}
      <div className="flex flex-wrap gap-2 justify-center">
        {PROJECT_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleChipClick(t)}
            disabled={isPending}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              selected === t.id
                ? 'border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800'
                : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800'
            }`}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or describe your own idea
          </span>
        </div>
      </div>

      <div className="h-[420px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-lg">
        <AiInput005
          messages={messages}
          onSend={handleSend}
          isProcessing={isPending}
        />
      </div>
    </div>
  )
}

export default ProjectForm
