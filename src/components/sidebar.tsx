"use client"

import React from "react"
import { motion, AnimatePresence } from "motion/react"
import { BrainIcon, PaintBrushIcon, MusicNoteIcon, TrendUpIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const analysisTypes = [
  {
    id: "personality",
    title: "Personality Profile",
    description: "Deep psychological analysis using Big Five model",
    icon: BrainIcon
  },
  {
    id: "creative",
    title: "Creative Assessment", 
    description: "Analyze creative decision-making patterns",
    icon: PaintBrushIcon
  },
  {
    id: "music",
    title: "Music Psychology",
    description: "Musical preferences and psychological traits",
    icon: MusicNoteIcon
  },
  {
    id: "label-insights",
    title: "Label Insights",
    description: "Artist analysis for record label understanding",
    icon: TrendUpIcon
  }
]

export function Sidebar() {
  const {
    sessions,
    currentSession,
    sidebarOpen,
    setSidebarOpen,
    createNewSession,
    setCurrentSession,
    deleteSession
  } = useAppStore()

  const handleNewSession = (type: any) => {
    createNewSession(type)
  }

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    deleteSession(sessionId)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Mobile Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed left-0 top-0 z-40 h-screen w-80 bg-zinc-800 border-r border-zinc-700 md:relative md:w-80"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-700">
                    <BrainIcon className="h-3 w-3 text-zinc-400" weight="fill" />
                  </div>
                  <div>
                    <h1 className="text-sm font-medium text-zinc-100">Siren Computer</h1>
                    <p className="text-xs text-zinc-400">Creative Intelligence</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="h-6 w-6 md:hidden text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700"
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>

              {/* New Analysis Section */}
              <div className="p-4">
                <h2 className="mb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Start New Analysis
                </h2>
                <div className="space-y-1">
                  {analysisTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <Button
                        key={type.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3 text-left hover:bg-zinc-700 border-0 text-zinc-300 hover:text-zinc-100"
                        onClick={() => handleNewSession(type.id)}
                      >
                        <Icon className="h-3 w-3 shrink-0 mr-3 text-zinc-400" weight="duotone" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-zinc-300">{type.title}</div>
                          <div className="text-xs text-zinc-500 truncate">
                            {type.description}
                          </div>
                        </div>
                        <PlusIcon className="h-2.5 w-2.5 text-zinc-500 ml-2" />
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="h-px bg-zinc-700 mx-4" />

              {/* Sessions List */}
              <div className="flex-1 overflow-hidden p-4">
                <h2 className="mb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Recent Sessions ({sessions.length})
                </h2>
                <ScrollArea className="h-full">
                  <div className="space-y-1">
                    {sessions.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-center">
                        <div className="space-y-2">
                          <p className="text-sm text-zinc-300">
                            No sessions yet
                          </p>
                          <p className="text-xs text-zinc-500">
                            Start a new analysis above
                          </p>
                        </div>
                      </div>
                    ) : (
                      sessions.map((session) => {
                        const isActive = currentSession?.id === session.id
                        const analysisType = analysisTypes.find(t => t.id === session.type)
                        const Icon = analysisType?.icon || BrainIcon
                        
                        return (
                          <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "group relative flex items-start gap-3 rounded-md p-3 transition-all cursor-pointer",
                              isActive 
                                ? "bg-zinc-700 border border-zinc-600" 
                                : "hover:bg-zinc-700/50 border border-transparent"
                            )}
                            onClick={() => setCurrentSession(session)}
                          >
                            <Icon 
                              className="h-3 w-3 shrink-0 mt-0.5 text-zinc-400"
                              weight="duotone"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium line-clamp-2 text-zinc-300">
                                {session.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-zinc-500">
                                  {formatDate(session.updatedAt)}
                                </span>
                                <span className="text-xs text-zinc-500">•</span>
                                <span className="text-xs text-zinc-500">
                                  {session.messages.length} messages
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-300 hover:bg-zinc-600"
                              onClick={(e) => handleDeleteSession(e, session.id)}
                            >
                              <TrashIcon className="h-2.5 w-2.5" />
                            </Button>
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Footer */}
              <div className="border-t border-zinc-700 p-4">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="h-1 w-1 rounded-full bg-zinc-400 animate-pulse" />
                  <span>Powered by Psyche Siren</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Multimodal psychology analysis for creatives
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}