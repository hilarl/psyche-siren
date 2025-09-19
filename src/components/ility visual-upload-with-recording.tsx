"use client"

import React, { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  Camera,
  Image as ImageIcon,
  Video,
  Palette,
  Eye,
  X,
  Upload,
  CircleNotch,
  Play,
  Pause,
  FileImage,
  FilmStrip,
  Stop,
  Record
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// File validation utilities
const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 10 * 1024 * 1024 // 10MB
  return validTypes.includes(file.type) && file.size <= maxSize
}

const isValidVideoFile = (file: File): boolean => {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv']
  const maxSize = 100 * 1024 * 1024 // 100MB
  return validTypes.includes(file.type) && file.size <= maxSize
}

interface VisualFile {
  file: File
  name: string
  type: 'image' | 'video'
  url: string
  duration?: number // For videos
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

interface VisualUploadProps {
  selectedVisualFiles: VisualFile[]
  onAddVisualFile: (visualFile: VisualFile) => void
  onRemoveVisualFile: (index: number) => void
  disabled?: boolean
}

export function VisualUpload({ 
  selectedVisualFiles, 
  onAddVisualFile, 
  onRemoveVisualFile, 
  disabled 
}: VisualUploadProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoElementsRef = useRef<(HTMLVideoElement | null)[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const isValidVisualFile = useCallback((file: File): boolean => {
    return isValidImageFile(file) || isValidVideoFile(file)
  }, [])

  const getFileType = useCallback((file: File): 'image' | 'video' => {
    return file.type.startsWith('image/') ? 'image' : 'video'
  }, [])

  const analyzeVisual = useCallback(async (file: File): Promise<VisualAnalysisResult | undefined> => {
    try {
      setIsAnalyzing(true)
      const formData = new FormData()
      formData.append('visual', file)

      const response = await fetch('/api/siren/visual', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Visual analysis failed: ${response.status}`)
      }

      const result = await response.json()
      
      // Enhanced analysis result with comprehensive visual psychology data
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
      console.error('Visual analysis error:', error)
      toast.error('Visual analysis failed - continuing without analysis')
      return undefined
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    for (const file of files) {
      if (isValidVisualFile(file)) {
        if (selectedVisualFiles.length < 5) { // Allow up to 5 visual files
          const url = URL.createObjectURL(file)
          const type = getFileType(file)
          
          let duration: number | undefined = undefined
          
          // Get video duration if it's a video file
          if (type === 'video') {
            const video = document.createElement('video')
            video.src = url
            duration = await new Promise<number>((resolve) => {
              video.addEventListener('loadedmetadata', () => {
                resolve(video.duration)
              })
            })
          }

          // Analyze visual content
          const analysisResult = await analyzeVisual(file)

          const visualFile: VisualFile = {
            file,
            name: file.name,
            type,
            url,
            duration,
            analysisResult
          }
          
          onAddVisualFile(visualFile)
          toast.success(`${type === 'image' ? 'Image' : 'Video'} analyzed and added to context`)
        } else {
          toast.error("Maximum 5 visual files allowed")
        }
      } else {
        toast.error(`Invalid file: ${file.name}. Please select an image or video file.`)
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = ""
    }
  }, [selectedVisualFiles.length, isValidVisualFile, getFileType, analyzeVisual, onAddVisualFile])

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 },
        audio: false // For photo capture only
      })
      setStream(mediaStream)
      setIsCapturing(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      
      toast.success("Camera started")
    } catch (error) {
      console.error('Camera access error:', error)
      toast.error("Camera access denied or unavailable")
    }
  }, [])

  const startVideoRecording = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 },
        audio: true // Include audio for video recording
      })
      setStream(mediaStream)
      setIsCapturing(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      // Start recording
      const mediaRecorder = new MediaRecorder(mediaStream)
      mediaRecorderRef.current = mediaRecorder
      recordedChunksRef.current = []

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      })

      mediaRecorder.addEventListener('stop', async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const file = new File([blob], `video-recording-${Date.now()}.webm`, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)

        // Get video duration
        const video = document.createElement('video')
        video.src = url
        const duration = await new Promise<number>((resolve) => {
          video.addEventListener('loadedmetadata', () => {
            resolve(video.duration)
          })
        })

        // Analyze recorded video
        const analysisResult = await analyzeVisual(file)

        const visualFile: VisualFile = {
          file,
          name: file.name,
          type: 'video',
          url,
          duration,
          analysisResult
        }

        onAddVisualFile(visualFile)
        stopCamera()
        toast.success("Video recorded, analyzed, and added to context")
      })

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast.success("Video recording started")
    } catch (error) {
      console.error('Video recording error:', error)
      toast.error("Camera/microphone access denied or unavailable")
    }
  }, [analyzeVisual, onAddVisualFile])

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [isRecording])

  const capturePhoto = useCallback(async () => {
    if (!stream || !videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0)
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `photo-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
        const url = URL.createObjectURL(blob)

        // Analyze captured image
        const analysisResult = await analyzeVisual(file)

        const visualFile: VisualFile = {
          file,
          name: file.name,
          type: 'image',
          url,
          analysisResult
        }

        onAddVisualFile(visualFile)
        stopCamera()
        toast.success("Photo captured, analyzed, and added to context")
      }
    }, 'image/jpeg', 0.9)
  }, [stream, analyzeVisual, onAddVisualFile])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsCapturing(false)
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [stream])

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const toggleVideoPlayback = useCallback((index: number) => {
    const video = videoElementsRef.current[index]
    if (!video) return

    if (playingIndex === index) {
      video.pause()
      setPlayingIndex(null)
    } else {
      // Pause all other videos
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
  }, [playingIndex])

  const handleRemoveVisualFile = useCallback((index: number) => {
    onRemoveVisualFile(index)
  }, [onRemoveVisualFile])

  return (
    <div className="space-y-3">
      {/* Camera Capture Section */}
      <AnimatePresence>
        {isCapturing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-300">
                  {isRecording ? "Recording Video" : "Camera Preview"}
                </span>
                {isRecording && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-sm text-red-400 font-medium tabular-nums">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!isRecording && (
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
                {isRecording && (
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
              ref={videoRef}
              autoPlay
              muted={!isRecording} // Mute for photo preview, unmute for recording
              className="w-full h-48 object-cover rounded-md bg-zinc-800"
            />
            
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Controls */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={isCapturing ? stopCamera : startCamera}
          disabled={disabled || isAnalyzing}
          className={cn(
            "flex items-center gap-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800",
            isCapturing && "text-green-400 hover:text-green-300"
          )}
        >
          <Camera className="h-4 w-4" />
          <span className="text-xs">{isCapturing ? "Stop Camera" : "Camera"}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isAnalyzing}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800"
        >
          <ImageIcon className="h-4 w-4" />
          <span className="text-xs">Images</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => videoInputRef.current?.click()}
          disabled={disabled || isAnalyzing}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800"
        >
          <Video className="h-4 w-4" />
          <span className="text-xs">Videos</span>
        </Button>

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-zinc-500">
            <CircleNotch className="h-3 w-3 animate-spin" />
            <span className="text-xs">Analyzing...</span>
          </div>
        )}
      </div>

      {/* Selected Visual Files */}
      <AnimatePresence>
        {selectedVisualFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {selectedVisualFiles.map((visualFile, index) => (
              <div key={index} className="relative">
                <div className="flex items-start gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-md">
                  {/* File Icon/Thumbnail */}
                  <div className="flex-shrink-0">
                    {visualFile.type === 'image' ? (
                      <div className="relative">
                        <img
                          src={visualFile.url}
                          alt={visualFile.name}
                          className="w-16 h-16 object-cover rounded border border-zinc-700"
                        />
                        <FileImage className="absolute -bottom-1 -right-1 h-4 w-4 text-zinc-400 bg-zinc-900 rounded-full p-0.5" />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleVideoPlayback(index)}
                            className="h-8 w-8 text-zinc-400 hover:text-zinc-300"
                          >
                            {playingIndex === index ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <FilmStrip className="absolute -bottom-1 -right-1 h-4 w-4 text-zinc-400 bg-zinc-900 rounded-full p-0.5" />
                        
                        {/* Hidden video element for playback */}
                        <video
                          ref={(el) => {
                            videoElementsRef.current[index] = el
                          }}
                          src={visualFile.url}
                          preload="metadata"
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-300 truncate font-medium">
                        {visualFile.name}
                      </span>
                      <div className="flex items-center gap-1">
                        {visualFile.type === 'image' ? (
                          <ImageIcon className="h-3 w-3 text-zinc-500" />
                        ) : (
                          <Video className="h-3 w-3 text-zinc-500" />
                        )}
                        {visualFile.duration && (
                          <span className="text-xs text-zinc-500">
                            {formatTime(Math.floor(visualFile.duration))}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Analysis Results */}
                    {visualFile.analysisResult && (
                      <div className="mt-2 space-y-2">
                        <div className="text-xs text-zinc-400">Visual Psychology Analysis:</div>
                        
                        {/* Core Analysis */}
                        <div className="flex flex-wrap gap-1">
                          {visualFile.analysisResult.emotional_tone && (
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                              {visualFile.analysisResult.emotional_tone}
                            </span>
                          )}
                          {visualFile.analysisResult.composition_style && (
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                              {visualFile.analysisResult.composition_style}
                            </span>
                          )}
                          {visualFile.analysisResult.aesthetic_preference && (
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                              {visualFile.analysisResult.aesthetic_preference}
                            </span>
                          )}
                        </div>

                        {/* Colors */}
                        {visualFile.analysisResult.dominant_colors && visualFile.analysisResult.dominant_colors.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Palette className="h-3 w-3 text-zinc-500" />
                            <div className="flex gap-1">
                              {visualFile.analysisResult.dominant_colors.slice(0, 5).map((color, i) => (
                                <div
                                  key={i}
                                  className="w-3 h-3 rounded-full border border-zinc-600"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-zinc-500">
                              {visualFile.analysisResult.dominant_colors.length} colors
                            </span>
                          </div>
                        )}

                        {/* Psychological Themes */}
                        {visualFile.analysisResult.psychological_themes && visualFile.analysisResult.psychological_themes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {visualFile.analysisResult.psychological_themes.slice(0, 3).map((theme, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">
                                {theme}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Cultural Markers */}
                        {visualFile.analysisResult.cultural_markers && visualFile.analysisResult.cultural_markers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {visualFile.analysisResult.cultural_markers.slice(0, 3).map((marker, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs">
                                {marker}
                              </span>
                            ))}
                          </div>
                        )}

                        {visualFile.analysisResult.summary && (
                          <div className="text-xs text-zinc-500 mt-1">
                            {visualFile.analysisResult.summary}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveVisualFile(index)}
                    className="h-6 w-6 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}