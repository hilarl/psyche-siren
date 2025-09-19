import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Document analysis for psychology - comprehensive text analysis
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

async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Use pdfplumber for better text extraction
    const pythonScript = `
import pdfplumber
import sys

try:
    with pdfplumber.open('${filePath}') as pdf:
        text = ""
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\\n\\n"
        print(text.strip())
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`
    
    const tempScriptPath = join('/tmp', `extract_pdf_${randomUUID()}.py`)
    await writeFile(tempScriptPath, pythonScript)
    
    try {
      const { stdout, stderr } = await execAsync(`python3 ${tempScriptPath}`)
      await unlink(tempScriptPath)
      
      if (stderr && stderr.includes('Error:')) {
        throw new Error(stderr)
      }
      
      return stdout.trim()
    } catch (error) {
      await unlink(tempScriptPath).catch(() => {})
      throw error
    }
  } catch (error) {
    console.warn('pdfplumber failed, trying pypdf:', error)
    
    // Fallback to pypdf
    const pythonScript = `
import pypdf
import sys

try:
    with open('${filePath}', 'rb') as file:
        reader = pypdf.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\\n\\n"
        print(text.strip())
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`
    
    const tempScriptPath = join('/tmp', `extract_pdf_pypdf_${randomUUID()}.py`)
    await writeFile(tempScriptPath, pythonScript)
    
    try {
      const { stdout, stderr } = await execAsync(`python3 ${tempScriptPath}`)
      await unlink(tempScriptPath)
      
      if (stderr && stderr.includes('Error:')) {
        throw new Error(stderr)
      }
      
      return stdout.trim()
    } catch (error) {
      await unlink(tempScriptPath).catch(() => {})
      throw error
    }
  }
}

