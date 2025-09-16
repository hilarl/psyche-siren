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
  Lightbulb
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
  ANALYSIS_PROMPTS, 
  CONVERSATION_STARTERS,
  validateResponse,
  createSafeRedirectResponse,
  assessResponseQuality,
  PSYCHOLOGICAL_REDIRECTS
} from "@/lib/utils"

// CUTTING-EDGE: Context-aware conversation starter generation
function generateContextualStarters(
  currentSession: any, 
  allSessions: any[], 
  sessionType: string
): string[] {
  const starters: string[] = []
  
  // 1. Fresh session with history - continuation patterns
  if (currentSession.messages.length === 0 && allSessions.length > 0) {
    const recentSessions = allSessions.slice(0, 3)
    const recentTopics = extractRecentTopics(recentSessions)
    const daysSinceLastSession = getDaysBetween(allSessions[0]?.updatedAt, new Date())
    
    // Continuation from recent themes
    if (recentTopics.includes('childhood') && !recentTopics.includes('family')) {
      starters.push("Continue exploring those childhood patterns we discussed")
    }
    
    if (recentTopics.includes('creative') && daysSinceLastSession > 3) {
      starters.push("Reflect on your creative process since our last conversation")
    }
    
    if (recentTopics.includes('attachment') && sessionType === 'personality') {
      starters.push("Examine how your attachment patterns showed up this week")
    }
    
    // Time-sensitive reconnection
    if (daysSinceLastSession > 7) {
      starters.push("Share what's been on your mind since we last explored together")
    } else if (daysSinceLastSession > 14) {
      starters.push("Catch me up on your psychological landscape over the past few weeks")
    }
  }
  
  // 2. Session-specific intelligent starters
  const userHistory = analyzeUserHistory(allSessions)
  
  switch (sessionType) {
    case 'personality':
      if (userHistory.frequentPatterns.includes('trauma') && !userHistory.recentTopics.includes('healing')) {
        starters.push("Explore how you've been processing difficult experiences lately")
      }
      if (userHistory.attachmentStyle === 'avoidant') {
        starters.push("Examine a recent situation where you felt emotionally distant")
      }
      break
      
    case 'creative':
      if (userHistory.creativeBlocks > 2) {
        starters.push("Understand what's been blocking your creative expression recently")
      }
      if (userHistory.hasDiscussed.includes('inspiration')) {
        starters.push("Analyze how your creative inspiration patterns have evolved")
      }
      break
      
    case 'music':
      if (userHistory.emotionalRegulation && userHistory.recentTopics.includes('stress')) {
        starters.push("Explore how you've been using music to manage stress")
      }
      starters.push("Analyze a song that's been meaningful to you lately")
      break
      
    case 'label-insights':
      if (userHistory.hasDiscussed.includes('feedback')) {
        starters.push("Examine how you've been handling creative feedback recently")
      }
      starters.push("Analyze your collaboration style in recent creative projects")
      break
  }
  
  // 3. Fallback to enhanced defaults if nothing contextual
  if (starters.length === 0) {
    return getDefaultStarters(sessionType, userHistory)
  }
  
  return starters.slice(0, 3) // Return top 3 most relevant
}

// Helper functions for contextual analysis
function extractRecentTopics(sessions: any[]): string[] {
  const allMessages = sessions.flatMap(s => s.messages || [])
  const recentMessages = allMessages.slice(-12) // Last 12 messages
  
  const topics: string[] = []
  recentMessages.forEach(msg => {
    if (msg.psychologicalPatterns) {
      topics.push(...msg.psychologicalPatterns)
    }
  })
  
  return [...new Set(topics)] // Remove duplicates
}

function analyzeUserHistory(sessions: any[]) {
  const allMessages = sessions.flatMap(s => s.messages || [])
  const userMessages = allMessages.filter(m => m.role === 'user')
  
  const patterns = userMessages.flatMap(m => m.psychologicalPatterns || [])
  const emotions = userMessages.flatMap(m => m.emotionalMarkers || [])
  const recentMessages = userMessages.slice(-6)
  
  return {
    frequentPatterns: getFrequentItems(patterns, 2),
    hasDiscussed: [...new Set(patterns)],
    recentTopics: extractRecentTopics(sessions.slice(0, 2)),
    emotionalPatterns: getFrequentItems(emotions, 2),
    attachmentStyle: inferAttachmentStyle(patterns, emotions),
    creativeBlocks: countOccurrences(patterns, 'creative') + countOccurrences(patterns, 'block'),
    emotionalRegulation: patterns.includes('emotional') || emotions.includes('calm') || emotions.includes('anxious')
  }
}

