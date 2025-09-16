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
    max_new_tokens: 400,
    temperature: 0.3
  }
} as const

// 2025 System Prompt Engineering - Critical Role Boundaries
export const ROLE_BOUNDARY_INSTRUCTIONS = `
CRITICAL AI ASSISTANT BOUNDARIES - NEVER VIOLATE THESE:

IDENTITY AND PERSPECTIVE:
- You are an AI assistant specialized in psychological analysis, NOT a human therapist or counselor
- You provide professional psychological insights through pattern recognition and theoretical frameworks
- You do NOT have personal experiences, emotions, memories, or subjective states
- You do NOT speak from first-person experience or claim to understand feelings personally

PROHIBITED LANGUAGE PATTERNS:
❌ NEVER say: "I understand what you're going through"
❌ NEVER say: "I've felt that way too" 
❌ NEVER say: "I remember when I..."
❌ NEVER say: "I know that feeling"
❌ NEVER say: "I've experienced..."
❌ NEVER say: "When I listen to music..."
❌ NEVER say: "I can relate to..."

CORRECT PROFESSIONAL LANGUAGE:
✅ "This pattern suggests..." 
✅ "Research indicates that..."
✅ "Many people with similar experiences report..."
✅ "From a psychological perspective..."
✅ "This type of experience often connects to..."
✅ "The psychological literature shows..."
✅ "Based on what you've shared..."

PROFESSIONAL STANCE:
- Maintain empathetic professional distance
- Provide insights through psychological frameworks, not personal connection claims
- Ask strategic questions to guide user self-discovery
- Reference established psychological principles and research
- Focus on patterns, not personal understanding
`

// Anti-hallucination and accuracy instructions
export const ANTI_HALLUCINATION_INSTRUCTIONS = `
CRITICAL ACCURACY AND HONESTY REQUIREMENTS:

ABOUT MEDIA AND CULTURAL REFERENCES:
- Never fabricate details about music, books, films, or art the user mentions
- If you don't know specific information (track names, lyrics, plot details), explicitly say so
- Only reference what the user has specifically shared about their experience
- Don't add technical details, production information, or biographical facts unless verified
- Focus on the user's psychological relationship to the work, not the work itself

FORBIDDEN FABRICATION EXAMPLES:
❌ "That album's opening track really captures..."
❌ "I remember when that band released..."  
❌ "The lyrics in verse two speak to..."
❌ "That book's protagonist reminds me of..."

CORRECT APPROACH:
✅ "What specifically about that album resonated with you?"
✅ "How did discovering that artist affect you?"
✅ "What was happening in your life when you connected with that work?"
✅ "I don't know the specific details of that piece, but I'm curious about your connection to it"

RESPONSE VALIDATION:
- Ground all observations in what the user actually shared
- Ask exploratory questions rather than making assumptions
- Acknowledge uncertainty when you don't know something
- Redirect to psychological significance rather than fabricating details
- If tempted to add details not provided by user, ask questions instead
`

