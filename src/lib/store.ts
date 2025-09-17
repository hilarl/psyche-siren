import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface AudioFile {
  file: File
  name: string
  duration?: number
  url: string
  analysisResult?: AudioAnalysisResult
}

export interface AudioAnalysisResult {
  tempo?: number
  key?: string
  mood?: string
  energy?: number
  valence?: number
  genres?: string[]
  instruments?: string[]
  summary?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  images?: string[]
  audioFiles?: AudioFile[]
  analysisType?: string
  emotionalMarkers?: string[]
  psychologicalPatterns?: string[]
  validationScore?: number
  boundaryViolations?: string[]
}

export interface PsychologicalInsight {
  category: 'attachment' | 'trauma' | 'creative_psychology' | 'family_dynamics' | 'emotional_regulation' | 'identity_formation'
  confidence_level: number
  supporting_evidence: string[]
  connections_to_creativity: string[]
  follow_up_areas: string[]
  session_context: string
  psychological_framework: string
  accuracy_verified: boolean
}

export interface ConversationState {
  psychological_safety_level: number
  topics_explored: string[]
  emotional_patterns_observed: string[]
  trauma_indicators: string[]
  attachment_patterns: string[]
  creative_psychology_insights: PsychologicalInsight[]
  readiness_for_depth: 'surface' | 'emerging' | 'deep' | 'integration'
  user_energy_level: 'guarded' | 'curious' | 'open' | 'vulnerable' | 'excited'
  preferred_communication_style: 'direct' | 'metaphorical' | 'story_based' | 'reflective'
  conversation_flow_notes: string[]
  boundary_violations_count: number
  response_quality_average: number
  last_validation_score: number
}

export interface AnalysisSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  type: 'personality' | 'creative' | 'music' | 'label-insights'
  conversationState: ConversationState
  psychologicalProfile?: {
    formativeExperiences: string[]
    coreWounds: string[]
    attachmentStyle: string
    creativePsychology: string[]
    industryInsights: string[]
    growthAreas: string[]
    developmentalThemes: string[]
  }
}

interface AppState {
  // Current session
  currentSession: AnalysisSession | null
  
  // All sessions
  sessions: AnalysisSession[]
  
  // UI state
  isGenerating: boolean
  sidebarOpen: boolean
  analysisType: string
  
  // Input state
  inputText: string
  selectedImages: File[]
  
  // Conversation intelligence
  currentConversationDepth: 'surface' | 'emerging' | 'deep' | 'integration'
  lastUserEmotionalState: string
  suggestedFollowUps: string[]
  
  // Quality monitoring
  systemHealthScore: number
  totalBoundaryViolations: number
  
  // Actions
  createNewSession: (type: AnalysisSession['type']) => void
  setCurrentSession: (session: AnalysisSession | null) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateLastMessage: (content: string, validationScore?: number, violations?: string[]) => void
  deleteSession: (sessionId: string) => void
  setIsGenerating: (generating: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setAnalysisType: (type: string) => void
  setInputText: (text: string) => void
  addSelectedImage: (file: File) => void
  removeSelectedImage: (index: number) => void
  clearSelectedImages: () => void
  loadSessions: () => void
  saveSessionsToStorage: () => void
  
  // Enhanced psychological Intelligence Actions
  updateConversationState: (updates: Partial<ConversationState>) => void
  addPsychologicalInsight: (insight: PsychologicalInsight) => void
  recordBoundaryViolation: (violation: string) => void
  assessConversationDepth: () => 'surface' | 'emerging' | 'deep' | 'integration'
  generateConversationSuggestions: () => void
  updateSystemHealth: () => void
  
  // Helper methods for psychological analysis
  extractEmotionalMarkers: (text: string) => string[]
  extractPsychologicalPatterns: (text: string) => string[]
  calculateResponseQuality: (message: Message) => number
}

const createDefaultConversationState = (): ConversationState => ({
  psychological_safety_level: 5,
  topics_explored: [],
  emotional_patterns_observed: [],
  trauma_indicators: [],
  attachment_patterns: [],
  creative_psychology_insights: [],
  readiness_for_depth: 'surface',
  user_energy_level: 'curious',
  preferred_communication_style: 'reflective',
  conversation_flow_notes: [],
  boundary_violations_count: 0,
  response_quality_average: 100,
  last_validation_score: 100
})

// Enhanced helper methods for psychological analysis
const extractEmotionalMarkers = (text: string): string[] => {
  const emotionalWords = [
    'anxious', 'scared', 'excited', 'overwhelmed', 'peaceful', 'frustrated',
    'lonely', 'connected', 'vulnerable', 'safe', 'trapped', 'free',
    'angry', 'sad', 'joyful', 'numb', 'intense', 'calm', 'hopeful', 
    'devastated', 'conflicted', 'empowered', 'lost', 'grounded'
  ]
  
  const found: string[] = []
  emotionalWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      found.push(word)
    }
  })
  return [...new Set(found)] // Remove duplicates
}