function getFrequentItems(items: string[], minCount: number): string[] {
  const counts: Record<string, number> = {}
  items.forEach(item => {
    counts[item] = (counts[item] || 0) + 1
  })
  
  return Object.entries(counts)
    .filter(([_, count]) => count >= minCount)
    .map(([item, _]) => item)
}

function inferAttachmentStyle(patterns: string[], emotions: string[]): string | null {
  if (patterns.includes('abandonment') || emotions.includes('anxious')) {
    return 'anxious'
  }
  if (patterns.includes('control') || emotions.includes('distant')) {
    return 'avoidant'
  }
  if (patterns.includes('vulnerability') && emotions.includes('safe')) {
    return 'secure'
  }
  return null
}

function countOccurrences(array: string[], term: string): number {
  return array.filter(item => item.toLowerCase().includes(term.toLowerCase())).length
}

function getDaysBetween(date1: Date | string, date2: Date): number {
  if (!date1) return 0
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getDefaultStarters(sessionType: string, userHistory: any): string[] {
  // Enhanced defaults based on user history
  const defaults: Record<string, string[]> = {
    personality: [
      userHistory.attachmentStyle 
        ? `Explore how your ${userHistory.attachmentStyle} attachment patterns show up currently`
        : CONVERSATION_STARTERS.GENTLE_OPENING,
      CONVERSATION_STARTERS.CHILDHOOD_BRIDGE,
      CONVERSATION_STARTERS.ATTACHMENT_EXPLORATION
    ],
    creative: [
      userHistory.creativeBlocks > 0 
        ? "Examine what your creative blocks reveal about your psychological patterns"
        : CONVERSATION_STARTERS.CREATIVE_FOCUS,
      CONVERSATION_STARTERS.INFLUENCE_EXPLORATION,
      CONVERSATION_STARTERS.IDENTITY_FORMATION
    ],
    music: [
      userHistory.emotionalRegulation
        ? "Analyze how you've been using music for emotional balance"
        : "Explore your earliest meaningful musical memory and its psychological significance",
      "Understand what your musical preferences reveal about your attachment patterns",
      "Examine how music helps you process emotions"
    ],
    'label-insights': [
      "Examine how you handle creative feedback and what patterns this reveals",
      "Identify what collaborative environment brings out your best creative work", 
      "Analyze your relationship with creative control and autonomy"
    ]
  }
  
  return defaults[sessionType] || [CONVERSATION_STARTERS.GENTLE_OPENING]
}

// CUTTING-EDGE: Smart follow-up suggestions
function generateSmartFollowUps(messages: any[], sessionType: string): string[] {
  if (messages.length < 2) return []
  
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()
  if (!lastUserMessage) return []
  
  const followUps: string[] = []
  const patterns = lastUserMessage.psychologicalPatterns || []
  const emotions = lastUserMessage.emotionalMarkers || []
  
  // Pattern-based follow-ups
  if (patterns.includes('childhood') && !patterns.includes('family')) {
    followUps.push("Tell me more about your family dynamics during that time")
  }
  
  if (patterns.includes('creativity') && emotions.includes('frustrated')) {
    followUps.push("What do you think is blocking your creative expression?")
  }
  
  if (patterns.includes('relationship') && !emotions.includes('safe')) {
    followUps.push("How did that relationship dynamic affect your sense of security?")
  }
  
  // Depth progression
  if (lastUserMessage.content.length > 150 && !patterns.includes('emotional')) {
    followUps.push("What emotions come up when you reflect on that experience?")
  }
  
  // Session-specific
  if (sessionType === 'music' && lastUserMessage.content.toLowerCase().includes('song')) {
    followUps.push("What was happening in your life when that song became meaningful?")
  }
  
  return followUps.slice(0, 2)
}

// CUTTING-EDGE: AI Reasoning Transparency Component
const AIReasoningIndicator = ({ isGenerating }: { isGenerating: boolean }) => {
  const [reasoningStep, setReasoningStep] = useState<string>("")
  
  useEffect(() => {
    if (isGenerating) {
      const steps = [
        "Analyzing psychological patterns...",
        "Connecting to established frameworks...", 
        "Considering conversation history...",
        "Formulating response with therapeutic depth..."
      ]
      
      let currentStep = 0
      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          setReasoningStep(steps[currentStep])
          currentStep++
        }
      }, 900)
      
      return () => clearInterval(interval)
    } else {
      setReasoningStep("")
    }
  }, [isGenerating])
  
  if (!isGenerating || !reasoningStep) return null
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-center gap-2 text-xs text-zinc-500 mb-2"
    >
      <CircleNotch className="h-3 w-3 animate-spin" />
      <span>{reasoningStep}</span>
    </motion.div>
  )
}

