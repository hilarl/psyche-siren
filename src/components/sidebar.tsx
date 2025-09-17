"use client"

import React from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  BrainIcon, 
  PaintBrushIcon, 
  MusicNoteIcon, 
  TrendUpIcon, 
  PlusIcon, 
  TrashIcon, 
  XIcon,
  WarningIcon,
  CheckCircleIcon
} from "@phosphor-icons/react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const analysisTypes = [
  {
    id: "personality",
    title: "Personality Profile",
    description: "Deep psychological pattern analysis through attachment theory and developmental psychology",
    icon: BrainIcon,
    color: "text-blue-400"
  },
  {
    id: "music",
    title: "Musical Psychology",
    description: "Emotional regulation, identity formation, and psychological connection through music",
    icon: MusicNoteIcon,
    color: "text-green-400"
  },
  {
    id: "creative",
    title: "Creative Psychology", 
    description: "Psychological foundations of creative expression and artistic development",
    icon: PaintBrushIcon,
    color: "text-purple-400"
  },
  {
    id: "label-insights",
    title: "Industry Insights",
    description: "Professional psychological dynamics for creative collaboration and leadership",
    icon: TrendUpIcon,
    color: "text-orange-400"
  }
]

// System health indicator
function SystemHealthIndicator({ score }: { score: number }) {
  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-400"
    if (score >= 70) return "text-yellow-400"
    return "text-red-400"
  }
  
  const getHealthIcon = (score: number) => {
    if (score >= 90) return CheckCircleIcon
    return WarningIcon
  }
  
  const HealthIcon = getHealthIcon(score)
  
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <div className={`flex items-center gap-1 text-xs ${getHealthColor(score)}`}>
      <HealthIcon className="h-3 w-3" />
      <span>{score}%</span>
    </div>
  )
}

// Session quality indicator
function SessionQualityIndicator({ session }: { session: any }) {
  const quality = session.conversationState?.response_quality_average || 100
  const violations = session.conversationState?.boundary_violations_count || 0
  
  if (process.env.NODE_ENV !== 'development') return null
  if (quality >= 90 && violations === 0) return null
  
  const getColor = (quality: number, violations: number) => {
    if (violations > 3 || quality < 60) return "text-red-400"
    if (violations > 1 || quality < 80) return "text-yellow-400"
    return "text-green-400"
  }
  
  return (
    <div className={`text-xs ${getColor(quality, violations)} opacity-75`}>
      Q:{Math.round(quality)}% {violations > 0 && `V:${violations}`}
    </div>
  )
}

export function Sidebar() {
  const {
    sessions,
    currentSession,
    sidebarOpen,
    setSidebarOpen,
    createNewSession,
    setCurrentSession,
    deleteSession,
    systemHealthScore,
    totalBoundaryViolations
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

  const getSessionTypeInfo = (type: string) => {
    return analysisTypes.find(t => t.id === type) || analysisTypes[0]
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
                    <p className="text-xs text-zinc-400">Psychology</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SystemHealthIndicator score={systemHealthScore} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="h-6 w-6 md:hidden text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700"
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Professional Analysis Types Section */}
              <div className="p-4">
                <div className="mb-4">
                  <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                   Analysis Types
                  </h2>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Choose your analytical focus. Each approach provides evidence-based psychological 
                    insights.
                  </p>
                </div>
                
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
                        <Icon className={`h-4 w-4 shrink-0 mr-3 ${type.color}`} weight="duotone" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-zinc-300">{type.title}</div>
                          <div className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                            {type.description}
                          </div>
                        </div>
                        <PlusIcon className="h-3 w-3 text-zinc-500 ml-2 shrink-0" />
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="h-px bg-zinc-700 mx-4" />

              {/* Sessions List */}
              <div className="flex-1 overflow-hidden p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Analysis Sessions ({sessions.length})
                  </h2>
                  {totalBoundaryViolations > 0 && process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-yellow-400 opacity-75">
                      {totalBoundaryViolations} violations
                    </div>
                  )}
                </div>
                
                <ScrollArea className="h-full">
                  <div className="space-y-1">
                    {sessions.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-center">
                        <div className="space-y-2">
                          <p className="text-sm text-zinc-300">
                            No analysis sessions yet
                          </p>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Begin professional psychological exploration by selecting an analysis type above
                          </p>
                        </div>
                      </div>
                    ) : (
                      sessions.map((session) => {
                        const isActive = currentSession?.id === session.id
                        const typeInfo = getSessionTypeInfo(session.type)
                        const Icon = typeInfo.icon
                        
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
                              className={`h-4 w-4 shrink-0 mt-0.5 ${typeInfo.color}`}
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
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-zinc-500 capitalize">
                                  {session.type.replace('-', ' ')}
                                </span>
                                <SessionQualityIndicator session={session} />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-300 hover:bg-zinc-600 shrink-0"
                              onClick={(e) => handleDeleteSession(e, session.id)}
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Professional Footer */}
              <div className="border-t border-zinc-700 p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <div className="h-1 w-1 rounded-full bg-zinc-400 animate-pulse" />
                    <span>Professional AI Psychology System</span>
                  </div>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-zinc-600 pt-1 border-t border-zinc-800">
                      Development Mode: Quality monitoring active
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}