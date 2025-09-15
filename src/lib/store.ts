import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  images?: string[]
  analysisType?: string
}

export interface AnalysisSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  type: 'personality' | 'creative' | 'music' | 'label-insights'
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
  
  // Actions
  createNewSession: (type: AnalysisSession['type']) => void
  setCurrentSession: (session: AnalysisSession | null) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateLastMessage: (content: string) => void
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

      // Actions
      createNewSession: (type) => {
        const newSession: AnalysisSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Analysis`,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          type
        }
        
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSession: newSession,
          inputText: '',
          selectedImages: []
        }))
        
        get().saveSessionsToStorage()
      },

      setCurrentSession: (session) => set({ currentSession: session }),

      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        }

        set((state) => {
          if (!state.currentSession) return state

          const updatedSession = {
            ...state.currentSession,
            messages: [...state.currentSession.messages, newMessage],
            updatedAt: new Date(),
            title: state.currentSession.messages.length === 0 
              ? message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
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

        get().saveSessionsToStorage()
      },

      updateLastMessage: (content) => {
        set((state) => {
          if (!state.currentSession || state.currentSession.messages.length === 0) {
            return state
          }

          const messages = [...state.currentSession.messages]
          const lastMessage = messages[messages.length - 1]
          
          if (lastMessage.role === 'assistant') {
            messages[messages.length - 1] = {
              ...lastMessage,
              content
            }
          }

          const updatedSession = {
            ...state.currentSession,
            messages,
            updatedAt: new Date()
          }

          const updatedSessions = state.sessions.map(session =>
            session.id === updatedSession.id ? updatedSession : session
          )

          return {
            currentSession: updatedSession,
            sessions: updatedSessions
          }
        })

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
              }))
            }))
            set({ sessions })
          }
        } catch (error) {
          console.error('Failed to load sessions from storage:', error)
        }
      },

      saveSessionsToStorage: () => {
        try {
          const { sessions } = get()
          localStorage.setItem('psyche-siren-sessions', JSON.stringify(sessions))
        } catch (error) {
          console.error('Failed to save sessions to storage:', error)
        }
      }
    }),
    {
      name: 'psyche-siren-store'
    }
  )
)