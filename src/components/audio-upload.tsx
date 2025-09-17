"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  Microphone,
  MusicNote,
  Play,
  Pause,
  Stop,
  X,
  Upload,
  CircleNotch
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
}

interface AudioUploadProps {
  selectedAudioFiles: AudioFile[]
  onAddAudioFile: (audioFile: AudioFile) => void
  onRemoveAudioFile: (index: number) => void
  disabled?: boolean
}

export function AudioUpload({ 
  selectedAudioFiles, 
  onAddAudioFile, 
  onRemoveAudioFile, 
  disabled 
}: AudioUploadProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioElementsRef = useRef<(HTMLAudioElement | null)[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const isValidAudioFile = (file: File): boolean => {
    const validTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/webm']
    const maxSize = 50 * 1024 * 1024 // 50MB
    return validTypes.includes(file.type) && file.size <= maxSize
  }

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
      return result.analysis || undefined
    } catch (error) {
      console.error('Audio analysis error:', error)
      toast.error('Audio analysis failed - continuing without analysis')
      return undefined
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    for (const file of files) {
      if (isValidAudioFile(file)) {
        if (selectedAudioFiles.length < 3) {
          const url = URL.createObjectURL(file)
          
          // Get audio duration
          const audio = new Audio(url)
          const duration = await new Promise<number>((resolve) => {
            audio.addEventListener('loadedmetadata', () => {
              resolve(audio.duration)
            })
          })

          // Analyze audio
          const analysisResult = await analyzeAudio(file)

          const audioFile: AudioFile = {
            file,
            name: file.name,
            duration,
            url,
            analysisResult
          }
          
          onAddAudioFile(audioFile)
        } else {
          toast.error("Maximum 3 audio files allowed")
        }
      } else {
        toast.error(`Invalid file: ${file.name}. Please select an audio file under 50MB.`)
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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

        onAddAudioFile(audioFile)
        stream.getTracks().forEach(track => track.stop())
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
      
      toast.success("Recording saved")
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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

  return (
    <div className="space-y-3">
      {/* Recording and Upload Controls */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isAnalyzing}
          className={cn(
            "flex items-center gap-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800",
            isRecording && "text-red-400 hover:text-red-300"
          )}
        >
          {isRecording ? (
            <>
              <Stop className="h-4 w-4" />
              <span className="text-xs">{formatTime(recordingTime)}</span>
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
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isAnalyzing}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800"
        >
          <Upload className="h-4 w-4" />
          <span className="text-xs">Upload</span>
        </Button>

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-zinc-500">
            <CircleNotch className="h-3 w-3 animate-spin" />
            <span className="text-xs">Analyzing...</span>
          </div>
        )}
      </div>

      {/* Selected Audio Files */}
      <AnimatePresence>
        {selectedAudioFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {selectedAudioFiles.map((audioFile, index) => (
              <div key={index} className="relative">
                <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePlayback(index)}
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
                  >
                    {playingIndex === index ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <MusicNote className="h-4 w-4 text-zinc-500" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-300 truncate">
                      {audioFile.name}
                    </div>
                    {audioFile.duration && (
                      <div className="text-xs text-zinc-500">
                        {formatTime(Math.floor(audioFile.duration))}
                      </div>
                    )}
                    
                    {/* Analysis Results */}
                    {audioFile.analysisResult && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-zinc-400">Audio Analysis:</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {audioFile.analysisResult.mood && (
                            <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded">
                              {audioFile.analysisResult.mood}
                            </span>
                          )}
                          {audioFile.analysisResult.tempo && (
                            <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded">
                              {audioFile.analysisResult.tempo} BPM
                            </span>
                          )}
                          {audioFile.analysisResult.key && (
                            <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded">
                              {audioFile.analysisResult.key}
                            </span>
                          )}
                        </div>
                        {audioFile.analysisResult.summary && (
                          <div className="text-xs text-zinc-500 mt-1">
                            {audioFile.analysisResult.summary}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveAudioFile(index)}
                    className="h-6 w-6 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
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
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}