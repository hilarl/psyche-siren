"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  PaperPlaneRight, 
  Image as ImageIcon, 
  X, 
  Brain,
  User,
  Sparkle,
  CircleNotch,
  WarningCircle,
  Microphone,
  MusicNote,
  Play,
  Pause,
  Stop,
  Upload,
  Waveform,
  TrashSimple,
  Eye,
  EyeSlash,
  Camera,
  Video,
  Record,
  FileText,
  FilePdf,
  FileDoc,
  FileMd,
  FileIcon,
  Palette
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  cn, 
  isValidImageFile, 
  isValidVideoFile,
  fileToBase64, 
  PSYCHE_SIREN_PROMPTS,
  CONVERSATION_STARTERS,
  validatePsychologyAnalysis,
  createSafeAnalysisResponse,
  correctAnalysisLanguage,
  createAnalysisPrompt
} from "@/lib/utils"

// Audio file types
interface AudioFile {
  file: File
  name: string
  duration?: number
  url: string
  analysisResult?: AudioAnalysisResult
}

interface AudioAnalysisResult {
  tempo?: number
  key?: string
  mood?: string
  energy?: number
  valence?: number
  genres?: string[]
  instruments?: string[]
  summary?: string
  danceability?: number
  acousticness?: number
  speechiness?: number
  liveness?: number
  loudness?: number
}

// Visual file types
interface VisualFile {
  file: File
  name: string
  type: 'image' | 'video'
  url: string
  duration?: number
  analysisResult?: VisualAnalysisResult
}

interface VisualAnalysisResult {
  dominant_colors?: string[]
  composition_style?: string
  emotional_tone?: string
  art_movement?: string
  visual_complexity?: number
  symbolic_elements?: string[]
  cultural_markers?: string[]
  psychological_themes?: string[]
  aesthetic_preference?: string
  creative_maturity?: string
  summary?: string
}

// Document file types - NEW
interface DocumentFile {
  file: File
  name: string
  type: 'pdf' | 'txt' | 'doc' | 'docx' | 'md' | 'other'
  url: string
  size: number
  pageCount?: number
  analysisResult?: DocumentAnalysisResult
}

interface DocumentAnalysisResult {
  emotional_tone?: string
  communication_style?: string
  personality_indicators?: string[]
  cognitive_patterns?: string[]
  themes?: string[]
  writing_complexity?: number
  formality_level?: string
  creativity_markers?: string[]
  psychological_insights?: string[]
  summary?: string
  word_count?: number
  page_count?: number
  language_patterns?: {
    sentence_length_avg?: number
    vocabulary_complexity?: string
    punctuation_style?: string
    paragraph_structure?: string
  }
}

// File validation utilities
function isValidAudioFile(file: File): boolean {
  const validTypes = [
    'audio/mp3', 'audio/mpeg', 
    'audio/wav', 'audio/wave',
    'audio/m4a', 'audio/mp4',
    'audio/aac', 'audio/ogg', 
    'audio/webm', 'audio/flac'
  ]
  const maxSize = 50 * 1024 * 1024 // 50MB
  return validTypes.includes(file.type) && file.size <= maxSize
}

function isValidVisualFile(file: File): boolean {
  return isValidImageFile(file) || isValidVideoFile(file)
}

function isValidDocumentFile(file: File): boolean {
  const validTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
    'text/rtf'
  ]
  const maxSize = 25 * 1024 * 1024 // 25MB
  return validTypes.includes(file.type) && file.size <= maxSize
}

function getDocumentType(file: File): 'pdf' | 'txt' | 'doc' | 'docx' | 'md' | 'other' {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type === 'text/plain') return 'txt'
  if (file.type === 'text/markdown') return 'md'
  if (file.type === 'application/msword') return 'doc'
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx'
  return 'other'
}

// Enhanced markdown formatter
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
}

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <div className="text-sm whitespace-pre-wrap text-zinc-300">{content}</div>
  }

  return (
    <div 
      className="text-sm prose prose-sm max-w-none text-zinc-300 prose-zinc"
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  )
}

// Enhanced Audio playback component
function AudioMessageDisplay({ audioFiles }: { audioFiles: AudioFile[] }) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<number[]>([])
  const [duration, setDuration] = useState<number[]>([])
  const audioElementsRef = useRef<(HTMLAudioElement | null)[]>([])

  useEffect(() => {
    setCurrentTime(new Array(audioFiles.length).fill(0))
    setDuration(new Array(audioFiles.length).fill(0))
  }, [audioFiles.length])

  useEffect(() => {
    audioElementsRef.current.forEach((audio, index) => {
      if (audio) {
        const updateTime = () => {
          setCurrentTime(prev => {
            const newTimes = [...prev]
            newTimes[index] = audio.currentTime
            return newTimes
          })
        }

        const updateDuration = () => {
          setDuration(prev => {
            const newDurations = [...prev]
            newDurations[index] = audio.duration
            return newDurations
          })
        }

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('durationchange', updateDuration)

        return () => {
          audio.removeEventListener('timeupdate', updateTime)
          audio.removeEventListener('loadedmetadata', updateDuration)
          audio.removeEventListener('durationchange', updateDuration)
        }
      }
    })
  }, [audioFiles])

  const togglePlayback = (index: number) => {
    const audio = audioElementsRef.current[index]
    if (!audio) return

    if (playingIndex === index) {
      audio.pause()
      setPlayingIndex(null)
    } else {
      audioElementsRef.current.forEach((el, i) => {
        if (el && i !== index) {
          el.pause()
        }
      })
      
      audio.play()
      setPlayingIndex(index)
      
      audio.addEventListener('ended', () => {
        setPlayingIndex(null)
      }, { once: true })
    }
  }

  const handleSeek = (index: number, seekTime: number) => {
    const audio = audioElementsRef.current[index]
    if (audio) {
      audio.currentTime = seekTime
    }
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2 mt-3">
      {audioFiles.map((audioFile, index) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-800 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => togglePlayback(index)}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            {playingIndex === index ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <MusicNote className="h-4 w-4 text-zinc-500" />
          
          <div className="flex-1 min-w-0">
            <div className="text-sm text-zinc-300 truncate font-medium">
              {audioFile.name.replace(/\.[^/.]+$/, "")}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-500 tabular-nums min-w-[35px]">
                {formatTime(currentTime[index] || 0)}
              </span>
              
              <div className="flex-1 group cursor-pointer">
                <div 
                  className="relative h-1 bg-zinc-700 rounded-full overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const clickPosition = (e.clientX - rect.left) / rect.width
                    const seekTime = clickPosition * (duration[index] || 0)
                    handleSeek(index, seekTime)
                  }}
                >
                  <div 
                    className="absolute left-0 top-0 h-full bg-indigo-400 rounded-full transition-all group-hover:bg-indigo-300"
                    style={{ 
                      width: duration[index] ? `${(currentTime[index] / duration[index]) * 100}%` : '0%' 
                    }}
                  />
                  
                  <div className="absolute inset-0 bg-zinc-600 opacity-0 group-hover:opacity-30 rounded-full transition-opacity" />
                  
                  <div 
                    className="absolute top-1/2 w-3 h-3 bg-indigo-400 rounded-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    style={{ 
                      left: duration[index] ? `calc(${(currentTime[index] / duration[index]) * 100}% - 6px)` : '-6px' 
                    }}
                  />
                </div>
              </div>
              
              <span className="text-xs text-zinc-500 tabular-nums min-w-[35px]">
                {formatTime(duration[index] || audioFile.duration || 0)}
              </span>
            </div>
            
            {audioFile.analysisResult && (
              <div className="mt-2 flex flex-wrap gap-1">
                {audioFile.analysisResult.mood && (
                  <span className="px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded-full text-xs">
                    {audioFile.analysisResult.mood}
                  </span>
                )}
                {audioFile.analysisResult.tempo && (
                  <span className="px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded-full text-xs">
                    {audioFile.analysisResult.tempo} BPM
                  </span>
                )}
                {audioFile.analysisResult.key && (
                  <span className="px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded-full text-xs">
                    Key: {audioFile.analysisResult.key}
                  </span>
                )}
              </div>
            )}
          </div>

          <audio
            ref={(el) => {
              audioElementsRef.current[index] = el
            }}
            src={audioFile.url}
            preload="metadata"
          />
        </div>
      ))}
    </div>
  )
}