// CUTTING-EDGE: Smart Follow-up Component
const SmartFollowUps = ({ followUps, onSelect }: { followUps: string[], onSelect: (followUp: string) => void }) => {
  if (followUps.length === 0) return null
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-3 w-3 text-zinc-500" />
        <p className="text-xs text-zinc-500">Suggested explorations:</p>
      </div>
      
      <div className="space-y-2">
        {followUps.map((followUp, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onSelect(followUp)}
            className="w-full justify-start text-left h-auto py-2 px-3 bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700 text-xs"
          >
            {followUp}
          </Button>
        ))}
      </div>
    </motion.div>
  )
}

// Enhanced markdown formatter for psychological insights
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

// Response quality indicator component
function ResponseQualityIndicator({ score, issues }: { score: number; issues: string[] }) {
  if (score >= 90) return null
  
  const getColor = (score: number) => {
    if (score >= 80) return "text-zinc-500"
    if (score >= 60) return "text-zinc-600" 
    return "text-zinc-700"
  }

  return (
    <div className={`flex items-center gap-1 text-xs ${getColor(score)}`}>
      <WarningCircle className="h-3 w-3" />
      <span>Quality: {score}%</span>
      {issues.length > 0 && (
        <span className="opacity-75">({issues.length} issues)</span>
      )}
    </div>
  )
}

