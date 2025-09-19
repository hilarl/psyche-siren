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
  CheckCircleIcon,
  FileTextIcon,
  ImageIcon,
  SpeakerHighIcon,
  CameraIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  Question
} from "@phosphor-icons/react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as Popover from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"

const analysisTypes = [
  {
    id: "personality",
    title: "Personality Modeling",
    description: "Comprehensive psychological analysis combining audio, visual, document, and conversational data for deep personality insights and predictive modeling",
    icon: BrainIcon,
    color: "text-zinc-400",
    capabilities: [
      { icon: SpeakerHighIcon, label: "Audio Psychology" },
      { icon: ImageIcon, label: "Visual Analysis" },
      { icon: FileTextIcon, label: "Document Analysis" },
      { icon: MicrophoneIcon, label: "Voice Patterns" },
      { icon: CameraIcon, label: "Camera Capture" },
      { icon: VideoCameraIcon, label: "Video Recording" }
    ],
    supportedFiles: ["Audio files (MP3, WAV, M4A)", "Images/Videos (JPEG, PNG, MP4, WebM)", "Documents (PDF, Word, TXT, MD)", "Live recording & camera capture"]
  },
  {
    id: "music", 
    title: "Audio Analysis",
    description: "Musical psychology, emotional regulation, and psychological connection through audio with advanced audio feature analysis and creative insights",
    icon: MusicNoteIcon,
    color: "text-zinc-400",
    capabilities: [
      { icon: SpeakerHighIcon, label: "Audio Analysis" },
      { icon: MicrophoneIcon, label: "Recording" }
    ],
    supportedFiles: ["Audio files (MP3, WAV, M4A)", "Live audio recording"]
  },
  {
    id: "visual",
    title: "Visual Analysis",
    description: "Image and video psychology, aesthetic preferences, visual creativity patterns with camera integration and real-time capture capabilities",
    icon: PaintBrushIcon,
    color: "text-zinc-400",
    capabilities: [
      { icon: ImageIcon, label: "Image Analysis" },
      { icon: VideoCameraIcon, label: "Video Analysis" },
      { icon: CameraIcon, label: "Live Capture" }
    ],
    supportedFiles: ["Images (JPEG, PNG, WebP)", "Videos (MP4, WebM, MOV)", "Live camera capture & recording"]
  },
  {
    id: "label-insights",
    title: "Industry Insights",
    description: "Professional psychological dynamics for creative collaboration, leadership development, and strategic market positioning in creative industries",
    icon: TrendUpIcon,
    color: "text-zinc-400",
    capabilities: [
      { icon: FileTextIcon, label: "Industry Analysis" }
    ],
    supportedFiles: ["Text conversations", "Document analysis"]
  }
]

// System health indicator
function SystemHealthIndicator({ score }: { score: number }) {
  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-indigo-400"
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
    return "text-indigo-400"
  }
  
  return (
    <div className={`text-xs ${getColor(quality, violations)} opacity-75`}>
      Q:{Math.round(quality)}% {violations > 0 && `V:${violations}`}
    </div>
  )
}

// Analysis type popover content
function AnalysisTypeInfo({ type }: { type: typeof analysisTypes[0] }) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-zinc-200 mb-1">{type.title}</h4>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {type.description}
        </p>
      </div>

      <div>
        <h5 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
          Capabilities
        </h5>
        <div className="flex flex-wrap gap-1">
          {type.capabilities.map((capability, index) => {
            const CapabilityIcon = capability.icon
            return (
              <div 
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-full"
              >
                <CapabilityIcon className="h-2.5 w-2.5 text-zinc-500" />
                <span className="text-xs text-zinc-400">{capability.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h5 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
          Supported Content
        </h5>
        <div className="space-y-1">
          {type.supportedFiles.map((fileType, index) => (
            <div key={index} className="text-xs text-zinc-500">
              • {fileType}
            </div>
          ))}
        </div>
      </div>
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
    console.log('Creating new session with type:', type)
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
                    <h1 className="text-sm font-medium text-zinc-100">Siren Intelligence</h1>
                    <p className="text-xs text-zinc-400">Multimodal Psychology</p>
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

              {/* Enhanced Analysis Types Section */}
              <div className="p-4">
                <div className="mb-4">
                  <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Analysis Modes
                  </h2>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Choose your analytical approach. Each mode provides specialized psychological insights 
                    with multimodal data integration capabilities.
                  </p>
                </div>
                
                <div className="space-y-2">
                  {analysisTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <div key={type.id} className="relative">
                        <div
                          className="w-full justify-start h-auto p-3 text-left hover:bg-zinc-700 border-0 text-zinc-300 hover:text-zinc-100 group cursor-pointer rounded-md transition-colors"
                          onClick={() => handleNewSession(type.id)}
                        >
                          <div className="w-full">
                            {/* Header with icon, title, and help button */}
                            <div className="flex items-center gap-3 mb-2">
                              <Icon className={`h-4 w-4 shrink-0 ${type.color}`} weight="duotone" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-zinc-300">{type.title}</div>
                                  <Popover.Root>
                                    <Popover.Trigger asChild>
                                      <button
                                        className="h-4 w-4 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-sm flex items-center justify-center border-none bg-transparent"
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label="Analysis type information"
                                      >
                                        <Question className="h-3 w-3" />
                                      </button>
                                    </Popover.Trigger>
                                    <Popover.Portal>
                                      <Popover.Content 
                                        side="right" 
                                        align="start"
                                        className="bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-md p-4 shadow-lg z-50"
                                        sideOffset={5}
                                      >
                                        <AnalysisTypeInfo type={type} />
                                      </Popover.Content>
                                    </Popover.Portal>
                                  </Popover.Root>
                                </div>
                                <div className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                                  {type.description}
                                </div>
                              </div>
                              <PlusIcon className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 mt-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      </div>
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
                            Begin professional psychological exploration by selecting an analysis mode above. 
                            Try <strong>Multimodal Personality Modeling</strong> for comprehensive insights.
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
                              <div className="flex items-start justify-between mb-1">
                                <div className="text-sm font-medium line-clamp-2 text-zinc-300 flex-1 mr-2">
                                  {session.title}
                                </div>
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
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500 capitalize">
                                    {session.type.replace('-', ' ')}
                                  </span>
                                  {session.type === 'personality' && (
                                    <div className="flex items-center gap-0.5">
                                      <SpeakerHighIcon className="h-2.5 w-2.5 text-indigo-400" />
                                      <ImageIcon className="h-2.5 w-2.5 text-purple-400" />
                                      <FileTextIcon className="h-2.5 w-2.5 text-green-400" />
                                    </div>
                                  )}
                                  {session.type === 'music' && (
                                    <SpeakerHighIcon className="h-2.5 w-2.5 text-indigo-400" />
                                  )}
                                  {session.type === 'visual' && (
                                    <ImageIcon className="h-2.5 w-2.5 text-purple-400" />
                                  )}
                                </div>
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

              {/* Enhanced Professional Footer */}
              <div className="border-t border-zinc-700 p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <div className="h-1 w-1 rounded-full bg-zinc-400 animate-pulse" />
                    <span>Professional Multimodal AI Psychology System</span>
                  </div>
                  <div className="text-xs text-zinc-600">
                    Advanced personality modeling through audio, visual, document, and conversational analysis
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}