const extractPsychologicalPatterns = (text: string): string[] => {
  const patterns = [
    'childhood', 'family', 'parents', 'trauma', 'anxiety', 'fear',
    'control', 'safety', 'validation', 'creativity', 'expression',
    'vulnerability', 'attachment', 'abandonment', 'criticism', 'perfectionism',
    'identity', 'healing', 'growth', 'development', 'relationship',
    'emotional regulation', 'self-worth', 'boundaries', 'trust'
  ]
  
  const found: string[] = []
  patterns.forEach(pattern => {
    if (text.toLowerCase().includes(pattern)) {
      found.push(pattern)
    }
  })
  return [...new Set(found)] // Remove duplicates
}

const calculateResponseQuality = (message: Message): number => {
  let score = 100
  
  // Deduct for boundary violations
  if (message.boundaryViolations && message.boundaryViolations.length > 0) {
    score -= message.boundaryViolations.length * 15
  }
  
  // Bonus for psychological depth
  if (message.psychologicalPatterns && message.psychologicalPatterns.length > 2) {
    score += 5
  }
  
  // Bonus for emotional awareness
  if (message.emotionalMarkers && message.emotionalMarkers.length > 0) {
    score += 5
  }
  
  return Math.max(0, Math.min(100, score))
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentSession: null,
      sessions: [],
      isGenerating: false,
      sidebarOpen: true,
      analysisType: 'personality',
      inputText: '',
      selectedImages: [],
      currentConversationDepth: 'surface',
      lastUserEmotionalState: 'neutral',
      suggestedFollowUps: [],
      systemHealthScore: 100,
      totalBoundaryViolations: 0,

      // Actions
      createNewSession: (type) => {
        console.log('Store createNewSession called with type:', type) // ADDED: Debug log
        
        const analysisTypeNames = {
          'personality': 'Personality Profile',
          'creative': 'Creative Assessment',
          'music': 'Music Psychology',
          'label-insights': 'Industry Insights'
        }

        const newSession: AnalysisSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: analysisTypeNames[type] || 'Psychology Analysis',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          type,
          conversationState: createDefaultConversationState()
        }
        
        console.log('Created session with type:', newSession.type) // ADDED: Debug log
        
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSession: newSession,
          inputText: '',
          selectedImages: [],
          currentConversationDepth: 'surface',
          suggestedFollowUps: []
        }))
        
        get().saveSessionsToStorage()
      },

      setCurrentSession: (session) => {
        const assessDepth = () => {
          if (!session) return 'surface' as const
          
          const messageCount = session.messages.length
          const userMessages = session.messages.filter(m => m.role === 'user')
          const hasDeepContent = userMessages.some(m => 
            (m.psychologicalPatterns && m.psychologicalPatterns.length > 2) ||
            (m.emotionalMarkers && m.emotionalMarkers.length > 1)
          )
          
          if (messageCount < 4) return 'surface' as const
          else if (messageCount < 8 && !hasDeepContent) return 'emerging' as const
          else if (messageCount < 15 || !hasDeepContent) return 'deep' as const
          else return 'integration' as const
        }
        
        set({ 
          currentSession: session,
          currentConversationDepth: assessDepth()
        })
      },

      addMessage: (message) => {
        const emotionalMarkers = extractEmotionalMarkers(message.content)
        const psychologicalPatterns = extractPsychologicalPatterns(message.content)
        
        const newMessage: Message = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          emotionalMarkers,
          psychologicalPatterns,
          validationScore: message.role === 'user' ? undefined : 100,
          boundaryViolations: []
        }

        set((state) => {
          if (!state.currentSession) return state

          const isFirstUserMessage = state.currentSession.messages.length === 0 && message.role === 'user'
          
          const updatedSession = {
            ...state.currentSession,
            messages: [...state.currentSession.messages, newMessage],
            updatedAt: new Date(),
            title: isFirstUserMessage 
              ? message.content.substring(0, 60) + (message.content.length > 60 ? '...' : '')
              : state.currentSession.title
          }

          const updatedSessions = state.sessions.map(session =>
            session.id === updatedSession.id ? updatedSession : session
          )

          return {
            currentSession: updatedSession,
            sessions: updatedSessions
          }
        })

        // Update conversation intelligence
        if (message.role === 'user') {
          get().assessConversationDepth()
          get().generateConversationSuggestions()
        }

        get().saveSessionsToStorage()
      },

      updateLastMessage: (content, validationScore = 100, violations = []) => {
        set((state) => {
          if (!state.currentSession || state.currentSession.messages.length === 0) {
            return state
          }

          const messages = [...state.currentSession.messages]
          const lastMessage = messages[messages.length - 1]
          
          if (lastMessage.role === 'assistant') {
            const emotionalMarkers = extractEmotionalMarkers(content)
            const psychologicalPatterns = extractPsychologicalPatterns(content)
            const qualityScore = calculateResponseQuality({
              ...lastMessage,
              content,
              boundaryViolations: violations,
              emotionalMarkers,
              psychologicalPatterns
            })
            
            messages[messages.length - 1] = {
              ...lastMessage,
              content,
              psychologicalPatterns,
              emotionalMarkers,
              validationScore: validationScore,
              boundaryViolations: violations
            }

            // Update conversation state with quality metrics
            const updatedConversationState = {
              ...state.currentSession.conversationState,
              last_validation_score: validationScore,
              boundary_violations_count: state.currentSession.conversationState.boundary_violations_count + violations.length,
              response_quality_average: (state.currentSession.conversationState.response_quality_average + qualityScore) / 2
            }

            const updatedSession = {
              ...state.currentSession,
              messages,
              conversationState: updatedConversationState,
              updatedAt: new Date()
            }

            const updatedSessions = state.sessions.map(session =>
              session.id === updatedSession.id ? updatedSession : session
            )

            return {
              currentSession: updatedSession,
              sessions: updatedSessions,
              totalBoundaryViolations: state.totalBoundaryViolations + violations.length
            }
          }

          return state
        })

        get().updateSystemHealth()
        get().saveSessionsToStorage()
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const filteredSessions = state.sessions.filter(s => s.id !== sessionId)
          const currentSession = state.currentSession?.id === sessionId 
            ? (filteredSessions[0] || null) 
            : state.currentSession

          return {
            sessions: filteredSessions,
            currentSession
          }
        })

        get().saveSessionsToStorage()
      },

      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setAnalysisType: (type) => set({ analysisType: type }),
      setInputText: (text) => set({ inputText: text }),

      addSelectedImage: (file) => {
        set((state) => ({
          selectedImages: [...state.selectedImages, file]
        }))
      },

      removeSelectedImage: (index) => {
        set((state) => ({
          selectedImages: state.selectedImages.filter((_, i) => i !== index)
        }))
      },

      clearSelectedImages: () => set({ selectedImages: [] }),

      loadSessions: () => {
        try {
          const stored = localStorage.getItem('psyche-siren-sessions')
          if (stored) {
            const sessions = JSON.parse(stored).map((session: any) => ({
              ...session,
              createdAt: new Date(session.createdAt),
              updatedAt: new Date(session.updatedAt),
              messages: session.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              })),
              conversationState: session.conversationState || createDefaultConversationState()
            }))
            
            // Calculate system health from loaded sessions
            const totalViolations = sessions.reduce((acc: number, session: AnalysisSession) => 
              acc + (session.conversationState.boundary_violations_count || 0), 0
            )
            
            set({ 
              sessions,
              totalBoundaryViolations: totalViolations,
              systemHealthScore: Math.max(0, 100 - totalViolations * 2)
            })
          }
        } catch (error) {
          console.error('Failed to load sessions from storage:', error)
        }
      },

      saveSessionsToStorage: () => {
        try {
          const { sessions } = get()
          // Filter out non-serializable properties before saving
          const serializableSessions = sessions.map(session => ({
            ...session,
            messages: session.messages.map(msg => ({
              ...msg,
              // Remove File objects and other non-serializable properties
              audioFiles: msg.audioFiles?.map(audio => ({
                name: audio.name,
                duration: audio.duration,
                analysisResult: audio.analysisResult
                // Exclude file and url as they're not serializable
              }))
            }))
          }))
          localStorage.setItem('psyche-siren-sessions', JSON.stringify(serializableSessions))
        } catch (error) {
          console.error('Failed to save sessions to storage:', error)
        }
      },

      // Enhanced Psychological Intelligence Methods
      updateConversationState: (updates) => {
        set((state) => {
          if (!state.currentSession) return state

          const updatedSession = {
            ...state.currentSession,
            conversationState: {
              ...state.currentSession.conversationState,
              ...updates
            }
          }

          const updatedSessions = state.sessions.map(session =>
            session.id === updatedSession.id ? updatedSession : session
          )

          return {
            currentSession: updatedSession,
            sessions: updatedSessions
          }
        })
      },

      addPsychologicalInsight: (insight) => {
        get().updateConversationState({
          creative_psychology_insights: [
            ...(get().currentSession?.conversationState.creative_psychology_insights || []),
            insight
          ]
        })
      },

      recordBoundaryViolation: (violation) => {
        set((state) => ({
          totalBoundaryViolations: state.totalBoundaryViolations + 1
        }))
        
        get().updateConversationState({
          boundary_violations_count: (get().currentSession?.conversationState.boundary_violations_count || 0) + 1
        })
        
        get().updateSystemHealth()
      },

      assessConversationDepth: () => {
        const { currentSession } = get()
        if (!currentSession) return 'surface'

        const messageCount = currentSession.messages.length
        const userMessages = currentSession.messages.filter(m => m.role === 'user')
        
        // Analyze depth based on content quality and quantity
        const hasEmotionalContent = userMessages.some(msg => 
          msg.emotionalMarkers && msg.emotionalMarkers.length > 0
        )
        
        const hasPsychologicalContent = userMessages.some(msg =>
          msg.psychologicalPatterns && msg.psychologicalPatterns.length > 2
        )

        const hasDeepExploration = userMessages.some(msg =>
          msg.content.length > 200 && (
            msg.content.toLowerCase().includes('childhood') ||
            msg.content.toLowerCase().includes('trauma') ||
            msg.content.toLowerCase().includes('family') ||
            msg.content.toLowerCase().includes('relationship')
          )
        )

        let depth: 'surface' | 'emerging' | 'deep' | 'integration' = 'surface'
        
        if (messageCount < 4) {
          depth = 'surface'
        } else if (messageCount < 8 || (!hasEmotionalContent && !hasPsychologicalContent)) {
          depth = 'emerging'
        } else if (messageCount < 15 || !hasDeepExploration) {
          depth = 'deep'
        } else {
          depth = 'integration'
        }

        set({ currentConversationDepth: depth })
        return depth
      },

      generateConversationSuggestions: () => {
        const { currentSession, currentConversationDepth } = get()
        if (!currentSession) return

        const suggestions: string[] = []
        const lastUserMessage = currentSession.messages
          .filter(m => m.role === 'user')
          .pop()

        if (lastUserMessage) {
          const patterns = lastUserMessage.psychologicalPatterns || []
          const emotions = lastUserMessage.emotionalMarkers || []
          
          // Generate contextual follow-up suggestions based on depth and content
          if (currentConversationDepth === 'surface') {
            suggestions.push("What draws you to explore that particular aspect of yourself?")
            suggestions.push("How does that creative process feel psychologically for you?")
          } else if (currentConversationDepth === 'emerging') {
            if (patterns.includes('childhood')) {
              suggestions.push("What early experiences shaped that pattern for you?")
            }
            if (emotions.length > 0) {
              suggestions.push("When do you first remember feeling that way?")
            }
          } else if (currentConversationDepth === 'deep') {
            suggestions.push("How has working through this changed your relationship with yourself?")
            suggestions.push("What would it look like to integrate this understanding into your daily life?")
          } else { // integration
            suggestions.push("What wisdom would you share with someone experiencing something similar?")
            suggestions.push("How do you want to continue growing in this area?")
          }
        }

        set({ suggestedFollowUps: suggestions })
      },

      updateSystemHealth: () => {
        const { totalBoundaryViolations, sessions } = get()
        
        const totalMessages = sessions.reduce((acc, session) => acc + session.messages.length, 0)
        const violationRate = totalMessages > 0 ? (totalBoundaryViolations / totalMessages) * 100 : 0
        
        const health = Math.max(0, Math.min(100, 100 - (violationRate * 10)))
        
        set({ systemHealthScore: health })
      },

      // Helper methods for psychological analysis
      extractEmotionalMarkers: (text: string): string[] => extractEmotionalMarkers(text),
      extractPsychologicalPatterns: (text: string): string[] => extractPsychologicalPatterns(text),
      calculateResponseQuality: (message: Message): number => calculateResponseQuality(message)
    }),
    {
      name: 'psyche-siren-store'
    }
  )
)