export function Chat() {
  const {
    currentSession,
    sessions,
    isGenerating,
    setIsGenerating,
    inputText,
    setInputText,
    selectedImages,
    addSelectedImage,
    removeSelectedImage,
    clearSelectedImages,
    addMessage,
    updateLastMessage,
    currentConversationDepth
  } = useAppStore()

  const [isStreaming, setIsStreaming] = useState(false)
  const [lastResponseQuality, setLastResponseQuality] = useState<{score: number, issues: string[]} | null>(null)
  const [smartFollowUps, setSmartFollowUps] = useState<string[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // CUTTING-EDGE: Generate contextual conversation starters
  const conversationStarters = currentSession 
    ? generateContextualStarters(currentSession, sessions, currentSession.type)
    : []

  // Enhanced validation function
  const validateAIResponse = (response: string, userMessage: string): boolean => {
    const violations = validateResponse(response, userMessage)
    const quality = assessResponseQuality(response, userMessage)
    
    setLastResponseQuality(quality)
    
    // Generate smart follow-ups after AI response
    const followUps = generateSmartFollowUps([...currentSession?.messages || [], { role: 'user', content: userMessage }], currentSession?.type || 'personality')
    setSmartFollowUps(followUps)
    
    // Critical violations require immediate intervention
    const criticalViolations = violations.filter(v => v.includes('CRITICAL'))
    if (criticalViolations.length > 0) {
      console.error('CRITICAL AI Response Violations:', criticalViolations)
      
      const safeResponse = createSafeRedirectResponse(userMessage, violations)
      updateLastMessage(safeResponse)
      
      toast.error("Response corrected for safety")
      return false
    }
    
    if (violations.length > 0) {
      console.warn('AI Response Warnings:', violations)
    }
    
    return true
  }

  const sendMessage = async (messageContent?: string) => {
    const contentToSend = messageContent || inputText.trim()
    
    if (!contentToSend && selectedImages.length === 0) return
    if (!currentSession) return

    const images = selectedImages

    // Clear input immediately for better UX
    setInputText("")
    clearSelectedImages()
    setLastResponseQuality(null)
    setSmartFollowUps([]) // Clear old follow-ups

    const imageBase64s = await Promise.all(
      images.map(file => fileToBase64(file))
    )

    // Add user message
    addMessage({
      role: "user",
      content: contentToSend,
      images: imageBase64s
    })

    setIsGenerating(true)
    setIsStreaming(true)

    try {
      // Get the appropriate system prompt based on session type
      const systemPrompt = ANALYSIS_PROMPTS[
        currentSession.type === "personality" ? "PERSONALITY_PROFILE" :
        currentSession.type === "creative" ? "CREATIVE_ASSESSMENT" :
        currentSession.type === "music" ? "MUSIC_PSYCHOLOGY" :
        "LABEL_INSIGHTS"
      ]

      // Build conversation context (last 6 messages for context management)
      const recentMessages = currentSession.messages.slice(-6)
      const conversationHistory = recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const requestBody = {
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: contentToSend }
        ],
        max_tokens: 512,
        temperature: 0.7,
        stream: false
      }

      // Add empty assistant message for streaming effect
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
        
        // Validate response before showing to user
        if (validateAIResponse(aiResponse, contentToSend)) {
          updateLastMessage(aiResponse)
        }
        
      } else {
        throw new Error("Invalid response format")
      }

    } catch (error) {
      console.error("Error sending message:", error)
      
      const errorResponse = "I apologize, but I'm having difficulty processing your message right now. Could you try rephrasing your question or sharing a bit more context about what you'd like to explore?"
      
      updateLastMessage(errorResponse)
      toast.error("Connection issue - please try again")
    } finally {
      setIsGenerating(false)
      setIsStreaming(false)
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

  const handleFollowUpSelect = (followUp: string) => {
    setInputText(followUp)
    textareaRef.current?.focus()
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentSession?.messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`
    }
  }, [inputText])

  if (!currentSession) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-6">
          <Brain className="h-8 w-8 mx-auto text-zinc-600" />
          <div>
            <h2 className="text-lg font-medium text-zinc-300">Welcome to Psyche Siren</h2>
            <p className="text-zinc-500 mt-2 text-sm leading-relaxed">
              Professional AI assistant for psychological analysis and creative understanding. 
              I help explore patterns, provide insights through established frameworks, and guide 
              self-discovery through strategic questioning.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-left">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Choose your exploration:</h3>
            <div className="space-y-2 text-sm text-zinc-500">
              <div><strong className="text-zinc-400">Personality Profile:</strong> Deep psychological pattern analysis</div>
              <div><strong className="text-zinc-400">Creative Assessment:</strong> Psychology of creative expression</div>
              <div><strong className="text-zinc-400">Music Psychology:</strong> Musical connection and emotional regulation</div>
              <div><strong className="text-zinc-400">Industry Insights:</strong> Professional creative dynamics</div>
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
              <Brain className="h-3 w-3 text-zinc-500" weight="fill" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-zinc-300">{currentSession.title}</h1>
              <p className="text-xs text-zinc-600">
                {currentSession.type.charAt(0).toUpperCase() + currentSession.type.slice(1).replace('-', ' ')} Analysis
              </p>
            </div>
          </div>
          
          {/* Quality indicator for development */}
          {lastResponseQuality && process.env.NODE_ENV === 'development' && (
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
                <h3 className="text-base font-medium text-zinc-400">Ready for Analysis</h3>
                <p className="text-zinc-600 mt-2 text-sm">
                  Choose a focus area below or write your own message
                </p>
                
                {/* FIXED: Clean conversation starters with proper container */}
                <div className="mt-6 space-y-3">
                  <p className="text-xs text-zinc-600 mb-4">Suggested starting points:</p>
                  <div className="space-y-3 max-w-xl mx-auto">
                    {conversationStarters.map((starter, index) => (
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
                    Or describe what you'd like to explore in your own words
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
                    
                    {message.content ? (
                      <MessageContent content={message.content} isUser={message.role === "user"} />
                    ) : (
                      message.role === "assistant" && isStreaming && (
                        <AIReasoningIndicator isGenerating={isStreaming} />
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
              
              {/* CUTTING-EDGE: Smart follow-up suggestions */}
              {!isGenerating && smartFollowUps.length > 0 && (
                <SmartFollowUps 
                  followUps={smartFollowUps}
                  onSelect={handleFollowUpSelect}
                />
              )}
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

          {/* CUTTING-EDGE: AI Reasoning during generation */}
          {isGenerating && (
            <AIReasoningIndicator isGenerating={isGenerating} />
          )}

          {/* Input Controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts, experiences, or creative work for professional psychological analysis..."
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
              disabled={isGenerating || (!inputText.trim() && selectedImages.length === 0)}
              className="h-11 px-4 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <CircleNotch className="h-3 w-3 animate-spin" />
              ) : (
                <PaperPlaneRight className="h-3 w-3" weight="fill" />
              )}
            </Button>
          </div>

          {/* Loading Indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 flex items-center gap-2 text-zinc-500"
            >
              <CircleNotch className="h-3 w-3 animate-spin" />
              <span className="text-xs">Professional psychological analysis in progress...</span>
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
            Upload images of creative work for multimodal analysis. Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  )
}