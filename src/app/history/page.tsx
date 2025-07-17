"use client"

import { Card, CardContent } from "../components/ui/card"
import { useEffect, useState } from "react"

import { ArrowLeft } from "lucide-react"
import { Button } from "../components/ui/button"
import Link from "next/link"

interface Message {
  sender: "user" | "gpt"
  text: string
}

interface ChatSession {
  id: number
  correctedText: string
  messages: Message[]
  createdAt: number
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ChatSession[]>([])

  useEffect(() => {
    const raw = localStorage.getItem("chatHistory")
    if (raw) {
      const parsed: ChatSession[] = JSON.parse(raw)
      // Show newest first
      setHistory(parsed.sort((a, b) => b.createdAt - a.createdAt))
    }
  }, [])

  const viewSession = (session: ChatSession) => {
    localStorage.setItem("correctedText", session.correctedText)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center space-x-3">
        <Link href="/" className="text-gray-600 hover:text-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">History</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No history yet.</p>
        ) : (
          history.map((session) => (
            <Card key={session.id} className="border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm text-gray-800 truncate max-w-full">
                  {session.correctedText}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(session.createdAt).toLocaleString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewSession(session)}
                    asChild
                  >
                    <Link href="/explanation" className="text-xs">View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 