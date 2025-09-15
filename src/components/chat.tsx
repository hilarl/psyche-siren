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
  CircleNotch
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn, isValidImageFile, fileToBase64, ANALYSIS_PROMPTS } from "@/lib/utils"

// Simple markdown formatter for basic formatting
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
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

  const [isStreaming, setIsStreaming] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const sendMessage = async () => {
    if (!inputText.trim() && selectedImages.length === 0) return
    if (!currentSession) return

    const messageContent = inputText.trim()
    const images = selectedImages

    setInputText("")
    clearSelectedImages()

    const imageBase64s = await Promise.all(
      images.map(file => fileToBase64(file))
    )

    addMessage({
      role: "user",
      content: messageContent,
      images: imageBase64s
    })

    setIsGenerating(true)
    setIsStreaming(true)

    try {
      const systemPrompt = ANALYSIS_PROMPTS[
        currentSession.type === "personality" ? "PERSONALITY_PROFILE" :
        currentSession.type === "creative" ? "CREATIVE_ASSESSMENT" :
        currentSession.type === "music" ? "MUSIC_PSYCHOLOGY" :
        "LABEL_INSIGHTS"
      ]

      const requestBody = {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: messageContent }
        ],
        max_tokens: 512,
        temperature: 0.7
      }

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
        updateLastMessage(data.choices[0].message.content)
      } else {
        throw new Error("Invalid response format")
      }

    } catch (error) {
      console.error("Error sending message:", error)
      updateLastMessage("I apologize, but I encountered an error while processing your request. Please try again.")
      toast.error("Failed to get response from Psyche Siren")
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentSession?.messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputText])

  if (!currentSession) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <Brain className="h-8 w-8 mx-auto text-zinc-500" />
          <div>
            <h2 className="text-lg font-medium text-zinc-100">Welcome to Psyche Siren</h2>
            <p className="text-zinc-400 mt-2 text-sm">
              Start a new psychology analysis session from the sidebar
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-zinc-700 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-700">
            <Brain className="h-3 w-3 text-zinc-400" weight="fill" />
          </div>
          <div>
            <h1 className="text-sm font-medium text-zinc-100">{currentSession.title}</h1>
            <p className="text-xs text-zinc-500">
              {currentSession.type.charAt(0).toUpperCase() + currentSession.type.slice(1).replace('-', ' ')} Analysis
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {currentSession.messages.length === 0 ? (
            <div className="text-center space-y-4 py-12">
              <Sparkle className="h-7 w-7 mx-auto text-zinc-500" />
              <div>
                <h3 className="text-base font-medium text-zinc-300">Ready for Analysis</h3>
                <p className="text-zinc-500 mt-2 text-sm">
                  Share your thoughts, creative work, or upload images for psychological insight
                </p>
              </div>
            </div>
          ) : (
            currentSession.messages.map((message, index) => (
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
                  <Avatar className="h-6 w-6 border border-zinc-700">
                    <AvatarFallback className="bg-zinc-700 text-zinc-400 text-xs">
                      PS
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[75%] rounded-lg px-4 py-3",
                    message.role === "user"
                      ? "bg-zinc-700 border border-zinc-600"
                      : "bg-zinc-800 border border-zinc-700"
                  )}
                >
                  {message.images && message.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {message.images.map((image, idx) => (
                        <img
                          key={idx}
                          src={image}
                          alt={`Uploaded image ${idx + 1}`}
                          className="rounded-md max-h-48 object-cover border border-zinc-600"
                        />
                      ))}
                    </div>
                  )}
                  
                  {message.content ? (
                    <MessageContent content={message.content} isUser={message.role === "user"} />
                  ) : (
                    message.role === "assistant" && isStreaming && (
                      <div className="flex items-center gap-2">
                        <CircleNotch className="h-4 w-4 animate-spin text-zinc-400" />
                        <span className="text-zinc-400 text-sm">Analyzing your message...</span>
                      </div>
                    )
                  )}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-6 w-6 border border-zinc-700">
                    <AvatarFallback className="bg-zinc-700 text-xs">
                      <User className="h-3 w-3 text-zinc-400" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-zinc-700 p-4 md:p-6">
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
                        className="h-12 w-12 rounded-md object-cover border border-zinc-600"
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

          {/* Input Controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your creative work, share thoughts, or ask for psychological analysis..."
                className="min-h-[44px] max-h-32 resize-none pr-12 bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-500"
                disabled={isGenerating}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
              >
                <ImageIcon className="h-3 w-3" />
              </Button>
            </div>
            
            <Button
              onClick={sendMessage}
              disabled={isGenerating || (!inputText.trim() && selectedImages.length === 0)}
              className="h-11 px-4 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 border border-zinc-600 disabled:opacity-50"
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
              className="mt-3 flex items-center gap-2 text-zinc-400"
            >
              <CircleNotch className="h-3 w-3 animate-spin" />
              <span className="text-xs">Psyche Siren is analyzing your message...</span>
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

          <p className="mt-2 text-xs text-zinc-500">
            Upload images of your creative work for multimodal analysis. Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  )
}