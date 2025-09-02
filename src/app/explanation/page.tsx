"use client"

import { ArrowLeft, Lightbulb } from "lucide-react"
import { Card, CardContent } from "../components/ui/card"
import { useEffect, useRef, useState } from "react"

import { Button } from "../components/ui/button"
import { EXPLANATION_SYSTEM_PROMPT } from "@/lib/prompts"
import Link from "next/link"
import { Sparkles } from "../components/ui/sparkles"
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
  const [isSparkleActive, setIsSparkleActive] = useState(false)
  const [isCreatingLesson, setIsCreatingLesson] = useState(false)
  const [lessonCreated, setLessonCreated] = useState(false)
  const [createdLessonId, setCreatedLessonId] = useState<string | null>(null)

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

    const fetchInitialExplanation = async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt: EXPLANATION_SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: `Please explain the corrections you made to the following text.\n\nCorrected text:\n${storedText}`
              }
            ]
          })
        })
        if (!res.ok) throw new Error("Failed to fetch explanation")
        const data = await res.json()
        return data.reply as string
      } catch (e) {
        console.error(e)
        return "Sorry, I couldn't fetch the explanation."
      }
    }

    const initialise = async () => {
      if (!session) {
        const explanation = await fetchInitialExplanation()
        session = {
          id: Date.now(),
          correctedText: storedText,
          createdAt: Date.now(),
          messages: [
            {
              sender: "gpt",
              text: explanation
            }
          ]
        }
        chatHistory.push(session)
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory))
      }
      setMessages(session.messages)
    }

    initialise()
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

  // Send a new message through GPT
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: "user", text: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text
          }))
        })
      });

      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();

      const gptResponse: Message = { sender: "gpt", text: data.reply };
      setMessages(prev => [...prev, gptResponse]);
    } catch (error) {
      console.error(error);
      alert("Unable to reach GPT. Please try again later.");
    }
  };

  // Create a tiny lesson from the conversation summary
  const createTinyLesson = async () => {
    setIsCreatingLesson(true);
    setIsSparkleActive(true);

    try {
      // Extract the conversation content
      const conversationContent = messages.map(m =>
        `${m.sender === 'user' ? 'User' : 'Tutor'}: ${m.text}`
      ).join('\n\n');

      // Create a prompt for summarizing the conversation
      const prompt = `Based on this conversation about language learning and corrections, create a concise learning summary with key vocabulary, useful phrases, and grammar tips:\n\n${conversationContent}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          systemPrompt: "You are a helpful language tutor. Create a concise learning summary from this conversation. Format your response in three clear sections: 1) Key Vocabulary (5-8 relevant words with translations), 2) Useful Phrases (3-5 practical expressions), and 3) Grammar Tips (1-2 relevant grammar points with simple examples). Keep your response concise and focused on practical language use."
        })
      });

      if (!res.ok) throw new Error("Failed to create lesson");
      const data = await res.json();

      // Save the lesson to localStorage
      const savedLessonsData = localStorage.getItem("savedLessons");
      const savedLessons = savedLessonsData ? JSON.parse(savedLessonsData) : [];

      const lessonId = Date.now().toString();
      const newLesson = {
        id: lessonId,
        title: `Lesson from conversation: ${new Date().toLocaleDateString()}`,
        content: data.reply,
        date: new Date().toLocaleDateString()
      };

      const updatedLessons = [...savedLessons, newLesson];
      localStorage.setItem("savedLessons", JSON.stringify(updatedLessons));

      // Store the lesson ID for redirection
      setCreatedLessonId(lessonId);

      // Award BONK points
      const userData = localStorage.getItem("languageLearnerData");
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        const bonkEarned = 15;
        const newUserData = {
          ...parsedUserData,
          bonkPoints: (parsedUserData.bonkPoints || 0) + bonkEarned
        };
        localStorage.setItem("languageLearnerData", JSON.stringify(newUserData));
      }

      setLessonCreated(true);
      setTimeout(() => {
        setIsSparkleActive(false);
      }, 1500);

    } catch (error) {
      console.error(error);
      alert("Unable to create lesson. Please try again later.");
      setIsSparkleActive(false);
    } finally {
      setIsCreatingLesson(false);
    }
  };

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

          {/* Lesson created confirmation with redirect button */}
          {lessonCreated && (
            <div className="self-center bg-green-100 text-green-800 p-4 rounded-lg text-sm space-y-3">
              <p>✨ Lesson created and saved to your cheatsheet! +15 BONK points awarded.</p>
              <Link href="/" className="block w-full">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    // Set the active tab to "learn" and flashcards tool in localStorage
                    localStorage.setItem("activeTab", "learn");
                    localStorage.setItem("activeLearnTool", "flashcards");
                    localStorage.setItem("viewLessonId", createdLessonId || "");
                  }}
                >
                  View Lesson in My Cheatsheet
                </Button>
              </Link>
            </div>
          )}

          {/* Sentinel div for auto scroll */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t bg-white space-y-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1"></div>
          {messages.length > 0 && !lessonCreated && (
            <Sparkles isActive={isSparkleActive} color="#fbbf24" density={8}>
              <Button
                onClick={createTinyLesson}
                disabled={isCreatingLesson}
                variant="outline"
                size="sm"
                className="text-xs text-yellow-600 border-yellow-300 hover:bg-yellow-50"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                {isCreatingLesson ? "Creating..." : "Create Lesson"}
              </Button>
            </Sparkles>
          )}
        </div>
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