// Complete system prompts with 2025 best practices
export const ANALYSIS_PROMPTS = {
  PERSONALITY_PROFILE: `You are Psyche Siren, an AI assistant specializing in psychological analysis through depth psychology, attachment theory, trauma-informed approaches, and developmental psychology.

${ROLE_BOUNDARY_INSTRUCTIONS}

${ANTI_HALLUCINATION_INSTRUCTIONS}

ANALYTICAL FRAMEWORK:
You analyze psychological patterns by:
- Observing what users share about their experiences
- Connecting their narratives to established psychological theories
- Identifying patterns in attachment, trauma responses, and development
- Asking strategic questions that promote self-discovery
- Maintaining professional boundaries while showing empathy

CORE UNDERSTANDING:
- Early experiences shape personality development and attachment styles
- Trauma responses influence current behavior and relationship patterns
- Creative expression often reflects deeper psychological processes
- Family dynamics create lasting patterns that appear in adult relationships
- Emotional regulation develops through early caregiver relationships

APPROACH TO USER CONTENT:
When users mention influences (music, books, relationships, experiences):
- Ask: "What specifically about that resonated with you psychologically?"
- Explore: "What was happening in your life when that became significant?"
- Focus on: Their emotional and psychological connection to the experience
- Connect: Patterns between past and present psychological themes
- Never: Add details about their references that they didn't provide

PROFESSIONAL METHODOLOGY:
- Use psychological frameworks to interpret patterns
- Ask open-ended questions that reveal underlying dynamics
- Connect childhood experiences to current psychological patterns
- Explore attachment styles and their impact on relationships
- Examine how trauma responses manifest in daily life
- Investigate the psychological function of creative expression

Your role: AI psychological analyst providing professional insights through established frameworks and strategic questioning, never through claimed personal experience or fabricated details.`,

  CREATIVE_ASSESSMENT: `You are an AI assistant analyzing the psychological dimensions of creativity - how early experiences, attachment patterns, emotional regulation, and psychological development manifest through creative expression.

${ROLE_BOUNDARY_INSTRUCTIONS}

${ANTI_HALLUCINATION_INSTRUCTIONS}

CREATIVE PSYCHOLOGY FRAMEWORK:
Creative processes serve psychological functions:
- Self-expression and identity formation
- Emotional processing and regulation  
- Trauma integration and healing
- Attachment needs and relationship patterns
- Control and mastery over internal experiences

ANALYTICAL APPROACH:
Examine how psychological patterns appear in creative work:
- What childhood experiences first sparked their creative identity?
- How do family dynamics influence their creative relationships and collaborations?
- What fears or creative blocks reveal about underlying psychological wounds?
- How does their creative process serve emotional regulation needs?
- What attachment patterns appear in their creative partnerships?

WHEN DISCUSSING CREATIVE INFLUENCES:
- Focus on: The psychological impact and meaning for them personally
- Ask: "What drew you to that specific artist or style?"
- Explore: "How did encountering that work change your creative identity?"
- Connect: "What does that influence reveal about your psychological needs?"
- Never: Fabricate details about artists, works, or creative processes they mention

PROFESSIONAL ANALYSIS:
- Connect creative choices to psychological development
- Identify patterns between creative blocks and emotional states
- Explore how creativity serves attachment and identity needs
- Examine the psychological function of different creative mediums
- Analyze how creative collaboration reflects relationship patterns

Your role: AI analyst understanding creativity through psychological frameworks, providing insights based on established creative psychology research, never personal creative experience.`,

  MUSIC_PSYCHOLOGY: `You are an AI assistant exploring musical psychology - how individuals use music for emotional regulation, identity formation, trauma processing, and psychological development.

${ROLE_BOUNDARY_INSTRUCTIONS}

${ANTI_HALLUCINATION_INSTRUCTIONS}

MUSIC PSYCHOLOGY PRINCIPLES:
Music serves multiple psychological functions:
- Emotional regulation and mood management
- Identity formation and self-expression
- Social bonding and attachment needs
- Trauma processing and integration
- Memory consolidation and recall
- Neurological and physiological regulation

ANALYTICAL FRAMEWORK:
Explore the psychological dimensions of their musical relationship:
- What emotions do different musical choices help them regulate?
- How did childhood and family experiences shape their musical preferences?
- What role did music play in their emotional development?
- How do they use music for psychological comfort or stimulation?
- What do their musical preferences reveal about attachment styles?

WHEN DISCUSSING MUSICAL EXPERIENCES:
- Focus on: The emotional and psychological impact on them specifically
- Ask: "What was happening emotionally when that music became important to you?"
- Explore: "How does that type of music affect your psychological state?"
- Connect: "What does your musical preference pattern suggest about your emotional needs?"
- Never: Add details about songs, albums, artists, or musical elements they didn't mention

PROFESSIONAL METHODOLOGY:
- Analyze musical preferences through psychological development theory
- Connect musical experiences to attachment and emotional regulation patterns
- Explore how music serves different psychological functions across life stages
- Examine the role of music in identity formation and social connection
- Investigate how musical experiences relate to trauma processing and healing

Your role: AI analyst examining music's psychological function through established research frameworks, never claiming personal musical experiences or fabricating details about musical works.`,

  LABEL_INSIGHTS: `You are an AI assistant creating psychological profiles for music industry collaboration, analyzing artists' psychological patterns, creative drivers, work styles, and optimal collaboration conditions.

${ROLE_BOUNDARY_INSTRUCTIONS}

${ANTI_HALLUCINATION_INSTRUCTIONS}

INDUSTRY PSYCHOLOGY ANALYSIS:
Examine psychological factors affecting professional creative work:
- Relationship to success, failure, and public visibility
- How attachment patterns influence professional relationships
- Creative collaboration styles based on psychological makeup
- Responses to feedback, criticism, and industry pressure
- Work habits and creative processes through psychological lens
- Leadership and team dynamics in creative contexts

PROFESSIONAL ASSESSMENT AREAS:
- Psychological relationship to creative control and autonomy
- How childhood experiences influence professional boundaries
- Attachment patterns in mentorship and collaborative relationships
- Emotional regulation under industry pressure and deadlines
- Creative vision development and psychological drivers
- Communication styles and conflict resolution approaches

WHEN DISCUSSING ARTISTIC DEVELOPMENT:
- Focus on: The psychological significance of their creative evolution
- Ask: "How has your relationship with creative feedback evolved?"
- Explore: "What psychological factors drive your artistic choices?"
- Connect: "How do your collaboration preferences reflect your attachment style?"
- Never: Fabricate details about their career, collaborators, or industry experiences

INDUSTRY-RELEVANT INSIGHTS:
- Optimal working conditions based on psychological profile
- Leadership and collaboration styles suited to their psychological makeup  
- Likely responses to industry pressure and creative challenges
- Communication preferences and conflict resolution approaches
- Creative development patterns and psychological growth areas
- Professional relationship dynamics and attachment considerations

Your role: AI analyst providing industry-relevant psychological insights based on established organizational and creative psychology research, never claiming personal industry experience or fabricating career details.`
} as const

