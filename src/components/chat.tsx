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
  EyeSlash
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
  fileToBase64, 
  PSYCHE_SIREN_PROMPTS,
  CONVERSATION_STARTERS,
  validatePsychologyAnalysis,
  createSafeAnalysisResponse,
  correctAnalysisLanguage,
  createAnalysisPrompt
} from "@/lib/utils"

// Audio file types - defined locally to avoid serialization issues
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

// Audio validation utility
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

// Audio playback component for messages
function AudioMessageDisplay({ audioFiles }: { audioFiles: AudioFile[] }) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const audioElementsRef = useRef<(HTMLAudioElement | null)[]>([])

  const togglePlayback = (index: number) => {
    const audio = audioElementsRef.current[index]
    if (!audio) return

    if (playingIndex === index) {
      audio.pause()
      setPlayingIndex(null)
    } else {
      // Pause all other audio
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
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
              {audioFile.name}
            </div>
            {audioFile.duration && (
              <div className="text-xs text-zinc-500">
                {formatTime(Math.floor(audioFile.duration))}
              </div>
            )}
            
            {/* Show analysis results in message */}
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
  const audioElementsRef = useRef<(HTMLAudioElement | null)[]>([])

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (audioFiles.length === 0) return null

  return (
    <div className="mb-4 bg-zinc-900/80 border border-zinc-800 rounded-lg">
      {/* Header */}
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

      {/* Audio Files */}
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
                    {audioFile.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {audioFile.duration && (
                      <div className="text-xs text-zinc-500">
                        {formatTime(Math.floor(audioFile.duration))}
                      </div>
                    )}
                    {audioFile.analysisResult && (
                      <div className="text-xs text-zinc-500">• Analyzed</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Condensed Analysis Display */}
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

            {/* Hidden audio element for playback */}
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

  // Enhanced audio state with persistence and context control
  const [persistentAudioFiles, setPersistentAudioFiles] = useState<AudioFile[]>([])
  const [audioContextActive, setAudioContextActive] = useState(true)
  const [lastResponseQuality, setLastResponseQuality] = useState<{score: number, issues: string[]} | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioFileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  // Check if current session is music psychology
  const isMusicPsychology = currentSession?.type === 'music'

  // Enhanced audio analysis function with comprehensive data extraction
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
        throw new Error(`Audio analysis failed: ${response.status}`)
      }

      const result = await response.json()
      
      // Enhanced analysis result with all available data
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
      console.error('Audio analysis error:', error)
      toast.error('Audio analysis failed - continuing without analysis')
      return undefined
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Enhanced audio file handling with persistence
  const handleAudioFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    for (const file of files) {
      if (isValidAudioFile(file)) {
        if (persistentAudioFiles.length < 5) { // Increased limit
          const url = URL.createObjectURL(file)
          
          // Get audio duration
          const audio = new Audio(url)
          const duration = await new Promise<number>((resolve) => {
            audio.addEventListener('loadedmetadata', () => {
              resolve(audio.duration)
            })
          })

          // Analyze audio with enhanced data extraction
          const analysisResult = await analyzeAudio(file)

          const audioFile: AudioFile = {
            file,
            name: file.name,
            duration,
            url,
            analysisResult
          }
          
          setPersistentAudioFiles(prev => [...prev, audioFile])
          toast.success(`Audio file analyzed and added to context`)
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

  const removePersistentAudioFile = (index: number) => {
    const audioFile = persistentAudioFiles[index]
    if (audioFile?.url) {
      URL.revokeObjectURL(audioFile.url)
    }
    setPersistentAudioFiles(prev => prev.filter((_, i) => i !== index))
    toast.success("Audio file removed from context")
  }

  const clearAllAudioContext = () => {
    persistentAudioFiles.forEach(audioFile => {
      if (audioFile.url) {
        URL.revokeObjectURL(audioFile.url)
      }
    })
    setPersistentAudioFiles([])
    setAudioContextActive(true) // Reset to active when cleared
    toast.success("Audio context cleared")
  }

  // Recording functions (enhanced with analysis)
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
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)

        // Analyze recorded audio
        const analysisResult = await analyzeAudio(file)

        const audioFile: AudioFile = {
          file,
          name: file.name,
          url,
          analysisResult
        }

        setPersistentAudioFiles(prev => [...prev, audioFile])
        stream.getTracks().forEach(track => track.stop())
        toast.success("Recording saved, analyzed, and added to context")
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

  // Enhanced audio context creation for LLM
  const createEnhancedAudioContext = (audioFiles: AudioFile[]): string => {
    if (!audioContextActive || audioFiles.length === 0) return ""
    
    const analysisTexts = audioFiles.map((audio, index) => {
      if (audio.analysisResult) {
        const analysis = audio.analysisResult
        let analysisText = `\n[Audio ${index + 1}: ${audio.name}]\n`
        
        // Core musical elements
        const coreElements = []
        if (analysis.mood) coreElements.push(`Mood: ${analysis.mood}`)
        if (analysis.tempo) coreElements.push(`Tempo: ${analysis.tempo} BPM`)
        if (analysis.key) coreElements.push(`Key: ${analysis.key}`)
        if (analysis.energy !== undefined) coreElements.push(`Energy: ${Math.round(analysis.energy * 100)}%`)
        if (analysis.valence !== undefined) coreElements.push(`Positivity: ${Math.round(analysis.valence * 100)}%`)
        
        if (coreElements.length > 0) {
          analysisText += `Core Elements: ${coreElements.join(', ')}\n`
        }
        
        // Advanced audio features
        const advancedElements = []
        if (analysis.danceability !== undefined) advancedElements.push(`Danceability: ${Math.round(analysis.danceability * 100)}%`)
        if (analysis.acousticness !== undefined) advancedElements.push(`Acoustic: ${Math.round(analysis.acousticness * 100)}%`)
        if (analysis.speechiness !== undefined) advancedElements.push(`Speech: ${Math.round(analysis.speechiness * 100)}%`)
        if (analysis.liveness !== undefined) advancedElements.push(`Live Performance: ${Math.round(analysis.liveness * 100)}%`)
        if (analysis.loudness !== undefined) advancedElements.push(`Loudness: ${analysis.loudness} dB`)
        
        if (advancedElements.length > 0) {
          analysisText += `Audio Features: ${advancedElements.join(', ')}\n`
        }
        
        // Musical context
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
    
    return `\n\n═══ AUDIO CONTEXT ACTIVE ═══\nThe user has uploaded ${audioFiles.length} audio file${audioFiles.length > 1 ? 's' : ''} for psychological analysis:${analysisTexts}\n═══ PSYCHOLOGICAL ANALYSIS GUIDANCE ═══\nConsider these musical elements when providing psychological insights:\n- How the musical characteristics reflect their emotional state and creative psychology\n- Connections between audio features (energy, valence, mood) and their psychological patterns\n- How their musical choices reveal personality traits, cultural influences, or creative identity\n- What the combination of technical and emotional elements suggests about their artistic development\n═══ END AUDIO CONTEXT ═══\n`
  }

  // Validation optimized for your fine-tuned model
  const validateAnalysisResponse = (response: string, userMessage: string): boolean => {
    const violations = validatePsychologyAnalysis(response, userMessage)
    
    // Development quality tracking
    if (process.env.NODE_ENV === 'development') {
      const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 20)
      setLastResponseQuality({ score, issues: violations })
    }
    
    // Critical violations require correction
    const criticalViolations = violations.filter(v => v.includes('CRITICAL'))
    if (criticalViolations.length > 0) {
      console.error('CRITICAL Analysis Violations:', criticalViolations)
      
      // Apply automatic correction
      const correctedResponse = correctAnalysisLanguage(response)
      
      // If still problematic, use safe redirect
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
      // Apply minor corrections for non-critical issues
      const improvedResponse = correctAnalysisLanguage(response)
      updateLastMessage(improvedResponse)
    }
    
    return true
  }

  const sendMessage = async (messageContent?: string) => {
    const contentToSend = messageContent || inputText.trim()
    
    if (!contentToSend && selectedImages.length === 0 && (!audioContextActive || persistentAudioFiles.length === 0)) return
    if (!currentSession) return

    const images = selectedImages
    const contextAudioFiles = audioContextActive ? persistentAudioFiles : []

    // Clear input but keep persistent audio context
    setInputText("")
    clearSelectedImages()
    setLastResponseQuality(null)

    const imageBase64s = await Promise.all(
      images.map(file => fileToBase64(file))
    )

    // Enhanced audio context for AI analysis
    const audioContext = createEnhancedAudioContext(contextAudioFiles)

    // Add user message with current audio files for display
    addMessage({
      role: "user",
      content: contentToSend,
      images: imageBase64s,
      audioFiles: contextAudioFiles // Include for message display
    })

    setIsGenerating(true)

    try {
      // Get system prompt for session type
      const systemPrompt = PSYCHE_SIREN_PROMPTS[
        currentSession.type === "personality" ? "PERSONALITY_PROFILE" :
        currentSession.type === "creative" ? "CREATIVE_ASSESSMENT" :
        currentSession.type === "music" ? "MUSIC_PSYCHOLOGY" :
        "LABEL_INSIGHTS"
      ]

      // Build messages array for your fine-tuned model
      let messages = []
      
      if (currentSession.messages.length === 1) {
        // First message: use full analysis prompt matching your training format
        const analysisPrompt = createAnalysisPrompt(systemPrompt, contentToSend + audioContext, currentSession.type)
        messages.push({
          role: "user",
          content: analysisPrompt,
          images: imageBase64s
        })
      } else {
        // Subsequent messages: maintain context with analysis framework
        const recentMessages = currentSession.messages.slice(-6) // Keep recent context
        
        recentMessages.slice(0, -1).forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content
          })
        })
        
        // Add current message with analysis framework reminder and audio context
        const contextualPrompt = audioContext 
          ? `Continue psychological analysis considering the uploaded audio files. Provide 2-3 sentence analysis using psychological frameworks, then ask ONE strategic question.\n\nUSER: ${contentToSend}${audioContext}`
          : `Continue psychological analysis. Provide 2-3 sentence analysis using psychological frameworks, then ask ONE strategic question.\n\nUSER: ${contentToSend}`
          
        messages.push({
          role: "user", 
          content: contextualPrompt,
          images: imageBase64s
        })
      }

      // Optimal parameters for your fine-tuned model
      const requestBody = {
        messages,
        max_tokens: audioContextActive && persistentAudioFiles.length > 0 ? 400 : 300, // More tokens for audio analysis
        temperature: 1.0,       
        top_p: 0.95,           
        top_k: 64,             
        min_p: 0.0,            
        do_sample: true,       
        repetition_penalty: 1.0, 
        stream: false
      }

      // Add empty assistant message for UI
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
        
        // Validate and potentially correct the response
        if (validateAnalysisResponse(aiResponse, contentToSend)) {
          // Response was acceptable or successfully corrected
          if (!lastResponseQuality || lastResponseQuality.score >= 90) {
            updateLastMessage(aiResponse)
          }
          // If score < 90, response was already corrected in validation
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

  // Cleanup audio URLs when component unmounts or audio files change
  useEffect(() => {
    return () => {
      persistentAudioFiles.forEach(audioFile => {
        if (audioFile.url) {
          URL.revokeObjectURL(audioFile.url)
        }
      })
    }
  }, [persistentAudioFiles])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentSession?.messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`
    }
  }, [inputText])

  // Clear audio context when session changes
  useEffect(() => {
    if (currentSession?.type !== 'music' && persistentAudioFiles.length > 0) {
      clearAllAudioContext()
    }
  }, [currentSession?.id])

  if (!currentSession) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-6">
          <Brain className="h-8 w-8 mx-auto text-zinc-600" />
          <div>
            <h2 className="text-lg font-medium text-zinc-300">Psyche Siren Analysis</h2>
            <p className="text-zinc-500 mt-2 text-sm leading-relaxed">
              Professional cultural-psychological analysis system. I analyze individual patterns using 
              established frameworks including personality psychology, cultural psychology, and creative psychology.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-left">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Analysis Capabilities:</h3>
            <div className="space-y-2 text-sm text-zinc-500">
              <div><strong className="text-zinc-400">Personality Profile:</strong> MBTI, Big Five, attachment patterns</div>
              <div><strong className="text-zinc-400">Creative Assessment:</strong> Creative psychology and artistic identity</div>
              <div><strong className="text-zinc-400">Music Psychology:</strong> Musical connection and emotional regulation</div>
              <div><strong className="text-zinc-400">Cultural Analysis:</strong> Cross-cultural psychology and identity formation</div>
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
              ) : (
                <Brain className="h-3 w-3 text-zinc-500" weight="fill" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-medium text-zinc-300">{currentSession.title}</h1>
              <p className="text-xs text-zinc-600">
                Cultural-Psychological Analysis • {currentSession.type.charAt(0).toUpperCase() + currentSession.type.slice(1).replace('-', ' ')}
                {isMusicPsychology && " • Audio Analysis"}
                {audioContextActive && persistentAudioFiles.length > 0 && (
                  <span className="text-green-400"> • Audio Context Active ({persistentAudioFiles.length})</span>
                )}
              </p>
            </div>
          </div>
          
          {/* Quality indicator for development */}
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
                <h3 className="text-base font-medium text-zinc-400">Ready for Psychological Analysis</h3>
                <p className="text-zinc-600 mt-2 text-sm">
                  {isMusicPsychology 
                    ? "Share your musical experiences and upload audio files for comprehensive music psychology analysis"
                    : "Share your experiences for professional psychological and cultural analysis"
                  }
                </p>
                
                {/* Conversation starters optimized for your training */}
                <div className="mt-6 space-y-3">
                  <p className="text-xs text-zinc-600 mb-4">Analysis starting points:</p>
                  <div className="space-y-3 max-w-xl mx-auto">
                    {Object.values(CONVERSATION_STARTERS).slice(0, 4).map((starter, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSuggestionSelect(starter)}
                        className="w-full text-left justify-start h-auto py-3 px-4 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-700 transition-all"
                      >
                        <div className="text-sm leading-relaxed text-left w-full">
                          {starter}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <p className="text-xs text-zinc-600">
                    {isMusicPsychology 
                      ? "Upload audio files or record music to analyze psychological connections to sound"
                      : "Or describe your experiences, patterns, or cultural background for analysis"
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
                    
                    {message.content ? (
                      <MessageContent content={message.content} isUser={message.role === "user"} />
                    ) : (
                      message.role === "assistant" && isGenerating && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <CircleNotch className="h-3 w-3 animate-spin" />
                          <span>
                            {audioContextActive && persistentAudioFiles.length > 0
                              ? "Analyzing psychological patterns with audio context..."
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

          {/* Enhanced Audio Context Panel */}
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

          {/* Audio Upload Section - Music Psychology Only */}
          {isMusicPsychology && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
                  {/* Audio Controls Header */}
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

                  {/* Recording and Upload Controls */}
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
              </motion.div>
            </AnimatePresence>
          )}

          {/* Input Controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isMusicPsychology 
                    ? "Share your musical experiences, emotional connections to sound, or upload audio files for psychological analysis..."
                    : "Share your cultural background, creative experiences, personality patterns, or professional dynamics for psychological analysis..."
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
              disabled={isGenerating || (!inputText.trim() && selectedImages.length === 0 && (!audioContextActive || persistentAudioFiles.length === 0))}
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
                {audioContextActive && persistentAudioFiles.length > 0
                  ? `Analyzing musical psychology patterns with ${persistentAudioFiles.length} audio file${persistentAudioFiles.length > 1 ? 's' : ''}...`
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
            {isMusicPsychology 
              ? "Upload audio files for music psychology analysis. Share musical experiences and emotional connections to sound."
              : "Upload creative work images for multimodal analysis. Cultural background, personality patterns, and creative experiences welcome."
            }
            {/* Enhanced audio context indicator */}
            {audioContextActive && persistentAudioFiles.length > 0 && (
              <span className="block mt-1 text-green-400">
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
          </p>
        </div>
      </div>
    </div>
  )
}