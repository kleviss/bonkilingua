"use client"

import { Card, CardContent } from "../components/ui/card"
import { useEffect, useRef, useState } from "react"

import { ArrowLeft } from "lucide-react"
import { Button } from "../components/ui/button"
import Link from "next/link"
import { Textarea } from "../components/ui/textarea"

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

export default function ExplanationPage() {
  const [correctedText, setCorrectedText] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [input, setInput] = useState("")

  // Load the corrected text and corresponding chat history from localStorage
  useEffect(() => {
    const storedText = localStorage.getItem("correctedText")
    if (!storedText) return

    setCorrectedText(storedText)

    // Retrieve existing history or initialize
    const historyRaw = localStorage.getItem("chatHistory")
    const chatHistory: ChatSession[] = historyRaw ? JSON.parse(historyRaw) : []

    // Try to find an existing session for this corrected text
    let session = chatHistory.find(h => h.correctedText === storedText)

    // If no session exists yet, create a new one with the default GPT explanation
    if (!session) {
      session = {
        id: Date.now(),
        correctedText: storedText,
        createdAt: Date.now(),
        messages: [
          {
            sender: "gpt",
            text:
              "Here is an explanation of the corrections and improvements made to your text:\n\n" +
              "1. Improved grammar and punctuation.\n" +
              "2. Enhanced sentence flow and clarity.\n" +
              "3. Adjusted word choice to better fit the context.\n\n" +
              "Feel free to ask any further questions!"
          }
        ]
      }
      chatHistory.push(session)
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory))
    }

    setMessages(session.messages)
  }, [])

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (!correctedText) return
    const historyRaw = localStorage.getItem("chatHistory")
    if (!historyRaw) return

    const chatHistory: ChatSession[] = JSON.parse(historyRaw)
    const idx = chatHistory.findIndex(h => h.correctedText === correctedText)
    if (idx !== -1) {
      chatHistory[idx].messages = messages
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory))
    }
  }, [messages, correctedText])

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send a new message and simulate a GPT response
  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = { sender: "user", text: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput("")

    // Simulate network / GPT processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const gptResponse: Message = {
      sender: "gpt",
      text: "This is a sample response elaborating on your question. \uD83D\uDE0A"
    }
    setMessages(prev => [...prev, gptResponse])
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center space-x-3">
        <Link href="/" className="text-gray-600 hover:text-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Explanation</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {correctedText && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-2">Corrected Text</h2>
              <p className="text-gray-800 text-sm whitespace-pre-wrap">{correctedText}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg text-sm whitespace-pre-wrap max-w-[80%] ${msg.sender === "gpt"
                ? "bg-gray-100 text-gray-800 self-start"
                : "bg-yellow-100 text-gray-900 self-end"
                }`}
            >
              {msg.text}
            </div>
          ))}
          {/* Sentinel div for auto scroll */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t bg-white space-y-2">
        <Textarea
          placeholder="Ask a question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="min-h-[60px] border-gray-200"
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
        >
          Send
        </Button>
      </div>
    </div>
  )
} 