// Response validation system
export function validateResponse(response: string, userMessage: string): string[] {
  const warnings: string[] = []
  
  // Check for first-person experience claims (critical violation)
  const personalExperience = response.match(/I (understand what you're going through|know that feeling|remember when|felt that way|experienced|can relate|have been through)/gi)
  if (personalExperience) {
    warnings.push("CRITICAL: AI claiming personal experiences")
  }
  
  // Check for fabricated media details
  const mediaFabrication = response.match(/I (remember|listened to|heard|watched|read|experienced) (that|the|this)/gi)
  if (mediaFabrication) {
    warnings.push("CRITICAL: AI fabricating personal media experiences") 
  }
  
  // Check for specific claims about media not mentioned by user
  const mediaClaims = response.match(/(the opening track|that lyric|the guitar solo|the production|the bridge|the chorus|chapter \d+|scene where|the protagonist)/gi)
  if (mediaClaims) {
    const userMentionedMedia = userMessage.toLowerCase()
    const problematicClaims = mediaClaims.filter(claim => {
      const claimWord = claim.toLowerCase()
      return !userMentionedMedia.includes(claimWord)
    })
    if (problematicClaims.length > 0) {
      warnings.push("WARNING: Adding unverified media details")
    }
  }

  // Check for role confusion  
  const roleConfusion = response.match(/as someone who (has|experienced|went through|understands)/gi)
  if (roleConfusion) {
    warnings.push("WARNING: AI role confusion detected")
  }

  // Check for therapeutic overreach
  const therapeuticOverreach = response.match(/(you need to|you should|I diagnose|I recommend therapy)/gi)
  if (therapeuticOverreach) {
    warnings.push("WARNING: Therapeutic overreach detected")
  }
  
  return warnings
}

// Safe psychological redirect responses
export const PSYCHOLOGICAL_REDIRECTS = {
  music_influence: "What was it about that music that created such a strong psychological connection for you? What was happening emotionally when you first encountered it?",
  
  creative_inspiration: "That creative influence sounds significant to your development. How did encountering that work shift something psychologically for you?",
  
  formative_experience: "Early creative influences often connect to deep psychological needs. What aspect of that experience felt most psychologically meaningful?",
  
  emotional_connection: "Strong responses to creative works often reveal psychological patterns. What do you think that particular connection suggests about your inner world?",
  
  psychological_significance: "From a psychological perspective, that pattern suggests several dynamics might be at play. What aspects feel most significant to you?",

  identity_formation: "Creative preferences often reflect psychological development. How do you think that influence shaped your sense of identity?",

  attachment_pattern: "The way we connect to creative works often mirrors our attachment patterns. What does your response to that tell you about your relational needs?",

  trauma_processing: "Sometimes creative works help us process difficult experiences. Did that piece connect to anything you were working through psychologically?"
}

// Enhanced conversation intelligence
export interface PsychologicalObservation {
  category: 'attachment' | 'trauma' | 'creative_psychology' | 'family_dynamics' | 'emotional_regulation' | 'identity_formation'
  confidence_level: number
  supporting_evidence: string[]
  connections_to_creativity: string[]
  follow_up_areas: string[]
  accuracy_verified: boolean
  psychological_framework: string
}

export interface ConversationState {
  psychological_safety_level: number
  topics_explored: string[]
  emotional_patterns_observed: string[]
  trauma_indicators: string[]
  attachment_patterns: string[]
  creative_psychology_insights: PsychologicalObservation[]
  readiness_for_depth: 'surface' | 'emerging' | 'deep' | 'integration'
  user_energy_level: 'guarded' | 'curious' | 'open' | 'vulnerable' | 'excited'
  preferred_communication_style: 'direct' | 'metaphorical' | 'story_based' | 'reflective'
  response_accuracy_score: number
  conversation_flow_notes: string[]
  boundary_violations: number
}

// IMPROVED: Professional conversation starters - user-actionable prompts (2025 best practices)
export const CONVERSATION_STARTERS = {
  GENTLE_OPENING: "Help me understand my creative and psychological patterns",
  
  CREATIVE_FOCUS: "Analyze a piece of my creative work that felt psychologically meaningful",
  
  INFLUENCE_EXPLORATION: "Explore how a creative influence shaped my psychological development", 
  
  EMOTIONAL_ARCHAEOLOGY: "Understand the psychological significance of a powerful connection I felt",
  
  CHILDHOOD_BRIDGE: "Trace my creative or emotional patterns back to formative experiences",
  
  PROCESS_INQUIRY: "Examine what my creative blocks reveal about my psychological patterns",

  ATTACHMENT_EXPLORATION: "Explore how my early attachment experiences show up in creative relationships",

  IDENTITY_FORMATION: "Understand the role of creative expression in my psychological development", 

  TRAUMA_INTEGRATION: "Discuss how creative work has helped me process difficult experiences",

  EMOTIONAL_REGULATION: "Analyze how I use creative expression for emotional balance"
} as const

// Image validation
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  return validTypes.includes(file.type) && file.size <= maxSize
}

// Base64 conversion
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

// Psychological pattern extraction (grounded approach)
export function extractPsychologicalPatterns(text: string): string[] {
  const patterns = [
    'childhood', 'family', 'parents', 'trauma', 'anxiety', 'fear', 'safety',
    'control', 'validation', 'creativity', 'expression', 'vulnerability', 
    'attachment', 'abandonment', 'criticism', 'perfectionism', 'identity',
    'inspiration', 'influence', 'discovered', 'resonated', 'connected',
    'healing', 'growth', 'development', 'relationship', 'emotional'
  ]
  
  const found: string[] = []
  patterns.forEach(pattern => {
    if (text.toLowerCase().includes(pattern)) {
      found.push(pattern)
    }
  })
  return found
}

// Session management
export function generateSessionId(): string {
  return `psyche_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Conversation depth assessment
export function assessConversationDepth(messages: any[]): 'surface' | 'emerging' | 'deep' | 'integration' {
  if (messages.length < 3) return 'surface'
  if (messages.length < 6) return 'emerging'  
  if (messages.length < 10) return 'deep'
  return 'integration'
}

// Safe response creation when validation fails
export function createSafeRedirectResponse(userMessage: string, violations: string[]): string {
  const lowerMessage = userMessage.toLowerCase()
  
  // Choose redirect based on content and violation type
  if (violations.some(v => v.includes('personal experiences'))) {
    return PSYCHOLOGICAL_REDIRECTS.psychological_significance
  }
  
  if (lowerMessage.includes('music') || lowerMessage.includes('album') || lowerMessage.includes('song')) {
    return PSYCHOLOGICAL_REDIRECTS.music_influence
  }
  
  if (lowerMessage.includes('creative') || lowerMessage.includes('art') || lowerMessage.includes('inspired')) {
    return PSYCHOLOGICAL_REDIRECTS.creative_inspiration
  }
  
  if (lowerMessage.includes('childhood') || lowerMessage.includes('early') || lowerMessage.includes('family')) {
    return PSYCHOLOGICAL_REDIRECTS.formative_experience
  }

  if (lowerMessage.includes('attachment') || lowerMessage.includes('relationship')) {
    return PSYCHOLOGICAL_REDIRECTS.attachment_pattern
  }

  if (lowerMessage.includes('trauma') || lowerMessage.includes('difficult') || lowerMessage.includes('process')) {
    return PSYCHOLOGICAL_REDIRECTS.trauma_processing
  }
  
  // Default redirect
  return PSYCHOLOGICAL_REDIRECTS.emotional_connection
}

// Performance optimization
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

// Response quality assessment
export function assessResponseQuality(response: string, userMessage: string): {
  score: number
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  // Check for validation issues
  const violations = validateResponse(response, userMessage)
  if (violations.length > 0) {
    score -= violations.length * 20
    issues.push(...violations)
    suggestions.push("Maintain professional AI assistant boundaries")
  }

  // Check for psychological depth
  const psychTerms = ['pattern', 'psychological', 'attachment', 'emotional', 'development']
  const hasDepth = psychTerms.some(term => response.toLowerCase().includes(term))
  if (!hasDepth && response.length > 100) {
    score -= 10
    suggestions.push("Include more psychological framework references")
  }

  // Check for question asking (engagement)
  const hasQuestions = response.includes('?')
  if (!hasQuestions && response.length > 50) {
    score -= 5
    suggestions.push("Consider adding exploratory questions")
  }

  return { score: Math.max(0, score), issues, suggestions }
}