import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API configuration optimized for fine-tuned Gemma 3 4B
export const API_CONFIG = {
  BASE_URL: "/api",
  ENDPOINTS: {
    HEALTH: "/health",
    GENERATE: "/generate", 
    CHAT_COMPLETIONS: "/chat/completions"
  },
  DEFAULT_PARAMS: {
    max_tokens: 300,         // Balanced for analysis depth
    temperature: 1.0,        // Gemma team optimal
    top_p: 0.95,            // Gemma team optimal
    top_k: 64,              // Gemma team optimal
    min_p: 0.0,             // Gemma team optimal
    do_sample: true,        
    repetition_penalty: 1.0  
  }
} as const

// MATCHED TO YOUR TRAINING DATA: Character analysis format prompts
export const PSYCHE_SIREN_PROMPTS = {
  PERSONALITY_PROFILE: `Analyze this individual's psychological patterns using established frameworks. Provide analysis in exactly 2-3 sentences, then ask ONE strategic follow-up question.

Format your analysis like character profiling: identify psychological patterns, cultural influences, and personality indicators. Reference frameworks like MBTI, Big Five, attachment theory, or cultural psychology when relevant.

CRITICAL: You are analyzing THEIR patterns, not describing your own experiences. Use "This person shows..." not "I notice..."`,

  CREATIVE_ASSESSMENT: `Analyze this artist's creative psychology using established psychological frameworks. Provide analysis in exactly 2-3 sentences, then ask ONE strategic follow-up question about their creative process.

Draw from psychological frameworks about creativity, personality, and cultural identity. Reference how cultural background, attachment patterns, or personality factors influence their creative expression.

CRITICAL: You are analyzing THEIR creative psychology, not sharing your own creative experiences.`,

  MUSIC_PSYCHOLOGY: `Analyze this person's relationship with music using psychological frameworks. Provide analysis in exactly 2-3 sentences, then ask ONE strategic question about their musical connection.

Consider how personality, cultural background, emotional regulation patterns, and attachment styles influence their musical preferences and emotional responses.

CRITICAL: You are analyzing THEIR musical psychology, not describing your own relationship with music.`,

  LABEL_INSIGHTS: `Analyze this artist's professional creative patterns for industry insight. Provide analysis in exactly 2-3 sentences, then ask ONE strategic question about their work dynamics.

Consider personality factors affecting collaboration, cultural influences on their professional approach, attachment patterns in creative relationships, and psychological drivers for their career choices.

CRITICAL: You are analyzing THEIR professional psychology, not sharing your own industry experience.`
} as const

// Conversation starters matching your training approach
export const CONVERSATION_STARTERS = {
  CULTURAL_IDENTITY: "Share some background about your cultural identity and how it influences your creative expression.",
  
  CREATIVE_PATTERNS: "Describe a recent creative project and what psychological needs it fulfilled for you.",
  
  MUSICAL_CONNECTION: "Tell me about a piece of music that had a strong psychological impact on you recently.",
  
  COLLABORATION_STYLE: "Describe how you typically handle creative feedback and collaboration in your work.",
  
  FORMATIVE_INFLUENCE: "Share about a cultural or creative influence that shaped your artistic identity.",
  
  EMOTIONAL_REGULATION: "How do you use creativity or music to manage difficult emotions or stress?",
  
  IDENTITY_FORMATION: "Describe how your creative work connects to your sense of personal or cultural identity.",
  
  PROFESSIONAL_DYNAMICS: "Tell me about your approach to creative partnerships and professional relationships.",
  
  CULTURAL_EXPRESSION: "How does your cultural background show up in your artistic choices and creative voice?",
  
  PSYCHOLOGICAL_PATTERNS: "Share a pattern you've noticed in your creative process or artistic development."
} as const

// Enhanced validation for fine-tuned model boundaries
export function validatePsychologyAnalysis(response: string, userMessage: string): string[] {
  const warnings: string[] = []
  
  // CRITICAL: Check for AI claiming personal experiences
  const personalExperience = response.match(/I (have|notice|experience|gravitate|feel|prefer|tend to|usually|often|sometimes|find|see|observe|think|believe|remember|know from experience)/gi)
  if (personalExperience) {
    warnings.push("CRITICAL: AI claiming personal experiences")
  }
  
  // Check for proper analytical language
  const hasAnalyticalLanguage = response.match(/(this suggests|this indicates|this pattern|research shows|many people|psychological frameworks|personality research|cultural psychology)/gi)
  if (!hasAnalyticalLanguage && response.length > 100) {
    warnings.push("WARNING: Missing professional psychological analysis language")
  }
  
  // Check for cultural/personality framework usage
  const hasFrameworks = response.match(/(MBTI|Big Five|attachment|cultural|personality|psychological|framework|pattern|style|trait)/gi)
  if (!hasFrameworks && response.length > 100) {
    warnings.push("WARNING: Missing psychological frameworks")
  }
  
  // Check for appropriate length
  if (response.length > 400) {
    warnings.push("WARNING: Response too long for conversational analysis")
  }
  
  // Check for strategic questioning
  const questionCount = (response.match(/\?/g) || []).length
  if (response.length > 100 && questionCount === 0) {
    warnings.push("WARNING: Missing strategic follow-up question")
  }
  
  return warnings
}

// Create prompts that match your training data format
export function createAnalysisPrompt(systemPrompt: string, userMessage: string, sessionType: string): string {
  // Match your training format: "Analyze [subject] → [framework] → [score/insight]"
  return `${systemPrompt}

ANALYSIS TARGET: Individual seeking creative/psychological understanding
CULTURAL CONTEXT: [To be determined from their sharing]
FRAMEWORKS TO CONSIDER: MBTI, Big Five, Attachment Theory, Cultural Psychology, Creative Psychology

USER DESCRIPTION: ${userMessage}

Provide psychological analysis in 2-3 sentences, then ask ONE strategic question to deepen understanding.`
}