// Visual message display component
function VisualMessageDisplay({ visualFiles }: { visualFiles: VisualFile[] }) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const videoElementsRef = useRef<(HTMLVideoElement | null)[]>([])

  const toggleVideoPlayback = (index: number) => {
    const video = videoElementsRef.current[index]
    if (!video) return

    if (playingIndex === index) {
      video.pause()
      setPlayingIndex(null)
    } else {
      videoElementsRef.current.forEach((el, i) => {
        if (el && i !== index) {
          el.pause()
        }
      })
      
      video.play()
      setPlayingIndex(index)
      
      video.addEventListener('ended', () => {
        setPlayingIndex(null)
      }, { once: true })
    }
  }

  return (
    <div className="space-y-2 mt-3">
      {visualFiles.map((visualFile, index) => (
        <div key={index} className="p-3 bg-zinc-800/50 border border-zinc-800 rounded-lg">
          {visualFile.type === 'image' ? (
            <img
              src={visualFile.url}
              alt={visualFile.name}
              className="w-full max-h-64 object-cover rounded border border-zinc-700"
            />
          ) : (
            <div className="relative">
              <video
                ref={(el) => {
                  videoElementsRef.current[index] = el
                }}
                src={visualFile.url}
                className="w-full max-h-64 object-cover rounded border border-zinc-700"
                controls={false}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleVideoPlayback(index)}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-12 w-12 bg-black/50 hover:bg-black/70 text-white"
              >
                {playingIndex === index ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
            </div>
          )}
          
          <div className="mt-2">
            <div className="text-sm text-zinc-300 font-medium">{visualFile.name}</div>
            
            {visualFile.analysisResult && (
              <div className="mt-2 flex flex-wrap gap-1">
                {visualFile.analysisResult.emotional_tone && (
                  <span className="px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded-full text-xs">
                    {visualFile.analysisResult.emotional_tone}
                  </span>
                )}
                {visualFile.analysisResult.composition_style && (
                  <span className="px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded-full text-xs">
                    {visualFile.analysisResult.composition_style}
                  </span>
                )}
                {visualFile.analysisResult.aesthetic_preference && (
                  <span className="px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded-full text-xs">
                    {visualFile.analysisResult.aesthetic_preference}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// NEW: Document message display component
function DocumentMessageDisplay({ documentFiles }: { documentFiles: DocumentFile[] }) {
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return FilePdf
      case 'doc':
      case 'docx':
        return FileDoc
      case 'md':
        return FileMd
      case 'txt':
        return FileText
      default:
        return FileIcon
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-2 mt-3">
      {documentFiles.map((documentFile, index) => {
        const IconComponent = getDocumentIcon(documentFile.type)
        
        return (
          <div key={index} className="p-3 bg-zinc-800/50 border border-zinc-800 rounded-lg">
            <div className="flex items-start gap-3">
              <IconComponent className="h-8 w-8 text-zinc-400 flex-shrink-0 mt-1" />
              
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-300 font-medium truncate">
                  {documentFile.name}
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                  <span>{formatFileSize(documentFile.size)}</span>
                  <span>•</span>
                  <span>{documentFile.type.toUpperCase()}</span>
                  {documentFile.pageCount && (
                    <>
                      <span>•</span>
                      <span>{documentFile.pageCount} pages</span>
                    </>
                  )}
                </div>
                
                {/* Analysis Results */}
                {documentFile.analysisResult && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-zinc-400">Document Psychology Analysis:</div>
                    
                    {/* Core Analysis Tags */}
                    <div className="flex flex-wrap gap-1">
                      {documentFile.analysisResult.emotional_tone && (
                        <span className="px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded-full text-xs">
                          {documentFile.analysisResult.emotional_tone}
                        </span>
                      )}
                      {documentFile.analysisResult.communication_style && (
                        <span className="px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded-full text-xs">
                          {documentFile.analysisResult.communication_style}
                        </span>
                      )}
                      {documentFile.analysisResult.formality_level && (
                        <span className="px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded-full text-xs">
                          {documentFile.analysisResult.formality_level}
                        </span>
                      )}
                    </div>

                    {/* Personality Indicators */}
                    {documentFile.analysisResult.personality_indicators && documentFile.analysisResult.personality_indicators.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {documentFile.analysisResult.personality_indicators.slice(0, 3).map((indicator, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">
                            {indicator}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Themes */}
                    {documentFile.analysisResult.themes && documentFile.analysisResult.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {documentFile.analysisResult.themes.slice(0, 3).map((theme, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs">
                            {theme}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Summary */}
                    {documentFile.analysisResult.summary && (
                      <div className="text-xs text-zinc-500 mt-2">
                        {documentFile.analysisResult.summary}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Enhanced Audio Context Panel
function AudioContextPanel({ 
  audioFiles, 
  onRemoveAudio, 
  onClearAll, 
  isContextActive, 
  onToggleContext 
}: { 
  audioFiles: AudioFile[]
  onRemoveAudio: (index: number) => void
  onClearAll: () => void
  isContextActive: boolean
  onToggleContext: () => void
}) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<number[]>([])
  const [duration, setDuration] = useState<number[]>([])
  const audioElementsRef = useRef<(HTMLAudioElement | null)[]>([])

  useEffect(() => {
    setCurrentTime(new Array(audioFiles.length).fill(0))
    setDuration(new Array(audioFiles.length).fill(0))
  }, [audioFiles.length])

  useEffect(() => {
    audioElementsRef.current.forEach((audio, index) => {
      if (audio) {
        const updateTime = () => {
          setCurrentTime(prev => {
            const newTimes = [...prev]
            newTimes[index] = audio.currentTime
            return newTimes
          })
        }

        const updateDuration = () => {
          setDuration(prev => {
            const newDurations = [...prev]
            newDurations[index] = audio.duration
            return newDurations
          })
        }

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('durationchange', updateDuration)

        return () => {
          audio.removeEventListener('timeupdate', updateTime)
          audio.removeEventListener('loadedmetadata', updateDuration)
          audio.removeEventListener('durationchange', updateDuration)
        }
      }
    })
  }, [audioFiles])

  const togglePlayback = (index: number) => {
    const audio = audioElementsRef.current[index]
    if (!audio) return

    if (playingIndex === index) {
      audio.pause()
      setPlayingIndex(null)
    } else {
      audioElementsRef.current.forEach((el, i) => {
        if (el && i !== index) {
          el.pause()
        }
      })
      
      audio.play()
      setPlayingIndex(index)
      
      audio.addEventListener('ended', () => {
        setPlayingIndex(null)
      }, { once: true })
    }
  }

  const handleSeek = (index: number, seekTime: number) => {
    const audio = audioElementsRef.current[index]
    if (audio) {
      audio.currentTime = seekTime
    }
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (audioFiles.length === 0) return null

  return (
    <div className="mb-4 bg-zinc-900/80 border border-zinc-800 rounded-lg">
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Waveform className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-300 font-medium">Audio Context</span>
            <span className="px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded-full text-xs">
              {audioFiles.length} file{audioFiles.length > 1 ? 's' : ''}
            </span>
          </div>
          {isContextActive && (
            <div className="flex items-center gap-1 text-xs text-indigo-400">
              <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <span>Active in conversation</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleContext}
            className={cn(
              "text-xs px-2 py-1 h-6",
              isContextActive 
                ? "text-indigo-400 hover:text-indigo-300 bg-indigo-400/10 hover:bg-indigo-400/20" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {isContextActive ? (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Visible
              </>
            ) : (
              <>
                <EyeSlash className="h-3 w-3 mr-1" />
                Hidden
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 h-6"
          >
            <TrashSimple className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
        {audioFiles.map((audioFile, index) => (
          <div key={index} className="group relative">
            <div className="flex items-center gap-3 p-2 bg-zinc-800/50 border border-zinc-800 rounded-md hover:bg-zinc-800/70 hover:border-zinc-700 transition-all">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePlayback(index)}
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors flex-shrink-0"
              >
                {playingIndex === index ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MusicNote className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-300 truncate font-medium">
                    {audioFile.name.replace(/\.[^/.]+$/, "")}
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-zinc-500 tabular-nums text-xs">
                      {formatTime(currentTime[index] || 0)}
                    </span>
                    
                    <div className="flex-1 group cursor-pointer">
                      <div 
                        className="relative h-0.5 bg-zinc-700 rounded-full overflow-hidden"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const clickPosition = (e.clientX - rect.left) / rect.width
                          const seekTime = clickPosition * (duration[index] || 0)
                          handleSeek(index, seekTime)
                        }}
                      >
                        <div 
                          className="absolute left-0 top-0 h-full bg-indigo-400 rounded-full transition-all group-hover:bg-indigo-300"
                          style={{ 
                            width: duration[index] ? `${(currentTime[index] / duration[index]) * 100}%` : '0%' 
                          }}
                        />
                        <div className="absolute inset-0 bg-zinc-600 opacity-0 group-hover:opacity-30 rounded-full transition-opacity" />
                      </div>
                    </div>
                    
                    <span className="text-xs text-zinc-500 tabular-nums text-xs">
                      {formatTime(duration[index] || audioFile.duration || 0)}
                    </span>
                  </div>
                  
                  {audioFile.analysisResult && (
                    <div className="text-xs text-zinc-500 mt-0.5">• Analyzed</div>
                  )}
                </div>
              </div>

              {audioFile.analysisResult && (
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {audioFile.analysisResult.mood && (
                    <span className="px-1.5 py-0.5 bg-zinc-700/50 text-zinc-400 rounded text-xs">
                      {audioFile.analysisResult.mood}
                    </span>
                  )}
                  {audioFile.analysisResult.tempo && (
                    <span className="px-1.5 py-0.5 bg-zinc-700/50 text-zinc-400 rounded text-xs">
                      {audioFile.analysisResult.tempo}
                    </span>
                  )}
                  {audioFile.analysisResult.key && (
                    <span className="px-1.5 py-0.5 bg-zinc-700/50 text-zinc-400 rounded text-xs">
                      {audioFile.analysisResult.key}
                    </span>
                  )}
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveAudio(index)}
                className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <audio
              ref={(el) => {
                audioElementsRef.current[index] = el
              }}
              src={audioFile.url}
              preload="metadata"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Visual Context Panel
function VisualContextPanel({ 
  visualFiles, 
  onRemoveVisual, 
  onClearAll, 
  isContextActive, 
  onToggleContext 
}: { 
  visualFiles: VisualFile[]
  onRemoveVisual: (index: number) => void
  onClearAll: () => void
  isContextActive: boolean
  onToggleContext: () => void
}) {
  if (visualFiles.length === 0) return null

  return (
    <div className="mb-4 bg-zinc-900/80 border border-zinc-800 rounded-lg">
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-300 font-medium">Visual Context</span>
            <span className="px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded-full text-xs">
              {visualFiles.length} file{visualFiles.length > 1 ? 's' : ''}
            </span>
          </div>
          {isContextActive && (
            <div className="flex items-center gap-1 text-xs text-purple-400">
              <div className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-pulse" />
              <span>Active in conversation</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleContext}
            className={cn(
              "text-xs px-2 py-1 h-6",
              isContextActive 
                ? "text-purple-400 hover:text-purple-300 bg-purple-400/10 hover:bg-purple-400/20" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {isContextActive ? (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Visible
              </>
            ) : (
              <>
                <EyeSlash className="h-3 w-3 mr-1" />
                Hidden
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 h-6"
          >
            <TrashSimple className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
        {visualFiles.map((visualFile, index) => (
          <div key={index} className="group relative">
            <div className="flex items-center gap-3 p-2 bg-zinc-800/50 border border-zinc-800 rounded-md hover:bg-zinc-800/70 hover:border-zinc-700 transition-all">
              <div className="flex-shrink-0">
                {visualFile.type === 'image' ? (
                  <img
                    src={visualFile.url}
                    alt={visualFile.name}
                    className="w-12 h-12 object-cover rounded border border-zinc-700"
                  />
                ) : (
                  <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center">
                    <Video className="h-4 w-4 text-zinc-500" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-300 truncate font-medium">
                  {visualFile.name.replace(/\.[^/.]+$/, "")}
                </div>
                {visualFile.analysisResult && (
                  <div className="text-xs text-zinc-500 mt-0.5">• Analyzed</div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveVisual(index)}
                className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// NEW: Document Context Panel
function DocumentContextPanel({ 
  documentFiles, 
  onRemoveDocument, 
  onClearAll, 
  isContextActive, 
  onToggleContext 
}: { 
  documentFiles: DocumentFile[]
  onRemoveDocument: (index: number) => void
  onClearAll: () => void
  isContextActive: boolean
  onToggleContext: () => void
}) {
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return FilePdf
      case 'doc':
      case 'docx':
        return FileDoc
      case 'md':
        return FileMd
      case 'txt':
        return FileText
      default:
        return FileIcon
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (documentFiles.length === 0) return null

  return (
    <div className="mb-4 bg-zinc-900/80 border border-zinc-800 rounded-lg">
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-300 font-medium">Document Context</span>
            <span className="px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded-full text-xs">
              {documentFiles.length} file{documentFiles.length > 1 ? 's' : ''}
            </span>
          </div>
          {isContextActive && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
              <span>Active in conversation</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleContext}
            className={cn(
              "text-xs px-2 py-1 h-6",
              isContextActive 
                ? "text-green-400 hover:text-green-300 bg-green-400/10 hover:bg-green-400/20" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {isContextActive ? (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Visible
              </>
            ) : (
              <>
                <EyeSlash className="h-3 w-3 mr-1" />
                Hidden
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 h-6"
          >
            <TrashSimple className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
        {documentFiles.map((documentFile, index) => {
          const IconComponent = getDocumentIcon(documentFile.type)
          
          return (
            <div key={index} className="group relative">
              <div className="flex items-center gap-3 p-2 bg-zinc-800/50 border border-zinc-800 rounded-md hover:bg-zinc-800/70 hover:border-zinc-700 transition-all">
                <IconComponent className="h-6 w-6 text-zinc-400 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-300 truncate font-medium">
                    {documentFile.name.replace(/\.[^/.]+$/, "")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                    <span>{formatFileSize(documentFile.size)}</span>
                    <span>•</span>
                    <span>{documentFile.type.toUpperCase()}</span>
                    {documentFile.analysisResult && (
                      <>
                        <span>•</span>
                        <span>Analyzed</span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveDocument(index)}
                  className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Development quality indicator
function ResponseQualityIndicator({ score, issues }: { score: number; issues: string[] }) {
  if (process.env.NODE_ENV !== 'development' || score >= 90) return null
  
  return (
    <div className="flex items-center gap-1 text-xs text-zinc-500">
      <WarningCircle className="h-3 w-3" />
      <span>Analysis Quality: {score}% ({issues.length} issues)</span>
    </div>
  )
}

export function Chat() {
  const {
    currentSession,
    isGenerating,
    setIsGenerating,
    inputText,
    setInputText,
    selectedImages,
    addSelectedImage,
    removeSelectedImage,
    clearSelectedImages,
    addMessage,
    updateLastMessage
  } = useAppStore()

  // Enhanced multimodal state with persistence and context control
  const [persistentAudioFiles, setPersistentAudioFiles] = useState<AudioFile[]>([])
  const [audioContextActive, setAudioContextActive] = useState(true)
  
  const [persistentVisualFiles, setPersistentVisualFiles] = useState<VisualFile[]>([])
  const [visualContextActive, setVisualContextActive] = useState(true)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isVideoRecording, setIsVideoRecording] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  
  // NEW: Document state
  const [persistentDocumentFiles, setPersistentDocumentFiles] = useState<DocumentFile[]>([])
  const [documentContextActive, setDocumentContextActive] = useState(true)
  
  const [lastResponseQuality, setLastResponseQuality] = useState<{score: number, issues: string[]} | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioFileInputRef = useRef<HTMLInputElement>(null)
  const visualFileInputRef = useRef<HTMLInputElement>(null)
  const videoFileInputRef = useRef<HTMLInputElement>(null)
  const documentFileInputRef = useRef<HTMLInputElement>(null) // NEW
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  
  // Camera refs
  const cameraVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Check session types
  const isPersonalityModeling = currentSession?.type === 'personality'
  const isMusicPsychology = currentSession?.type === 'music'
  const isVisualAnalysis = currentSession?.type === 'visual'

  // Enhanced analysis functions
  const analyzeAudio = async (file: File): Promise<AudioAnalysisResult | undefined> => {
    try {
      setIsAnalyzing(true)
      const formData = new FormData()
      formData.append('audio', file)

      const response = await fetch('/api/siren/audio', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        console.warn(`Audio analysis failed: ${response.status} - continuing without analysis`)
        toast.warning('Audio analysis unavailable - audio will still be available for playback')
        return undefined
      }

      const result = await response.json()
      
      const enhancedResult: AudioAnalysisResult = {
        tempo: result.analysis?.tempo,
        key: result.analysis?.key,
        mood: result.analysis?.mood,
        energy: result.analysis?.energy,
        valence: result.analysis?.valence,
        genres: result.analysis?.genres || [],
        instruments: result.analysis?.instruments || [],
        summary: result.analysis?.summary,
        danceability: result.analysis?.danceability,
        acousticness: result.analysis?.acousticness,
        speechiness: result.analysis?.speechiness,
        liveness: result.analysis?.liveness,
        loudness: result.analysis?.loudness
      }
      
      return enhancedResult
    } catch (error) {
      console.warn('Audio analysis error:', error)
      toast.warning('Audio analysis unavailable - audio will still be available for playback')
      return undefined
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeVisual = async (file: File): Promise<VisualAnalysisResult | undefined> => {
    try {
      setIsAnalyzing(true)
      const formData = new FormData()
      formData.append('visual', file)

      const response = await fetch('/api/siren/visual', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        console.warn(`Visual analysis failed: ${response.status} - continuing without analysis`)
        toast.warning('Visual analysis unavailable - visual content will still be available')
        return undefined
      }

      const result = await response.json()
      
      const enhancedResult: VisualAnalysisResult = {
        dominant_colors: result.analysis?.dominant_colors || [],
        composition_style: result.analysis?.composition_style,
        emotional_tone: result.analysis?.emotional_tone,
        art_movement: result.analysis?.art_movement,
        visual_complexity: result.analysis?.visual_complexity,
        symbolic_elements: result.analysis?.symbolic_elements || [],
        cultural_markers: result.analysis?.cultural_markers || [],
        psychological_themes: result.analysis?.psychological_themes || [],
        aesthetic_preference: result.analysis?.aesthetic_preference,
        creative_maturity: result.analysis?.creative_maturity,
        summary: result.analysis?.summary
      }
      
      return enhancedResult
    } catch (error) {
      console.warn('Visual analysis error:', error)
      toast.warning('Visual analysis unavailable - visual content will still be available')
      return undefined
    } finally {
      setIsAnalyzing(false)
    }
  }

  // NEW: Document analysis function
  const analyzeDocument = async (file: File): Promise<DocumentAnalysisResult | undefined> => {
    try {
      setIsAnalyzing(true)
      const formData = new FormData()
      formData.append('document', file)

      const response = await fetch('/api/siren/document', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        console.warn(`Document analysis failed: ${response.status} - continuing without analysis`)
        toast.warning('Document analysis unavailable - document will still be available for reference')
        return undefined
      }

      const result = await response.json()
      
      const enhancedResult: DocumentAnalysisResult = {
        emotional_tone: result.analysis?.emotional_tone,
        communication_style: result.analysis?.communication_style,
        personality_indicators: result.analysis?.personality_indicators || [],
        cognitive_patterns: result.analysis?.cognitive_patterns || [],
        themes: result.analysis?.themes || [],
        writing_complexity: result.analysis?.writing_complexity,
        formality_level: result.analysis?.formality_level,
        creativity_markers: result.analysis?.creativity_markers || [],
        psychological_insights: result.analysis?.psychological_insights || [],
        summary: result.analysis?.summary,
        word_count: result.analysis?.word_count,
        page_count: result.analysis?.page_count,
        language_patterns: result.analysis?.language_patterns
      }
      
      return enhancedResult
    } catch (error) {
      console.warn('Document analysis error:', error)
      toast.warning('Document analysis unavailable - document will still be available for reference')
      return undefined
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Enhanced file handlers
  const handleAudioFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    for (const file of files) {
      if (isValidAudioFile(file)) {
        if (persistentAudioFiles.length < 5) {
          const url = URL.createObjectURL(file)
          
          const audio = new Audio(url)
          const duration = await new Promise<number>((resolve) => {
            audio.addEventListener('loadedmetadata', () => {
              resolve(audio.duration)
            })
          })

          const analysisResult = await analyzeAudio(file)

          const audioFile: AudioFile = {
            file,
            name: file.name,
            duration,
            url,
            analysisResult
          }
          
          setPersistentAudioFiles(prev => [...prev, audioFile])
          toast.success(`Audio file added - analysis ${analysisResult ? 'completed' : 'unavailable but audio available for playback'}`)
        } else {
          toast.error("Maximum 5 audio files allowed in context")
        }
      } else {
        toast.error(`Invalid file: ${file.name}. Please select an audio file under 50MB.`)
      }
    }

    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = ""
    }
  }

  const handleVisualFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    for (const file of files) {
      if (isValidVisualFile(file)) {
        if (persistentVisualFiles.length < 5) {
          const url = URL.createObjectURL(file)
          const type = file.type.startsWith('image/') ? 'image' : 'video'
          
          let duration: number | undefined = undefined
          
          if (type === 'video') {
            const video = document.createElement('video')
            video.src = url
            duration = await new Promise<number>((resolve) => {
              video.addEventListener('loadedmetadata', () => {
                resolve(video.duration)
              })
            })
          }

          const analysisResult = await analyzeVisual(file)

          const visualFile: VisualFile = {
            file,
            name: file.name,
            type,
            url,
            duration,
            analysisResult
          }
          
          setPersistentVisualFiles(prev => [...prev, visualFile])
          toast.success(`${type === 'image' ? 'Image' : 'Video'} added - analysis ${analysisResult ? 'completed' : 'unavailable but content available'}`)
        } else {
          toast.error("Maximum 5 visual files allowed")
        }
      } else {
        toast.error(`Invalid file: ${file.name}. Please select an image or video file.`)
      }
    }

    if (visualFileInputRef.current) {
      visualFileInputRef.current.value = ""
    }
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = ""
    }
  }

  // NEW: Document file handler
  const handleDocumentFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    for (const file of files) {
      if (isValidDocumentFile(file)) {
        if (persistentDocumentFiles.length < 10) { // Allow more documents
          const url = URL.createObjectURL(file)
          const type = getDocumentType(file)

          const analysisResult = await analyzeDocument(file)

          const documentFile: DocumentFile = {
            file,
            name: file.name,
            type,
            url,
            size: file.size,
            pageCount: analysisResult?.page_count,
            analysisResult
          }
          
          setPersistentDocumentFiles(prev => [...prev, documentFile])
          toast.success(`Document added - analysis ${analysisResult ? 'completed' : 'unavailable but document available for reference'}`)
        } else {
          toast.error("Maximum 10 documents allowed")
        }
      } else {
        toast.error(`Invalid file: ${file.name}. Please select a PDF, Word doc, or text file under 25MB.`)
      }
    }

    if (documentFileInputRef.current) {
      documentFileInputRef.current.value = ""
    }
  }

  // Camera control functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 },
        audio: false
      })
      setCameraStream(mediaStream)
      setIsCameraActive(true)
      
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = mediaStream
      }
      
      toast.success("Camera started")
    } catch (error) {
      console.error('Camera access error:', error)
      toast.error("Camera access denied or unavailable")
    }
  }

  const startVideoRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 },
        audio: true
      })
      setCameraStream(mediaStream)
      setIsCameraActive(true)
      
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = mediaStream
      }

      const mediaRecorder = new MediaRecorder(mediaStream)
      mediaRecorderRef.current = mediaRecorder
      recordedChunksRef.current = []

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      })

      mediaRecorder.addEventListener('stop', async () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const file = Object.assign(videoBlob, {
          name: `video-recording-${Date.now()}.webm`,
          lastModified: Date.now()
        }) as File
        
        const url = URL.createObjectURL(videoBlob)

        const video = document.createElement('video')
        video.src = url
        const duration = await new Promise<number>((resolve) => {
          video.addEventListener('loadedmetadata', () => {
            resolve(video.duration)
          })
        })

        const analysisResult = await analyzeVisual(file)

        const visualFile: VisualFile = {
          file,
          name: file.name,
          type: 'video',
          url,
          duration,
          analysisResult
        }

        setPersistentVisualFiles(prev => [...prev, visualFile])
        stopCamera()
        toast.success("Video recorded, analyzed, and added to context")
      })

      mediaRecorder.start()
      setIsVideoRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast.success("Video recording started")
    } catch (error) {
      console.error('Video recording error:', error)
      toast.error("Camera/microphone access denied or unavailable")
    }
  }

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isVideoRecording) {
      mediaRecorderRef.current.stop()
      setIsVideoRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const capturePhoto = async () => {
    if (!cameraStream || !cameraVideoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = cameraVideoRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    ctx.drawImage(video, 0, 0)
    
    canvas.toBlob(async (imageBlob) => {
      if (imageBlob) {
        const file = Object.assign(imageBlob, {
          name: `photo-capture-${Date.now()}.jpg`,
          lastModified: Date.now()
        }) as File
        
        const url = URL.createObjectURL(imageBlob)

        const analysisResult = await analyzeVisual(file)

        const visualFile: VisualFile = {
          file,
          name: file.name,
          type: 'image',
          url,
          analysisResult
        }

        setPersistentVisualFiles(prev => [...prev, visualFile])
        stopCamera()
        toast.success("Photo captured, analyzed, and added to context")
      }
    }, 'image/jpeg', 0.9)
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
      setIsCameraActive(false)
      setIsVideoRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  // Remove functions
  const removePersistentAudioFile = (index: number) => {
    const audioFile = persistentAudioFiles[index]
    if (audioFile?.url) {
      URL.revokeObjectURL(audioFile.url)
    }
    setPersistentAudioFiles(prev => prev.filter((_, i) => i !== index))
    toast.success("Audio file removed from context")
  }

  const removePersistentVisualFile = (index: number) => {
    const visualFile = persistentVisualFiles[index]
    if (visualFile?.url) {
      URL.revokeObjectURL(visualFile.url)
    }
    setPersistentVisualFiles(prev => prev.filter((_, i) => i !== index))
    toast.success("Visual file removed from context")
  }

  // NEW: Remove document function
  const removePersistentDocumentFile = (index: number) => {
    const documentFile = persistentDocumentFiles[index]
    if (documentFile?.url) {
      URL.revokeObjectURL(documentFile.url)
    }
    setPersistentDocumentFiles(prev => prev.filter((_, i) => i !== index))
    toast.success("Document removed from context")
  }

  // Clear functions
  const clearAllAudioContext = () => {
    persistentAudioFiles.forEach(audioFile => {
      if (audioFile.url) {
        URL.revokeObjectURL(audioFile.url)
      }
    })
    setPersistentAudioFiles([])
    setAudioContextActive(true)
    toast.success("Audio context cleared")
  }

  const clearAllVisualContext = () => {
    persistentVisualFiles.forEach(visualFile => {
      if (visualFile.url) {
        URL.revokeObjectURL(visualFile.url)
      }
    })
    setPersistentVisualFiles([])
    setVisualContextActive(true)
    toast.success("Visual context cleared")
  }

  // NEW: Clear document context
  const clearAllDocumentContext = () => {
    persistentDocumentFiles.forEach(documentFile => {
      if (documentFile.url) {
        URL.revokeObjectURL(documentFile.url)
      }
    })
    setPersistentDocumentFiles([])
    setDocumentContextActive(true)
    toast.success("Document context cleared")
  }

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      recordedChunksRef.current = []

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      })

      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        const file = Object.assign(audioBlob, {
          name: `recording-${Date.now()}.webm`,
          lastModified: Date.now()
        }) as File
        
        const url = URL.createObjectURL(audioBlob)

        const analysisResult = await analyzeAudio(file)

        const audioFile: AudioFile = {
          file,
          name: file.name,
          url,
          analysisResult
        }

        setPersistentAudioFiles(prev => [...prev, audioFile])
        stream.getTracks().forEach(track => track.stop())
        toast.success(`Recording saved - analysis ${analysisResult ? 'completed' : 'unavailable but audio available for playback'}`)
      })

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast.success("Recording started")
    } catch (error) {
      console.error('Recording error:', error)
      toast.error("Microphone access denied or unavailable")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Enhanced context creation for multimodal analysis
  const createEnhancedAudioContext = (audioFiles: AudioFile[]): string => {
    if (!audioContextActive || audioFiles.length === 0) return ""
    
    const analysisTexts = audioFiles.map((audio, index) => {
      if (audio.analysisResult) {
        const analysis = audio.analysisResult
        let analysisText = `\n[Audio ${index + 1}: ${audio.name}]\n`
        
        const coreElements = []
        if (analysis.mood) coreElements.push(`Mood: ${analysis.mood}`)
        if (analysis.tempo) coreElements.push(`Tempo: ${analysis.tempo} BPM`)
        if (analysis.key) coreElements.push(`Key: ${analysis.key}`)
        if (analysis.energy !== undefined) coreElements.push(`Energy: ${Math.round(analysis.energy * 100)}%`)
        if (analysis.valence !== undefined) coreElements.push(`Positivity: ${Math.round(analysis.valence * 100)}%`)
        
        if (coreElements.length > 0) {
          analysisText += `Core Elements: ${coreElements.join(', ')}\n`
        }
        
        const advancedElements = []
        if (analysis.danceability !== undefined) advancedElements.push(`Danceability: ${Math.round(analysis.danceability * 100)}%`)
        if (analysis.acousticness !== undefined) advancedElements.push(`Acoustic: ${Math.round(analysis.acousticness * 100)}%`)
        if (analysis.speechiness !== undefined) advancedElements.push(`Speech: ${Math.round(analysis.speechiness * 100)}%`)
        if (analysis.liveness !== undefined) advancedElements.push(`Live Performance: ${Math.round(analysis.liveness * 100)}%`)
        if (analysis.loudness !== undefined) advancedElements.push(`Loudness: ${analysis.loudness} dB`)
        
        if (advancedElements.length > 0) {
          analysisText += `Audio Features: ${advancedElements.join(', ')}\n`
        }
        
        if (analysis.genres && analysis.genres.length > 0) {
          analysisText += `Genres: ${analysis.genres.join(', ')}\n`
        }
        
        if (analysis.instruments && analysis.instruments.length > 0) {
          analysisText += `Instrumentation: ${analysis.instruments.join(', ')}\n`
        }
        
        if (analysis.summary) {
          analysisText += `Summary: ${analysis.summary}\n`
        }
        
        return analysisText
      }
      return `\n[Audio ${index + 1}: ${audio.name}]\n(Analysis unavailable)\n`
    }).join('')
    
    return `\n\n╔══ AUDIO CONTEXT ACTIVE ═══╗\nThe user has uploaded ${audioFiles.length} audio file${audioFiles.length > 1 ? 's' : ''} for psychological analysis:${analysisTexts}\n╔══ PSYCHOLOGICAL ANALYSIS GUIDANCE ═══╗\nConsider these musical elements when providing psychological insights:\n- How the musical characteristics reflect their emotional state and creative psychology\n- Connections between audio features (energy, valence, mood) and their psychological patterns\n- How their musical choices reveal personality traits, cultural influences, or creative identity\n- What the combination of technical and emotional elements suggests about their artistic development\n╚══ END AUDIO CONTEXT ═══╝\n`
  }

  const createEnhancedVisualContext = (visualFiles: VisualFile[]): string => {
    if (!visualContextActive || visualFiles.length === 0) return ""
    
    const analysisTexts = visualFiles.map((visual, index) => {
      if (visual.analysisResult) {
        const analysis = visual.analysisResult
        let analysisText = `\n[Visual ${index + 1}: ${visual.name} - ${visual.type}]\n`
        
        const coreElements = []
        if (analysis.emotional_tone) coreElements.push(`Emotion: ${analysis.emotional_tone}`)
        if (analysis.composition_style) coreElements.push(`Style: ${analysis.composition_style}`)
        if (analysis.aesthetic_preference) coreElements.push(`Aesthetic: ${analysis.aesthetic_preference}`)
        if (analysis.visual_complexity !== undefined) coreElements.push(`Complexity: ${analysis.visual_complexity}/10`)
        
        if (coreElements.length > 0) {
          analysisText += `Visual Elements: ${coreElements.join(', ')}\n`
        }
        
        if (analysis.dominant_colors && analysis.dominant_colors.length > 0) {
          analysisText += `Colors: ${analysis.dominant_colors.join(', ')}\n`
        }
        
        if (analysis.psychological_themes && analysis.psychological_themes.length > 0) {
          analysisText += `Psychological Themes: ${analysis.psychological_themes.join(', ')}\n`
        }
        
        if (analysis.cultural_markers && analysis.cultural_markers.length > 0) {
          analysisText += `Cultural Markers: ${analysis.cultural_markers.join(', ')}\n`
        }
        
        if (analysis.summary) {
          analysisText += `Summary: ${analysis.summary}\n`
        }
        
        return analysisText
      }
      return `\n[Visual ${index + 1}: ${visual.name} - ${visual.type}]\n(Analysis unavailable)\n`
    }).join('')
    
    return `\n\n╔══ VISUAL CONTEXT ACTIVE ═══╗\nThe user has uploaded ${visualFiles.length} visual file${visualFiles.length > 1 ? 's' : ''} for psychological analysis:${analysisTexts}\n╔══ PSYCHOLOGICAL ANALYSIS GUIDANCE ═══╗\nConsider these visual elements when providing psychological insights:\n- How the visual choices reflect their aesthetic psychology and creative identity\n- Connections between colors, composition, and emotional expression\n- How their visual preferences reveal personality traits and cultural influences\n- What the visual complexity and themes suggest about their creative development\n╚══ END VISUAL CONTEXT ═══╝\n`
  }

  // NEW: Document context creation
  const createEnhancedDocumentContext = (documentFiles: DocumentFile[]): string => {
    if (!documentContextActive || documentFiles.length === 0) return ""
    
    const analysisTexts = documentFiles.map((document, index) => {
      if (document.analysisResult) {
        const analysis = document.analysisResult
        let analysisText = `\n[Document ${index + 1}: ${document.name} - ${document.type}]\n`
        
        const coreElements = []
        if (analysis.emotional_tone) coreElements.push(`Tone: ${analysis.emotional_tone}`)
        if (analysis.communication_style) coreElements.push(`Style: ${analysis.communication_style}`)
        if (analysis.formality_level) coreElements.push(`Formality: ${analysis.formality_level}`)
        if (analysis.writing_complexity !== undefined) coreElements.push(`Complexity: ${analysis.writing_complexity}/10`)
        
        if (coreElements.length > 0) {
          analysisText += `Writing Elements: ${coreElements.join(', ')}\n`
        }
        
        if (analysis.personality_indicators && analysis.personality_indicators.length > 0) {
          analysisText += `Personality Indicators: ${analysis.personality_indicators.join(', ')}\n`
        }
        
        if (analysis.cognitive_patterns && analysis.cognitive_patterns.length > 0) {
          analysisText += `Cognitive Patterns: ${analysis.cognitive_patterns.join(', ')}\n`
        }
        
        if (analysis.themes && analysis.themes.length > 0) {
          analysisText += `Themes: ${analysis.themes.join(', ')}\n`
        }
        
        if (analysis.summary) {
          analysisText += `Summary: ${analysis.summary}\n`
        }
        
        return analysisText
      }
      return `\n[Document ${index + 1}: ${document.name} - ${document.type}]\n(Analysis unavailable)\n`
    }).join('')
    
    return `\n\n╔══ DOCUMENT CONTEXT ACTIVE ═══╗\nThe user has uploaded ${documentFiles.length} document${documentFiles.length > 1 ? 's' : ''} for psychological analysis:${analysisTexts}\n╔══ PSYCHOLOGICAL ANALYSIS GUIDANCE ═══╗\nConsider these writing elements when providing psychological insights:\n- How their writing style reflects their cognitive patterns and personality structure\n- Connections between communication patterns and psychological development\n- How their document themes reveal core values, goals, and psychological motivations\n- What the writing complexity and formality suggest about their intellectual and emotional maturity\n╚══ END DOCUMENT CONTEXT ═══╝\n`
  }

  // Validation function
  const validateAnalysisResponse = (response: string, userMessage: string): boolean => {
    const violations = validatePsychologyAnalysis(response, userMessage)
    
    if (process.env.NODE_ENV === 'development') {
      const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 20)
      setLastResponseQuality({ score, issues: violations })
    }
    
    const criticalViolations = violations.filter(v => v.includes('CRITICAL'))
    if (criticalViolations.length > 0) {
      console.error('CRITICAL Analysis Violations:', criticalViolations)
      
      const correctedResponse = correctAnalysisLanguage(response)
      
      const stillViolating = validatePsychologyAnalysis(correctedResponse, userMessage).filter(v => v.includes('CRITICAL'))
      if (stillViolating.length > 0) {
        const safeResponse = createSafeAnalysisResponse(userMessage, violations)
        updateLastMessage(safeResponse)
        toast.error("Response corrected for professional boundaries")
        return false
      } else {
        updateLastMessage(correctedResponse)
        toast.warning("Response auto-corrected for professional language")
        return true
      }
    }
    
    if (violations.length > 0) {
      console.warn('Analysis Quality Issues:', violations)
      const improvedResponse = correctAnalysisLanguage(response)
      updateLastMessage(improvedResponse)
    }
    
    return true
  }

  const sendMessage = async (messageContent?: string) => {
    const contentToSend = messageContent || inputText.trim()
    
    if (!contentToSend && selectedImages.length === 0 && 
        (!audioContextActive || persistentAudioFiles.length === 0) && 
        (!visualContextActive || persistentVisualFiles.length === 0) &&
        (!documentContextActive || persistentDocumentFiles.length === 0)) return
    if (!currentSession) return

    const images = selectedImages
    const contextAudioFiles = audioContextActive ? persistentAudioFiles : []
    const contextVisualFiles = visualContextActive ? persistentVisualFiles : []
    const contextDocumentFiles = documentContextActive ? persistentDocumentFiles : [] // NEW

    setInputText("")
    clearSelectedImages()
    setLastResponseQuality(null)

    const imageBase64s = await Promise.all(
      images.map(file => fileToBase64(file))
    )

    // Enhanced multimodal context
    const audioContext = createEnhancedAudioContext(contextAudioFiles)
    const visualContext = createEnhancedVisualContext(contextVisualFiles)
    const documentContext = createEnhancedDocumentContext(contextDocumentFiles) // NEW
    const combinedContext = audioContext + visualContext + documentContext // ENHANCED

    // Add user message with all multimodal files for display
    addMessage({
      role: "user",
      content: contentToSend,
      images: imageBase64s,
      audioFiles: contextAudioFiles,
      visualFiles: contextVisualFiles,
      documentFiles: contextDocumentFiles // NEW
    })

    setIsGenerating(true)

    try {
      const systemPrompt = PSYCHE_SIREN_PROMPTS[
        currentSession.type === "personality" ? "PERSONALITY_PROFILE" :
        currentSession.type === "creative" ? "CREATIVE_ASSESSMENT" :
        currentSession.type === "music" ? "MUSIC_PSYCHOLOGY" :
        currentSession.type === "visual" ? "VISUAL_ANALYSIS" :
        "LABEL_INSIGHTS"
      ]

      let messages = []
      
      if (currentSession.messages.length === 1) {
        const analysisPrompt = createAnalysisPrompt(systemPrompt, contentToSend + combinedContext, currentSession.type)
        messages.push({
          role: "user",
          content: analysisPrompt,
          images: imageBase64s
        })
      } else {
        const recentMessages = currentSession.messages.slice(-6)
        
        recentMessages.slice(0, -1).forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content
          })
        })
        
        const contextualPrompt = combinedContext 
          ? `Continue psychological analysis considering the uploaded files. Provide 2-3 sentence analysis using psychological frameworks, then ask ONE strategic question.\n\nUSER: ${contentToSend}${combinedContext}`
          : `Continue psychological analysis. Provide 2-3 sentence analysis using psychological frameworks, then ask ONE strategic question.\n\nUSER: ${contentToSend}`
          
        messages.push({
          role: "user", 
          content: contextualPrompt,
          images: imageBase64s
        })
      }

      const hasMultimodalContent = contextAudioFiles.length > 0 || contextVisualFiles.length > 0 || contextDocumentFiles.length > 0
      const requestBody = {
        messages,
        max_tokens: hasMultimodalContent ? 500 : 300, // More tokens for multimodal analysis
        temperature: 1.0,       
        top_p: 0.95,           
        top_k: 64,             
        min_p: 0.0,            
        do_sample: true,       
        repetition_penalty: 1.0, 
        stream: false
      }

      addMessage({
        role: "assistant",
        content: ""
      })

      const response = await fetch("/api/psychology", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.choices && data.choices[0]?.message?.content) {
        const aiResponse = data.choices[0].message.content
        
        if (validateAnalysisResponse(aiResponse, contentToSend)) {
          if (!lastResponseQuality || lastResponseQuality.score >= 90) {
            updateLastMessage(aiResponse)
          }
        }
        
      } else {
        throw new Error("Invalid response format")
      }

    } catch (error) {
      console.error("Error in psychological analysis:", error)
      
      const errorResponse = "I'm having difficulty with the analysis right now. Could you share a bit more context about what you'd like to explore?"
      updateLastMessage(errorResponse)
      toast.error("Analysis connection issue - please try again")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    files.forEach(file => {
      if (isValidImageFile(file)) {
        if (selectedImages.length < 5) {
          addSelectedImage(file)
        } else {
          toast.error("Maximum 5 images allowed")
        }
      } else {
        toast.error(`Invalid file: ${file.name}. Please select an image file under 10MB.`)
      }
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSuggestionSelect = (suggestion: string) => {
    sendMessage(suggestion)
  }

  // Cleanup URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      persistentAudioFiles.forEach(audioFile => {
        if (audioFile.url) {
          URL.revokeObjectURL(audioFile.url)
        }
      })
      persistentVisualFiles.forEach(visualFile => {
        if (visualFile.url) {
          URL.revokeObjectURL(visualFile.url)
        }
      })
      persistentDocumentFiles.forEach(documentFile => { // NEW
        if (documentFile.url) {
          URL.revokeObjectURL(documentFile.url)
        }
      })
    }
  }, [persistentAudioFiles, persistentVisualFiles, persistentDocumentFiles])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentSession?.messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`
    }
  }, [inputText])

  // Clear context when session changes
  useEffect(() => {
    if (currentSession?.type !== 'music' && persistentAudioFiles.length > 0) {
      clearAllAudioContext()
    }
    if (currentSession?.type !== 'visual' && persistentVisualFiles.length > 0) {
      clearAllVisualContext()
    }
    // Documents are available for all session types, so don't auto-clear
  }, [currentSession?.id])

  if (!currentSession) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-6">
          <Brain className="h-8 w-8 mx-auto text-zinc-600" />
          <div>
            <h2 className="text-lg font-medium text-zinc-300">Siren Intelligence System</h2>
            <p className="text-zinc-500 mt-2 text-sm leading-relaxed">
              Professional intelligence platform providing multimodal personality modeling, audio analysis, 
              visual analysis, document analysis, industry insights, and predictive modeling for artists, creators, and industry professionals.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-left">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Multimodal Analysis Capabilities:</h3>
            <div className="space-y-2 text-sm text-zinc-500">
              <div><strong className="text-zinc-400">Personality Modeling:</strong> MBTI, Big Five, attachment patterns, behavioral analysis across all media types</div>
              <div><strong className="text-zinc-400">Audio Analysis:</strong> Musical psychology, emotional regulation, creative decision-making</div>
              <div><strong className="text-zinc-400">Visual Analysis:</strong> Image psychology, aesthetic preferences, visual creativity patterns</div>
              <div><strong className="text-zinc-400">Document Analysis:</strong> Writing patterns, cognitive processing, personality indicators from text</div>
              <div><strong className="text-zinc-400">Industry Insights:</strong> Professional dynamics, collaboration optimization, market positioning</div>
              <div><strong className="text-zinc-400">Predictive Modeling:</strong> Career trajectory, audience response, creative development trends</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800">
              {isMusicPsychology ? (
                <MusicNote className="h-3 w-3 text-zinc-500" weight="fill" />
              ) : isVisualAnalysis ? (
                <ImageIcon className="h-3 w-3 text-zinc-500" weight="fill" />
              ) : isPersonalityModeling ? (
                <Brain className="h-3 w-3 text-zinc-500" weight="fill" />
              ) : (
                <Brain className="h-3 w-3 text-zinc-500" weight="fill" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-medium text-zinc-300">{currentSession.title}</h1>
              <p className="text-xs text-zinc-600">
                Intelligence Analysis • {currentSession.type.charAt(0).toUpperCase() + currentSession.type.slice(1).replace('-', ' ')}
                {isPersonalityModeling && " • Multimodal"}
                {isMusicPsychology && " • Audio Analysis"}
                {isVisualAnalysis && " • Visual Analysis"}
                {audioContextActive && persistentAudioFiles.length > 0 && (
                  <span className="text-indigo-400"> • Audio Context Active ({persistentAudioFiles.length})</span>
                )}
                {visualContextActive && persistentVisualFiles.length > 0 && (
                  <span className="text-purple-400"> • Visual Context Active ({persistentVisualFiles.length})</span>
                )}
                {documentContextActive && persistentDocumentFiles.length > 0 && ( // NEW
                  <span className="text-green-400"> • Document Context Active ({persistentDocumentFiles.length})</span>
                )}
              </p>
            </div>
          </div>
          
          {lastResponseQuality && (
            <ResponseQualityIndicator 
              score={lastResponseQuality.score} 
              issues={lastResponseQuality.issues} 
            />
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {currentSession.messages.length === 0 ? (
            <div className="text-center space-y-6 py-12">
              <Sparkle className="h-7 w-7 mx-auto text-zinc-600" />
              <div className="max-w-2xl mx-auto">
                <h3 className="text-base font-medium text-zinc-400">Ready for Multimodal Intelligence Analysis</h3>
                <p className="text-zinc-600 mt-2 text-sm">
                  {isPersonalityModeling 
                    ? "Upload audio, visual, and document files alongside text conversations for comprehensive multimodal personality modeling, behavioral analysis, and predictive insights"
                    : isMusicPsychology 
                      ? "Share musical experiences and upload audio files for comprehensive audio analysis, psychological modeling, and strategic insights"
                      : isVisualAnalysis
                        ? "Share visual work and upload images/videos for comprehensive visual analysis, aesthetic psychology, and creative insights"
                        : "Share your experiences for professional personality modeling, behavioral analysis, industry insights, and predictive modeling"
                  }
                </p>
                
                <div className="mt-6 space-y-3">
                  <p className="text-xs text-zinc-600 mb-4">
                    {(audioContextActive && persistentAudioFiles.length > 0) || 
                     (visualContextActive && persistentVisualFiles.length > 0) ||
                     (documentContextActive && persistentDocumentFiles.length > 0)
                      ? "Ask about your uploaded content:"
                      : isPersonalityModeling
                        ? "Multimodal analysis starting points:"
                        : "Analysis starting points:"
                    }
                  </p>
                  <div className="space-y-2 max-w-xl mx-auto">
                    {(audioContextActive && persistentAudioFiles.length > 0) || 
                     (visualContextActive && persistentVisualFiles.length > 0) ||
                     (documentContextActive && persistentDocumentFiles.length > 0) ? (
                      [
                        "What creative feedback can you give me on this content?",
                        "How can I improve the emotional impact of this work?",
                        "What psychological patterns do you see in my creative choices?",
                        "What does this content reveal about my artistic development?",
                        "How does this work reflect my creative psychology?",
                        "What strategic advice do you have for developing this further?"
                      ].map((starter, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuggestionSelect(starter)}
                          className="w-full text-left justify-start h-auto py-3 px-4 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-700 transition-all whitespace-normal"
                        >
                          <div className="text-xs leading-relaxed text-left w-full break-words">
                            {starter}
                          </div>
                        </Button>
                      ))
                    ) : (
                      [
                        ...Object.values(CONVERSATION_STARTERS).slice(0, 4),
                        ...Object.values(CONVERSATION_STARTERS).slice(4, 6)
                      ].map((starter, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuggestionSelect(starter)}
                          className="w-full text-left justify-start h-auto py-3 px-4 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-700 transition-all whitespace-normal"
                        >
                          <div className="text-xs leading-relaxed text-left w-full break-words">
                            {starter}
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <p className="text-xs text-zinc-600">
                    {isPersonalityModeling 
                      ? "Upload audio files, images/videos, documents (PDFs, Word docs, text files), capture photos/videos, or record audio to analyze multimodal personality patterns, receive comprehensive insights, and get strategic recommendations for personal and professional development."
                      : isMusicPsychology 
                        ? "Upload audio files or record music to analyze psychological connections, receive creative guidance, and get strategic insights for your musical projects."
                        : isVisualAnalysis
                          ? "Upload images/videos, capture photos, or record videos to analyze visual psychology, aesthetic preferences, creative patterns, and receive insights for your visual projects."
                          : "Describe your experiences, current projects, or creative challenges for psychological analysis, strategic advice, creative guidance, and predictive insights."
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {currentSession.messages.map((message, index) => (
                <motion.div
                  key={`${message.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-6 w-6 border border-zinc-800">
                      <AvatarFallback className="bg-zinc-800 text-zinc-500 text-xs">
                        PS
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[85%] md:max-w-[75%] rounded-lg px-4 py-3",
                      message.role === "user"
                        ? "bg-zinc-800 border border-zinc-700"
                        : "bg-zinc-900 border border-zinc-800"
                    )}
                  >
                    {message.images && message.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {message.images.map((image, idx) => (
                          <img
                            key={idx}
                            src={image}
                            alt={`Uploaded image ${idx + 1}`}
                            className="rounded-md max-h-48 object-cover border border-zinc-700"
                          />
                        ))}
                      </div>
                    )}

                    {message.audioFiles && message.audioFiles.length > 0 && (
                      <AudioMessageDisplay audioFiles={message.audioFiles} />
                    )}

                    {message.visualFiles && message.visualFiles.length > 0 && (
                      <VisualMessageDisplay visualFiles={message.visualFiles} />
                    )}

                    {message.documentFiles && message.documentFiles.length > 0 && ( // NEW
                      <DocumentMessageDisplay documentFiles={message.documentFiles} />
                    )}
                    
                    {message.content ? (
                      <MessageContent content={message.content} isUser={message.role === "user"} />
                    ) : (
                      message.role === "assistant" && isGenerating && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <CircleNotch className="h-3 w-3 animate-spin" />
                          <span>
                            {(audioContextActive && persistentAudioFiles.length > 0) || 
                             (visualContextActive && persistentVisualFiles.length > 0) ||
                             (documentContextActive && persistentDocumentFiles.length > 0)
                              ? "Analyzing multimodal psychological patterns with uploaded content..."
                              : "Analyzing psychological patterns..."
                            }
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-6 w-6 border border-zinc-800">
                      <AvatarFallback className="bg-zinc-800 text-xs">
                        <User className="h-3 w-3 text-zinc-500" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-zinc-800 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Selected Images Preview */}
          <AnimatePresence>
            {selectedImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Selected ${index + 1}`}
                        className="h-12 w-12 rounded-md object-cover border border-zinc-700"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full text-xs"
                        onClick={() => removeSelectedImage(index)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Context Panels */}
          <AudioContextPanel
            audioFiles={persistentAudioFiles}
            onRemoveAudio={removePersistentAudioFile}
            onClearAll={clearAllAudioContext}
            isContextActive={audioContextActive}
            onToggleContext={() => {
              setAudioContextActive(!audioContextActive)
              toast.success(audioContextActive ? "Audio context hidden from conversation" : "Audio context visible in conversation")
            }}
          />

          <VisualContextPanel
            visualFiles={persistentVisualFiles}
            onRemoveVisual={removePersistentVisualFile}
            onClearAll={clearAllVisualContext}
            isContextActive={visualContextActive}
            onToggleContext={() => {
              setVisualContextActive(!visualContextActive)
              toast.success(visualContextActive ? "Visual context hidden from conversation" : "Visual context visible in conversation")
            }}
          />

          {/* NEW: Document Context Panel */}
          <DocumentContextPanel
            documentFiles={persistentDocumentFiles}
            onRemoveDocument={removePersistentDocumentFile}
            onClearAll={clearAllDocumentContext}
            isContextActive={documentContextActive}
            onToggleContext={() => {
              setDocumentContextActive(!documentContextActive)
              toast.success(documentContextActive ? "Document context hidden from conversation" : "Document context visible in conversation")
            }}
          />

          {/* Camera Capture Section */}
          <AnimatePresence>
            {isCameraActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 mb-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-300">
                      {isVideoRecording ? "Recording Video" : "Camera Preview"}
                    </span>
                    {isVideoRecording && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-red-400 rounded-full animate-pulse" />
                        <span className="text-sm text-red-400 font-medium tabular-nums">
                          {formatTime(recordingTime)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isVideoRecording && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={capturePhoto}
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          <span className="text-xs">Photo</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={startVideoRecording}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          <Record className="h-4 w-4 mr-2" />
                          <span className="text-xs">Record</span>
                        </Button>
                      </>
                    )}
                    {isVideoRecording && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={stopVideoRecording}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Stop className="h-4 w-4 mr-2" />
                        <span className="text-xs">Stop</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stopCamera}
                      className="text-zinc-400 hover:text-zinc-300 hover:bg-zinc-500/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      <span className="text-xs">Close</span>
                    </Button>
                  </div>
                </div>
                
                <video
                  ref={cameraVideoRef}
                  autoPlay
                  muted={!isVideoRecording}
                  className="w-full h-48 object-cover rounded-md bg-zinc-800"
                />
                
                <canvas ref={canvasRef} className="hidden" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Controls - Enhanced for Multimodal */}
          <div className="mb-4">
            {/* Personality Modeling gets full multimodal support */}
            {isPersonalityModeling && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Multimodal Upload</span>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs">
                      Audio + Visual + Documents
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAnalyzing && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <CircleNotch className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Analyzing...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {/* Audio Controls */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isGenerating || isAnalyzing}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all",
                      isRecording && "bg-red-500/10 border-red-500/30 text-red-400 hover:text-red-300"
                    )}
                  >
                    {isRecording ? (
                      <>
                        <Stop className="h-4 w-4" />
                        <span className="text-xs font-medium">{formatTime(recordingTime)}</span>
                      </>
                    ) : (
                      <>
                        <Microphone className="h-4 w-4" />
                        <span className="text-xs">Record Audio</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => audioFileInputRef.current?.click()}
                    disabled={isGenerating || isAnalyzing}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-xs">Upload Audio</span>
                  </Button>

                  {/* Visual Controls */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isCameraActive ? stopCamera : startCamera}
                    disabled={isGenerating || isAnalyzing}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all",
                      isCameraActive && "text-green-400 hover:text-green-300"
                    )}
                  >
                    <Camera className="h-4 w-4" />
                    <span className="text-xs">{isCameraActive ? "Stop Camera" : "Camera"}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => visualFileInputRef.current?.click()}
                    disabled={isGenerating || isAnalyzing}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-xs">Upload Images</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => videoFileInputRef.current?.click()}
                    disabled={isGenerating || isAnalyzing}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                  >
                    <Video className="h-4 w-4" />
                    <span className="text-xs">Upload Videos</span>
                  </Button>

                  {/* NEW: Document Controls */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => documentFileInputRef.current?.click()}
                    disabled={isGenerating || isAnalyzing}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">Upload Documents</span>
                  </Button>
                </div>

                {/* File inputs */}
                <input
                  ref={audioFileInputRef}
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleAudioFileSelect}
                  className="hidden"
                />
                
                <input
                  ref={visualFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleVisualFileSelect}
                  className="hidden"
                />
                
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVisualFileSelect}
                  className="hidden"
                />

                <input
                  ref={documentFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,.rtf"
                  multiple
                  onChange={handleDocumentFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Existing Music Psychology and Visual Analysis sections remain the same */}
            {isMusicPsychology && persistentAudioFiles.length === 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waveform className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Audio Upload</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAnalyzing && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <CircleNotch className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Analyzing...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isGenerating || isAnalyzing}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all",
                      isRecording && "bg-red-500/10 border-red-500/30 text-red-400 hover:text-red-300"
                    )}
                  >
                    {isRecording ? (
                      <>
                        <Stop className="h-4 w-4" />
                        <span className="text-xs font-medium">{formatTime(recordingTime)}</span>
                      </>
                    ) : (
                      <>
                        <Microphone className="h-4 w-4" />
                        <span className="text-xs">Record</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => audioFileInputRef.current?.click()}
                    disabled={isGenerating || isAnalyzing}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-xs">Upload Audio</span>
                  </Button>
                </div>

                <input
                  ref={audioFileInputRef}
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleAudioFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {isVisualAnalysis && persistentVisualFiles.length === 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Visual Upload & Recording</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAnalyzing && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <CircleNotch className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Analyzing...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isCameraActive ? stopCamera : startCamera}
                    disabled={isGenerating || isAnalyzing}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all",
                      isCameraActive && "text-green-400 hover:text-green-300"
                    )}
                  >
                    <Camera className="h-4 w-4" />
                    <span className="text-xs">{isCameraActive ? "Stop Camera" : "Camera"}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => visualFileInputRef.current?.click()}
                    disabled={isGenerating || isAnalyzing}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-xs">Upload Images</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => videoFileInputRef.current?.click()}
                    disabled={isGenerating || isAnalyzing}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                  >
                    <Video className="h-4 w-4" />
                    <span className="text-xs">Upload Videos</span>
                  </Button>
                </div>

                <input
                  ref={visualFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleVisualFileSelect}
                  className="hidden"
                />
                
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVisualFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Compact add more buttons when files exist */}
            {(persistentAudioFiles.length > 0 || persistentVisualFiles.length > 0 || persistentDocumentFiles.length > 0) && (
              <div className="flex items-center gap-2 flex-wrap">
                {isPersonalityModeling && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => audioFileInputRef.current?.click()}
                      disabled={isGenerating || isAnalyzing || persistentAudioFiles.length >= 5}
                      className="flex items-center gap-2 px-3 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Add Audio</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => visualFileInputRef.current?.click()}
                      disabled={isGenerating || isAnalyzing || persistentVisualFiles.length >= 5}
                      className="flex items-center gap-2 px-3 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Add Visual</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => documentFileInputRef.current?.click()}
                      disabled={isGenerating || isAnalyzing || persistentDocumentFiles.length >= 10}
                      className="flex items-center gap-2 px-3 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Add Documents</span>
                    </Button>

                    <input
                      ref={audioFileInputRef}
                      type="file"
                      accept="audio/*"
                      multiple
                      onChange={handleAudioFileSelect}
                      className="hidden"
                    />
                    
                    <input
                      ref={visualFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleVisualFileSelect}
                      className="hidden"
                    />
                    
                    <input
                      ref={documentFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.md,.rtf"
                      multiple
                      onChange={handleDocumentFileSelect}
                      className="hidden"
                    />
                  </>
                )}

                {(isMusicPsychology || isVisualAnalysis) && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isGenerating || isAnalyzing}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1 text-xs transition-all",
                        isRecording 
                          ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" 
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                      )}
                    >
                      {isRecording ? (
                        <>
                          <Stop className="h-3 w-3" />
                          <span className="font-medium">{formatTime(recordingTime)}</span>
                        </>
                      ) : (
                        <>
                          <Microphone className="h-3 w-3" />
                          <span>Record</span>
                        </>
                      )}
                    </Button>
                  </>
                )}

                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <CircleNotch className="h-3 w-3 animate-spin" />
                    <span className="text-xs">Analyzing...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isPersonalityModeling && ((audioContextActive && persistentAudioFiles.length > 0) || (visualContextActive && persistentVisualFiles.length > 0) || (documentContextActive && persistentDocumentFiles.length > 0))
                    ? "What would you like to understand about your uploaded multimodal content? Ask for personality insights, behavioral analysis, creative feedback, improvement suggestions, or strategic guidance..."
                    : isMusicPsychology && audioContextActive && persistentAudioFiles.length > 0
                      ? "What would you like to understand about your uploaded audio? Ask for creative feedback, psychological modeling, improvement suggestions, or strategic insights..."
                      : isVisualAnalysis && visualContextActive && persistentVisualFiles.length > 0
                        ? "What would you like to understand about your uploaded visual content? Ask for creative feedback, psychological analysis, aesthetic insights, or strategic guidance..."
                        : isPersonalityModeling 
                          ? "Share your experiences, upload audio/visual/document files, or describe current projects for multimodal personality modeling, behavioral analysis, and predictive insights..."
                          : isMusicPsychology 
                            ? "Share your musical experiences, upload audio files, or describe current projects for audio analysis, psychological modeling, and strategic insights..."
                            : isVisualAnalysis
                              ? "Share your visual work, capture photos/videos with your camera, upload images/videos, or describe current projects for visual analysis, aesthetic psychology, and creative insights..."
                              : "Share your cultural background, creative experiences, current projects, or challenges for personality modeling, behavioral analysis, industry insights, and predictive modeling..."
                }
                className="min-h-[44px] max-h-32 resize-none pr-12 bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-600"
                disabled={isGenerating}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
              >
                <ImageIcon className="h-3 w-3" />
              </Button>
            </div>
            
            <Button
              onClick={() => sendMessage()}
              disabled={isGenerating || (!inputText.trim() && selectedImages.length === 0 && 
                (!audioContextActive || persistentAudioFiles.length === 0) && 
                (!visualContextActive || persistentVisualFiles.length === 0) &&
                (!documentContextActive || persistentDocumentFiles.length === 0))}
              className="h-11 px-4 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <CircleNotch className="h-3 w-3 animate-spin" />
              ) : (
                <PaperPlaneRight className="h-3 w-3" weight="fill" />
              )}
            </Button>
          </div>

          {/* Enhanced Loading Indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 flex items-center gap-2 text-zinc-500"
            >
              <CircleNotch className="h-3 w-3 animate-spin" />
              <span className="text-xs">
                {(audioContextActive && persistentAudioFiles.length > 0) || 
                 (visualContextActive && persistentVisualFiles.length > 0) ||
                 (documentContextActive && persistentDocumentFiles.length > 0)
                  ? `Analyzing multimodal psychological patterns with uploaded content...`
                  : "Cultural-psychological analysis in progress..."
                }
              </span>
            </motion.div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <p className="mt-2 text-xs text-zinc-600">
            {isPersonalityModeling 
              ? ((audioContextActive && persistentAudioFiles.length > 0) || (visualContextActive && persistentVisualFiles.length > 0) || (documentContextActive && persistentDocumentFiles.length > 0))
                ? `Ask questions about your multimodal content: ${persistentAudioFiles.length} audio, ${persistentVisualFiles.length} visual, ${persistentDocumentFiles.length} documents. Request psychological insights, behavioral analysis, creative feedback, or strategic guidance.`
                : "Upload audio, visual, and document files for comprehensive multimodal personality modeling. Combine text, images, audio recordings, videos, PDFs, Word docs for deep psychological analysis."
              : isMusicPsychology 
                ? audioContextActive && persistentAudioFiles.length > 0
                  ? `Ask questions about your ${persistentAudioFiles.length} uploaded audio file${persistentAudioFiles.length > 1 ? 's' : ''}: request creative feedback, technical analysis, improvement suggestions, or behavioral insights.`
                  : "Upload audio files for audio analysis and psychological modeling. Share musical experiences and current projects for strategic insights."
                : isVisualAnalysis
                  ? visualContextActive && persistentVisualFiles.length > 0
                    ? `Ask questions about your ${persistentVisualFiles.length} uploaded visual file${persistentVisualFiles.length > 1 ? 's' : ''}: request creative feedback, aesthetic analysis, improvement suggestions, or psychological insights.`
                    : "Upload images/videos, use your camera to capture content, or record videos for visual analysis and psychological modeling. Share visual work and current projects for strategic insights."
                  : "Upload creative work images for multimodal analysis. Share cultural background, personality patterns, current projects, and creative challenges for comprehensive modeling."
            }

            {/* Enhanced context indicators */}
            {audioContextActive && persistentAudioFiles.length > 0 && (
              <span className="block mt-1 text-indigo-400">
                🎵 {persistentAudioFiles.length} audio file{persistentAudioFiles.length > 1 ? 's' : ''} active in conversation context - 
                <button 
                  onClick={() => setAudioContextActive(false)}
                  className="ml-1 underline hover:no-underline"
                >
                  hide context
                </button>
              </span>
            )}
            {!audioContextActive && persistentAudioFiles.length > 0 && (
              <span className="block mt-1 text-zinc-500">
                🎵 {persistentAudioFiles.length} audio file{persistentAudioFiles.length > 1 ? 's' : ''} hidden from conversation - 
                <button 
                  onClick={() => setAudioContextActive(true)}
                  className="ml-1 underline hover:no-underline"
                >
                  show context
                </button>
              </span>
            )}
            {visualContextActive && persistentVisualFiles.length > 0 && (
              <span className="block mt-1 text-purple-400">
                🎨 {persistentVisualFiles.length} visual file{persistentVisualFiles.length > 1 ? 's' : ''} active in conversation context - 
                <button 
                  onClick={() => setVisualContextActive(false)}
                  className="ml-1 underline hover:no-underline"
                >
                  hide context
                </button>
              </span>
            )}
            {!visualContextActive && persistentVisualFiles.length > 0 && (
              <span className="block mt-1 text-zinc-500">
                🎨 {persistentVisualFiles.length} visual file{persistentVisualFiles.length > 1 ? 's' : ''} hidden from conversation - 
                <button 
                  onClick={() => setVisualContextActive(true)}
                  className="ml-1 underline hover:no-underline"
                >
                  show context
                </button>
              </span>
            )}
            {/* NEW: Document context indicators */}
            {documentContextActive && persistentDocumentFiles.length > 0 && (
              <span className="block mt-1 text-green-400">
                📄 {persistentDocumentFiles.length} document{persistentDocumentFiles.length > 1 ? 's' : ''} active in conversation context - 
                <button 
                  onClick={() => setDocumentContextActive(false)}
                  className="ml-1 underline hover:no-underline"
                >
                  hide context
                </button>
              </span>
            )}
            {!documentContextActive && persistentDocumentFiles.length > 0 && (
              <span className="block mt-1 text-zinc-500">
                📄 {persistentDocumentFiles.length} document{persistentDocumentFiles.length > 1 ? 's' : ''} hidden from conversation - 
                <button 
                  onClick={() => setDocumentContextActive(true)}
                  className="ml-1 underline hover:no-underline"
                >
                  show context
                </button>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}