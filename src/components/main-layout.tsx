"use client"

import React, { useEffect } from "react"
import { List } from "@phosphor-icons/react"

import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import { Chat } from "@/components/chat"

export function MainLayout() {
  const { sidebarOpen, setSidebarOpen, loadSessions } = useAppStore()

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  return (
    <div className="flex h-screen bg-zinc-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex h-12 items-center justify-between border-b border-zinc-700 px-4 md:px-6">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-7 w-7 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-zinc-700 flex items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-sm bg-zinc-400" />
              </div>
              <span className="text-sm font-medium text-zinc-100 hidden sm:inline">Psyche Siren</span>
              <span className="text-xs text-zinc-400 hidden md:inline">Psychological Analysis</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />
              <span className="hidden sm:inline">AI Ready</span>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 min-h-0">
          <Chat />
        </div>
      </main>
    </div>
  )
}