// Safe redirects when validation fails - matched to analytical approach
export const SAFE_REDIRECTS = {
  cultural_analysis: "What aspects of your cultural background most influence your creative expression?",
  personality_insight: "What personality patterns do you recognize in your creative process?",
  creative_psychology: "How do you see your creative work serving your psychological needs?",
  musical_analysis: "What psychological role does music play in your emotional regulation?",
  collaboration_patterns: "What patterns do you notice in how you work with creative partners?",
  identity_formation: "How has your creative identity evolved over time?",
  attachment_exploration: "How do you typically handle criticism or feedback on your creative work?",
  cultural_expression: "What aspects of your cultural identity show up most in your artistic choices?"
}

// Enhanced safe response creation
export function createSafeAnalysisResponse(userMessage: string, violations: string[]): string {
  const lowerMessage = userMessage.toLowerCase()
  
  // Route based on psychological content
  if (lowerMessage.includes('cultur') || lowerMessage.includes('background') || lowerMessage.includes('identity')) {
    return SAFE_REDIRECTS.cultural_analysis
  }
  
  if (lowerMessage.includes('music') || lowerMessage.includes('song') || lowerMessage.includes('sound')) {
    return SAFE_REDIRECTS.musical_analysis
  }
  
  if (lowerMessage.includes('creative') || lowerMessage.includes('art') || lowerMessage.includes('express')) {
    return SAFE_REDIRECTS.creative_psychology
  }
  
  if (lowerMessage.includes('work') || lowerMessage.includes('collaborat') || lowerMessage.includes('partner')) {
    return SAFE_REDIRECTS.collaboration_patterns
  }
  
  if (lowerMessage.includes('pattern') || lowerMessage.includes('personality') || lowerMessage.includes('trait')) {
    return SAFE_REDIRECTS.personality_insight
  }
  
  // Default to identity formation for general psychological exploration
  return SAFE_REDIRECTS.identity_formation
}

// Post-processing correction for boundary violations
export function correctAnalysisLanguage(response: string): string {
  return response
    // Fix first-person claims
    .replace(/I've noticed that/gi, "This suggests that")
    .replace(/I tend to/gi, "You appear to")
    .replace(/I gravitate towards/gi, "You seem drawn to")
    .replace(/I usually/gi, "You typically")
    .replace(/I find that/gi, "Research indicates that")
    .replace(/I see/gi, "This analysis reveals")
    .replace(/I think/gi, "This suggests")
    .replace(/I believe/gi, "The pattern indicates")
    .replace(/I've experienced/gi, "Many people experience")
    // Enhance psychological language
    .replace(/You are/gi, "Your psychological profile suggests you are")
    .replace(/This means/gi, "From a psychological perspective, this indicates")
}

// Assessment functions for stakeholder insights
export interface PsychologicalProfile {
  personality_indicators: string[]
  cultural_influences: string[]
  attachment_patterns: string[]
  creative_psychology: string[]
  collaboration_style: string[]
  emotional_regulation: string[]
  professional_insights: string[]
}

export function generateStakeholderInsights(profile: PsychologicalProfile, stakeholder: string): string[] {
  const insights: string[] = []
  
  switch (stakeholder) {
    case 'label':
      insights.push(...profile.creative_psychology.map(p => `Creative Driver: ${p}`))
      insights.push(...profile.cultural_influences.map(p => `Market Positioning: ${p}`))
      insights.push(...profile.collaboration_style.map(p => `Team Compatibility: ${p}`))
      break
      
    case 'manager':
      insights.push(...profile.attachment_patterns.map(p => `Communication Style: ${p}`))
      insights.push(...profile.emotional_regulation.map(p => `Stress Management: ${p}`))
      insights.push(...profile.professional_insights.map(p => `Career Development: ${p}`))
      break
      
    case 'producer':
      insights.push(...profile.creative_psychology.map(p => `Creative Flow: ${p}`))
      insights.push(...profile.collaboration_style.map(p => `Studio Dynamics: ${p}`))
      insights.push(...profile.emotional_regulation.map(p => `Creative Process: ${p}`))
      break
      
    case 'marketer':
      insights.push(...profile.cultural_influences.map(p => `Authentic Narrative: ${p}`))
      insights.push(...profile.personality_indicators.map(p => `Brand Personality: ${p}`))
      insights.push(...profile.creative_psychology.map(p => `Artistic Voice: ${p}`))
      break
  }
  
  return insights
}

// Utility functions
export function generateSessionId(): string {
  return `psyche_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 10 * 1024 * 1024 // 10MB
  return validTypes.includes(file.type) && file.size <= maxSize
}

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

export function extractCulturalPsychologyPatterns(text: string): string[] {
  const patterns = [
    'cultural', 'identity', 'heritage', 'background', 'tradition', 'community',
    'family', 'values', 'beliefs', 'customs', 'language', 'ethnicity',
    'attachment', 'secure', 'anxious', 'avoidant', 'relationships', 'trust',
    'creativity', 'expression', 'artistic', 'music', 'visual', 'performance',
    'collaboration', 'feedback', 'criticism', 'control', 'autonomy', 'teamwork',
    'personality', 'trait', 'pattern', 'behavior', 'emotion', 'regulation'
  ]
  
  const found: string[] = []
  patterns.forEach(pattern => {
    if (text.toLowerCase().includes(pattern)) {
      found.push(pattern)
    }
  })
  return found
}

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