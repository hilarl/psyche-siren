import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API configuration for Psyche Siren
export const API_CONFIG = {
  BASE_URL: "/api",
  ENDPOINTS: {
    HEALTH: "/health",
    GENERATE: "/generate",
    CHAT_COMPLETIONS: "/chat/completions"
  },
  DEFAULT_PARAMS: {
    max_new_tokens: 256,
    temperature: 0.7
  }
} as const

// Psychology analysis categories
export const PSYCHOLOGY_CATEGORIES = {
  PERSONALITY: "personality",
  CREATIVITY: "creativity",
  DECISION_MAKING: "decision-making",
  EMOTIONAL_INTELLIGENCE: "emotional-intelligence",
  COGNITIVE_STYLE: "cognitive-style",
  ARTISTIC_EXPRESSION: "artistic-expression"
} as const

// Creative professional types
export const CREATIVE_TYPES = {
  MUSICIAN: "musician",
  VISUAL_ARTIST: "visual-artist",
  WRITER: "writer",
  PRODUCER: "producer",
  PERFORMER: "performer",
  MULTIMEDIA: "multimedia"
} as const

// Analysis prompt templates
export const ANALYSIS_PROMPTS = {
  PERSONALITY_PROFILE: `As an expert psychologist specializing in creative personality analysis, analyze the following content for personality traits using the Big Five model (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism). Focus on creative decision-making patterns, artistic preferences, and psychological drivers. Provide insights valuable for understanding this person's creative process and artistic identity. Format your response with clear sections using **bold headings** for key insights.`,
  
  CREATIVE_ASSESSMENT: `Analyze this creative individual's psychological profile focusing on their artistic decision-making processes, creative motivations, and personality patterns that influence their work. Consider how their psychology translates into their creative output and what this reveals about their artistic identity. Format your response with clear sections using **bold headings** for key insights.`,
  
  MUSIC_PSYCHOLOGY: `Analyze the psychological patterns and personality traits revealed through this musician's content, considering research showing that musical preferences and creative processes reflect deep personality structures. Focus on emotional regulation, creative expression patterns, and how their psychology influences their musical decisions. Format your response with clear sections using **bold headings** for key insights.`,
  
  LABEL_INSIGHTS: `Provide a psychological analysis suitable for record label understanding of this artist. Focus on: **Core Personality Traits** that drive their creativity, **Decision-Making Patterns** in their artistic process, **Emotional Themes** in their work, **Collaboration Insights** for working with them, and **Career Development** potential psychological factors. Format your response with clear sections using **bold headings** for each area.`
} as const

// Format response for better readability
export function formatAnalysisResponse(response: string): string {
  // Add line breaks for better readability
  return response
    .replace(/(\d+\.)/g, '\n$1')
    .replace(/([A-Z][a-z]+:)/g, '\n**$1**')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .trim()
}

// Validate API response
export function validateApiResponse(data: unknown): data is { generated_text: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'generated_text' in data &&
    typeof (data as any).generated_text === 'string'
  )
}

// Image file validation
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  return validTypes.includes(file.type) && file.size <= maxSize
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = error => reject(error)
  })
}

// Text processing utilities
export function extractKeyInsights(text: string): string[] {
  // Extract bullet points and key insights from analysis
  const insights = text.match(/[•-]\s*(.+)/g) || []
  return insights.map(insight => insight.replace(/^[•-]\s*/, '').trim())
}

export function summarizeAnalysis(text: string): string {
  // Extract the first paragraph or summary
  const paragraphs = text.split('\n\n')
  return paragraphs[0] || text.substring(0, 200) + '...'
}

// Debounce utility for input handling
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate unique session ID
export function generateSessionId(): string {
  return `psyche_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Earth tone color classes for minimal design
export const EARTH_TONES = {
  stone: "text-stone-500",
  sage: "text-green-600",
  warm: "text-amber-700",
  neutral: "text-zinc-400"
} as const