async function extractTextFromDocx(filePath: string): Promise<string> {
  try {
    // Use python-docx for Word document extraction
    const pythonScript = `
import docx
import sys

try:
    doc = docx.Document('${filePath}')
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\\n"
    print(text.strip())
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`
    
    const tempScriptPath = join('/tmp', `extract_docx_${randomUUID()}.py`)
    await writeFile(tempScriptPath, pythonScript)
    
    try {
      const { stdout, stderr } = await execAsync(`python3 ${tempScriptPath}`)
      await unlink(tempScriptPath)
      
      if (stderr && stderr.includes('Error:')) {
        throw new Error(stderr)
      }
      
      return stdout.trim()
    } catch (error) {
      await unlink(tempScriptPath).catch(() => {})
      
      // Fallback to pandoc if python-docx fails
      try {
        const { stdout } = await execAsync(`pandoc "${filePath}" -t plain`)
        return stdout.trim()
      } catch (pandocError) {
        const pandocErrorMessage = pandocError instanceof Error ? pandocError.message : 'Unknown pandoc error'
        const originalErrorMessage = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Both docx extraction methods failed: ${originalErrorMessage} | ${pandocErrorMessage}`)
      }
    }
  } catch (error) {
    throw error
  }
}

async function extractTextFromDocument(filePath: string, fileType: string): Promise<string> {
  switch (fileType) {
    case 'application/pdf':
      return await extractTextFromPDF(filePath)
      
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await extractTextFromDocx(filePath)
      
    case 'text/plain':
    case 'text/markdown':
    case 'application/rtf':
    case 'text/rtf':
      const content = await readFile(filePath, 'utf-8')
      return content
      
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}

function analyzeTextPsychology(text: string, fileName: string, fileType: string): DocumentAnalysisResult {
  if (!text || text.length < 50) {
    return {
      summary: "Document too short for meaningful psychological analysis.",
      word_count: text.split(/\s+/).length,
      emotional_tone: "insufficient data"
    }
  }

  const words = text.split(/\s+/).filter(word => word.length > 0)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  
  const wordCount = words.length
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0
  
  // Psychological analysis based on text patterns
  const analysis: DocumentAnalysisResult = {
    word_count: wordCount,
    page_count: Math.max(1, Math.ceil(wordCount / 250)), // Rough estimate
    language_patterns: {
      sentence_length_avg: Math.round(avgSentenceLength * 10) / 10,
      vocabulary_complexity: getVocabularyComplexity(text),
      punctuation_style: getPunctuationStyle(text),
      paragraph_structure: getStructureAnalysis(paragraphs)
    }
  }

  // Emotional tone analysis
  analysis.emotional_tone = analyzeEmotionalTone(text)
  
  // Communication style analysis
  analysis.communication_style = analyzeCommunicationStyle(text, sentences)
  
  // Personality indicators
  analysis.personality_indicators = analyzePersonalityIndicators(text, words)
  
  // Cognitive patterns
  analysis.cognitive_patterns = analyzeCognitivePatterns(text, sentences)
  
  // Themes extraction
  analysis.themes = extractThemes(text)
  
  // Writing complexity (1-10 scale)
  analysis.writing_complexity = calculateWritingComplexity(text, sentences, words)
  
  // Formality level
  analysis.formality_level = analyzeFormalityLevel(text, words)
  
  // Creativity markers
  analysis.creativity_markers = analyzeCreativityMarkers(text)
  
  // Psychological insights
  analysis.psychological_insights = generatePsychologicalInsights(analysis, text)
  
  // Generate summary
  analysis.summary = generatePsychologicalSummary(analysis, fileName)

  return analysis
}

function analyzeEmotionalTone(text: string): string {
  const positiveWords = ['happy', 'joy', 'excited', 'love', 'amazing', 'wonderful', 'great', 'excellent', 'fantastic', 'perfect', 'beautiful', 'success', 'achievement', 'grateful', 'optimistic', 'confident', 'passionate', 'inspired', 'hopeful', 'proud']
  const negativeWords = ['sad', 'angry', 'frustrated', 'disappointed', 'worried', 'anxious', 'stressed', 'difficult', 'problem', 'challenge', 'struggle', 'failure', 'mistake', 'regret', 'concerned', 'upset', 'overwhelmed', 'confused', 'doubt', 'fear']
  const analyticalWords = ['analyze', 'research', 'study', 'examine', 'investigate', 'evaluate', 'assess', 'consider', 'determine', 'conclude', 'evidence', 'data', 'results', 'methodology', 'systematic', 'objective', 'hypothesis', 'theory', 'framework', 'structure']
  
  const textLower = text.toLowerCase()
  
  const positiveCount = positiveWords.filter(word => textLower.includes(word)).length
  const negativeCount = negativeWords.filter(word => textLower.includes(word)).length
  const analyticalCount = analyticalWords.filter(word => textLower.includes(word)).length
  
  if (analyticalCount > positiveCount && analyticalCount > negativeCount) {
    return "analytical and objective"
  } else if (positiveCount > negativeCount * 1.5) {
    return "positive and optimistic"
  } else if (negativeCount > positiveCount * 1.5) {
    return "concerned or critical"
  } else {
    return "balanced and neutral"
  }
}

function analyzeCommunicationStyle(text: string, sentences: string[]): string {
  const textLower = text.toLowerCase()
  const avgSentenceLength = sentences.length > 0 ? text.length / sentences.length : 0
  
  const collaborativeWords = ['we', 'us', 'our', 'team', 'together', 'collaborate', 'partnership', 'shared', 'collective', 'group']
  const directiveWords = ['must', 'should', 'need to', 'have to', 'required', 'necessary', 'important', 'critical', 'essential', 'mandate']
  const questionCount = (text.match(/\?/g) || []).length
  
  const collaborativeCount = collaborativeWords.filter(word => textLower.includes(word)).length
  const directiveCount = directiveWords.filter(word => textLower.includes(word)).length
  
  if (collaborativeCount > directiveCount && collaborativeCount > 3) {
    return "collaborative and inclusive"
  } else if (directiveCount > collaborativeCount) {
    return "direct and assertive"
  } else if (questionCount > sentences.length * 0.15) {
    return "inquisitive and exploratory"
  } else if (avgSentenceLength > 100) {
    return "detailed and comprehensive"
  } else {
    return "clear and straightforward"
  }
}

function analyzePersonalityIndicators(text: string, words: string[]): string[] {
  const indicators: string[] = []
  const textLower = text.toLowerCase()
  
  // Openness to experience
  const creativityWords = ['creative', 'innovative', 'artistic', 'imaginative', 'original', 'unique', 'explore', 'experiment', 'discovery']
  if (creativityWords.some(word => textLower.includes(word))) {
    indicators.push("high openness to experience")
  }
  
  // Conscientiousness
  const organizationWords = ['organized', 'plan', 'schedule', 'systematic', 'detailed', 'thorough', 'careful', 'precise', 'structured']
  if (organizationWords.some(word => textLower.includes(word))) {
    indicators.push("strong conscientiousness")
  }
  
  // Extraversion
  const socialWords = ['people', 'community', 'social', 'network', 'connect', 'meeting', 'presentation', 'leadership', 'team']
  if (socialWords.some(word => textLower.includes(word))) {
    indicators.push("extraverted tendencies")
  }
  
  // Analytical thinking
  const analyticalWords = ['analyze', 'data', 'research', 'logic', 'reasoning', 'evidence', 'methodology', 'systematic']
  if (analyticalWords.some(word => textLower.includes(word))) {
    indicators.push("analytical thinking patterns")
  }
  
  // Achievement orientation
  const achievementWords = ['goal', 'achievement', 'success', 'accomplish', 'improve', 'growth', 'development', 'progress']
  if (achievementWords.some(word => textLower.includes(word))) {
    indicators.push("achievement-oriented mindset")
  }
  
  return indicators.length > 0 ? indicators : ["personality patterns require longer text for analysis"]
}

function analyzeCognitivePatterns(text: string, sentences: string[]): string[] {
  const patterns: string[] = []
  const textLower = text.toLowerCase()
  
  // Sequential thinking
  const sequentialWords = ['first', 'second', 'next', 'then', 'finally', 'step', 'process', 'sequence', 'order']
  if (sequentialWords.some(word => textLower.includes(word))) {
    patterns.push("sequential processing approach")
  }
  
  // Systems thinking
  const systemsWords = ['system', 'connect', 'relationship', 'impact', 'influence', 'interaction', 'integration', 'holistic']
  if (systemsWords.some(word => textLower.includes(word))) {
    patterns.push("systems-level thinking")
  }
  
  // Problem-solving orientation
  const problemWords = ['problem', 'solution', 'solve', 'challenge', 'overcome', 'resolve', 'address', 'fix', 'improve']
  if (problemWords.some(word => textLower.includes(word))) {
    patterns.push("problem-solving orientation")
  }
  
  // Abstract thinking
  const abstractWords = ['concept', 'theory', 'principle', 'framework', 'model', 'abstract', 'philosophical', 'metaphor']
  if (abstractWords.some(word => textLower.includes(word))) {
    patterns.push("abstract conceptual thinking")
  }
  
  return patterns.length > 0 ? patterns : ["cognitive patterns require more content for analysis"]
}

function extractThemes(text: string): string[] {
  const themes: string[] = []
  const textLower = text.toLowerCase()
  
  // Professional development themes
  if (['career', 'professional', 'job', 'work', 'business', 'industry', 'skill'].some(word => textLower.includes(word))) {
    themes.push("professional development")
  }
  
  // Personal growth themes
  if (['growth', 'development', 'learning', 'improve', 'self', 'personal', 'journey'].some(word => textLower.includes(word))) {
    themes.push("personal growth")
  }
  
  // Creative expression themes
  if (['creative', 'art', 'design', 'artistic', 'expression', 'imagination', 'innovation'].some(word => textLower.includes(word))) {
    themes.push("creative expression")
  }
  
  // Leadership themes
  if (['leadership', 'manage', 'team', 'guide', 'mentor', 'responsibility', 'decision'].some(word => textLower.includes(word))) {
    themes.push("leadership and management")
  }
  
  // Relationship themes
  if (['relationship', 'family', 'friend', 'social', 'community', 'connection', 'support'].some(word => textLower.includes(word))) {
    themes.push("relationships and social connection")
  }
  
  // Achievement themes
  if (['goal', 'achievement', 'success', 'accomplish', 'target', 'objective', 'milestone'].some(word => textLower.includes(word))) {
    themes.push("achievement and goal orientation")
  }
  
  return themes.length > 0 ? themes : ["thematic analysis requires longer content"]
}

function calculateWritingComplexity(text: string, sentences: string[], words: string[]): number {
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0
  const longWords = words.filter(word => word.length > 6).length
  const longWordRatio = words.length > 0 ? longWords / words.length : 0
  const paragraphs = text.split(/\n\s*\n/).length
  
  let complexity = 1
  
  // Sentence length contributes to complexity
  if (avgWordsPerSentence > 20) complexity += 2
  else if (avgWordsPerSentence > 15) complexity += 1
  
  // Vocabulary complexity
  if (longWordRatio > 0.3) complexity += 2
  else if (longWordRatio > 0.2) complexity += 1
  
  // Structure complexity
  if (paragraphs > 10) complexity += 1
  
  // Technical or academic language
  const technicalWords = ['methodology', 'analysis', 'framework', 'systematic', 'comprehensive', 'implementation']
  if (technicalWords.some(word => text.toLowerCase().includes(word))) complexity += 1
  
  return Math.min(10, Math.max(1, complexity))
}

function analyzeFormalityLevel(text: string, words: string[]): string {
  const textLower = text.toLowerCase()
  const contractionCount = (text.match(/'\w+/g) || []).length
  const formalWords = ['furthermore', 'therefore', 'consequently', 'nevertheless', 'moreover', 'subsequently', 'accordingly', 'thus', 'hence', 'whereas']
  const informalWords = ['gonna', 'wanna', 'yeah', 'okay', 'cool', 'awesome', 'stuff', 'things', 'kinda', 'sorta']
  
  const formalCount = formalWords.filter(word => textLower.includes(word)).length
  const informalCount = informalWords.filter(word => textLower.includes(word)).length + contractionCount
  
  if (formalCount > informalCount && formalCount > 0) {
    return "formal and academic"
  } else if (informalCount > formalCount * 2) {
    return "casual and conversational"
  } else {
    return "moderately formal"
  }
}

function analyzeCreativityMarkers(text: string): string[] {
  const markers: string[] = []
  const textLower = text.toLowerCase()
  
  // Metaphorical language
  if (['like', 'as if', 'metaphor', 'symbolize', 'represents', 'embodies'].some(word => textLower.includes(word))) {
    markers.push("metaphorical thinking")
  }
  
  // Innovation language
  if (['innovative', 'creative', 'original', 'unique', 'novel', 'breakthrough', 'pioneering'].some(word => textLower.includes(word))) {
    markers.push("innovation-focused mindset")
  }
  
  // Experimentation
  if (['experiment', 'try', 'explore', 'test', 'discover', 'investigate', 'venture'].some(word => textLower.includes(word))) {
    markers.push("experimental approach")
  }
  
  // Artistic expression
  if (['artistic', 'aesthetic', 'beautiful', 'elegant', 'expressive', 'inspiring', 'imaginative'].some(word => textLower.includes(word))) {
    markers.push("artistic sensibility")
  }
  
  return markers.length > 0 ? markers : ["creativity markers require more expressive content"]
}

function generatePsychologicalInsights(analysis: DocumentAnalysisResult, text: string): string[] {
  const insights: string[] = []
  
  // Communication pattern insights
  if (analysis.communication_style?.includes('collaborative')) {
    insights.push("demonstrates strong interpersonal orientation and team-focused thinking")
  }
  
  // Cognitive style insights
  if (analysis.cognitive_patterns?.includes('analytical')) {
    insights.push("exhibits systematic approach to information processing and decision-making")
  }
  
  // Personality integration insights
  if (analysis.personality_indicators?.includes('openness')) {
    insights.push("shows intellectual curiosity and receptiveness to new experiences")
  }
  
  // Emotional regulation insights
  if (analysis.emotional_tone === 'balanced and neutral') {
    insights.push("maintains emotional equilibrium and objective perspective in written expression")
  }
  
  // Development stage insights
  if (analysis.writing_complexity && analysis.writing_complexity > 7) {
    insights.push("demonstrates sophisticated cognitive processing and advanced communication skills")
  }
  
  return insights.length > 0 ? insights : ["psychological insights require longer and more varied content"]
}

function generatePsychologicalSummary(analysis: DocumentAnalysisResult, fileName: string): string {
  const summaryParts = []
  
  if (analysis.emotional_tone) {
    summaryParts.push(`Document exhibits ${analysis.emotional_tone} emotional tone`)
  }
  
  if (analysis.communication_style) {
    summaryParts.push(`${analysis.communication_style} communication style`)
  }
  
  if (analysis.writing_complexity && analysis.writing_complexity > 5) {
    summaryParts.push(`sophisticated writing complexity (${analysis.writing_complexity}/10)`)
  }
  
  if (analysis.personality_indicators && analysis.personality_indicators.length > 0) {
    summaryParts.push(`personality indicators suggest ${analysis.personality_indicators[0]}`)
  }
  
  return summaryParts.length > 0 
    ? `Psychological analysis of "${fileName}" reveals ${summaryParts.join(', ')}.`
    : `Document "${fileName}" processed for psychological analysis with ${analysis.word_count || 0} words analyzed.`
}

function getVocabularyComplexity(text: string): string {
  const words = text.split(/\s+/).filter(word => word.length > 0)
  const uniqueWords = new Set(words.map(word => word.toLowerCase()))
  const vocabularyRatio = words.length > 0 ? uniqueWords.size / words.length : 0
  const longWords = words.filter(word => word.length > 7).length
  const longWordRatio = words.length > 0 ? longWords / words.length : 0
  
  if (vocabularyRatio > 0.7 && longWordRatio > 0.2) {
    return "sophisticated and varied"
  } else if (vocabularyRatio > 0.5 || longWordRatio > 0.15) {
    return "moderately complex"
  } else {
    return "straightforward and accessible"
  }
}

function getPunctuationStyle(text: string): string {
  const totalChars = text.length
  const commas = (text.match(/,/g) || []).length
  const semicolons = (text.match(/;/g) || []).length
  const dashes = (text.match(/—|--/g) || []).length
  const exclamations = (text.match(/!/g) || []).length
  
  const commaRatio = totalChars > 0 ? commas / totalChars : 0
  
  if (semicolons > 0 || dashes > 2) {
    return "complex and sophisticated"
  } else if (exclamations > commas * 0.5) {
    return "emphatic and expressive"
  } else if (commaRatio > 0.02) {
    return "detailed and structured"
  } else {
    return "simple and direct"
  }
}

function getStructureAnalysis(paragraphs: string[]): string {
  const avgParagraphLength = paragraphs.length > 0 ? 
    paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length : 0
  
  if (paragraphs.length > 10 && avgParagraphLength > 500) {
    return "comprehensive and well-developed"
  } else if (paragraphs.length > 5 && avgParagraphLength > 200) {
    return "structured and organized"
  } else if (paragraphs.length > 3) {
    return "concise and focused"
  } else {
    return "brief and direct"
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const documentFile = formData.get('document') as File
    
    if (!documentFile) {
      return NextResponse.json(
        { error: 'No document file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/rtf',
      'text/rtf'
    ]
    
    if (!validTypes.includes(documentFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: PDF, Word documents (.doc, .docx), text files (.txt), markdown (.md), RTF' },
        { status: 400 }
      )
    }

    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024
    if (documentFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB.' },
        { status: 400 }
      )
    }

    // Save file temporarily for processing
    const bytes = await documentFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const tempFileName = `${randomUUID()}-${documentFile.name}`
    const tempFilePath = join('/tmp', tempFileName)
    
    await writeFile(tempFilePath, buffer)

    try {
      // Extract text from document
      const extractedText = await extractTextFromDocument(tempFilePath, documentFile.type)
      
      if (!extractedText || extractedText.length < 10) {
        throw new Error("Could not extract meaningful text from document")
      }
      
      // Perform psychological analysis
      const analysis = analyzeTextPsychology(extractedText, documentFile.name, documentFile.type)
      
      // Clean up temporary file
      await unlink(tempFilePath)
      
      return NextResponse.json({
        success: true,
        analysis,
        metadata: {
          filename: documentFile.name,
          size: documentFile.size,
          type: documentFile.type,
          processed_at: new Date().toISOString(),
          text_length: extractedText.length,
          extraction_method: getExtractionMethod(documentFile.type)
        }
      })
      
    } catch (analysisError) {
      // Clean up temporary file on error
      try {
        await unlink(tempFilePath)
      } catch (unlinkError) {
        console.error('Failed to clean up temp file:', unlinkError)
      }
      
      console.error('Document analysis error:', analysisError)
      
      return NextResponse.json({
        success: false,
        error: 'Document analysis failed',
        analysis: {
          summary: 'Document uploaded successfully but analysis unavailable. Content available for reference in conversation.',
          emotional_tone: 'unknown',
          communication_style: 'unanalyzed',
          word_count: 0
        }
      })
    }
    
  } catch (error) {
    console.error('Document upload error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process document file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getExtractionMethod(fileType: string): string {
  switch (fileType) {
    case 'application/pdf':
      return 'pdfplumber + pypdf fallback'
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'python-docx + pandoc fallback'
    case 'text/plain':
    case 'text/markdown':
    case 'application/rtf':
    case 'text/rtf':
      return 'direct text reading'
    default:
      return 'unknown'
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Document analysis endpoint for multimodal psychology',
    supported_formats: {
      documents: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf']
    },
    max_file_size: '25MB',
    analysis_features: [
      'emotional_tone_detection',
      'communication_style_analysis',
      'personality_indicator_extraction',
      'cognitive_pattern_recognition',
      'theme_identification',
      'writing_complexity_scoring',
      'formality_level_assessment',
      'creativity_marker_detection',
      'psychological_insight_generation',
      'language_pattern_analysis'
    ],
    psychology_focus: [
      'personality_modeling',
      'cognitive_processing_patterns',
      'communication_preferences',
      'emotional_regulation_style',
      'creative_expression_analysis',
      'professional_development_themes',
      'relationship_and_social_patterns'
    ]
  })
}