"use client"

import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Gift,
  GraduationCap,
  Home,
  Languages,
  Menu,
  MessageSquare,
  Star,
  X,
  Zap
} from "lucide-react"
import { Card, CardContent } from "./components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { SetStateAction, useEffect, useState } from "react"

import { AVAILABLE_MODELS } from "@/constants/models"
import { Button } from "./components/ui/button"
import Link from "next/link";
import { Progress } from "@radix-ui/react-progress"
import { Textarea } from "./components/ui/textarea"

interface UserData {
  bonkPoints: number
  totalCorrections: number
  languagesLearned: string[]
  streakDays: number
  level: number
  dailyChallenge: boolean
}

interface BonkActivity {
  id: string
  amount: number
  description: string
  type: string
}

export default function LanguageLearnerApp() {
  const [userData, setUserData] = useState<UserData>({
    bonkPoints: 1250,
    totalCorrections: 47,
    languagesLearned: ["english", "spanish"],
    streakDays: 5,
    level: 3,
    dailyChallenge: false
  })

  const [inputText, setInputText] = useState("")
  const [correctedText, setCorrectedText] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("english")
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "learn" | "rewards">("home")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [autoDetect, setAutoDetect] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo")
  // Track copy status for the "Copy Corrected Text" button
  const [isCopied, setIsCopied] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)

  const [bonkActivity] = useState<BonkActivity[]>([
    { id: "1", amount: 100, description: "Completed daily challenge", type: "challenge" },
    { id: "2", amount: 50, description: "Corrected 50 sentences", type: "milestone" },
    { id: "3", amount: 200, description: "Streak bonus", type: "streak" }
  ])

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("languageLearnerData")
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setUserData(prev => ({ ...prev, ...parsed }))
    }
  }, [])

  // Auto-detect language when text changes (debounced + server-side detection)
  useEffect(() => {
    if (!autoDetect) {
      setDetectedLanguage(null)
      return
    }
    const text = inputText.trim()
    const hasEnoughSignal = text.length >= 15 && text.split(/\s+/).length >= 3
    if (!hasEnoughSignal) {
      setIsDetecting(false)
      setDetectedLanguage(null)
      return
    }
    setIsDetecting(true)
    const controller = new AbortController()
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/detect-language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: controller.signal
        })
        if (!res.ok) throw new Error("Failed to detect language")
        const data = await res.json()
        const lang = typeof data.language === "string" ? data.language : "unknown"
        if (lang !== "unknown") setDetectedLanguage(lang)
        else setDetectedLanguage(null)
      } catch (err: unknown) {
        const errorName = (typeof err === 'object' && err !== null && 'name' in err && typeof (err as { name?: unknown }).name === 'string')
          ? (err as { name: string }).name
          : undefined
        if (errorName !== "AbortError") {
          console.error(err)
        }
      } finally {
        setIsDetecting(false)
      }
    }, 600)
    return () => {
      controller.abort()
      clearTimeout(handle)
    }
  }, [inputText, autoDetect])

  // Save user data to localStorage
  const saveUserData = (newData: UserData) => {
    setUserData(newData)
    localStorage.setItem("languageLearnerData", JSON.stringify(newData))
  }

  // Removed naive client-side language detection; using server-side detection via /api/detect-language.

  // Simulate text analysis
  const analyzeText = async () => {
    if (!inputText.trim()) return

    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsAnalyzing(false)
  }

  // AI text correction via OpenAI
  const correctText = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          model: selectedModel,
          language: autoDetect && detectedLanguage ? detectedLanguage : selectedLanguage
        })
      });

      if (!res.ok) {
        throw new Error("Failed to fetch correction");
      }

      const data = await res.json();
      setCorrectedText(data.corrected);

      // Award BONK points
      const bonkEarned = Math.floor(Math.random() * 10) + 5;
      const newUserData = {
        ...userData,
        bonkPoints: userData.bonkPoints + bonkEarned,
        totalCorrections: userData.totalCorrections + 1,
        languagesLearned: userData.languagesLearned.includes(selectedLanguage)
          ? userData.languagesLearned
          : [...userData.languagesLearned, selectedLanguage]
      };

      saveUserData(newUserData);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while contacting GPT. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const languages = [
    { value: "english", label: "English" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
    { value: "italian", label: "Italian" },
    { value: "portuguese", label: "Portuguese" }
  ]

  const models = AVAILABLE_MODELS

  const rewards = [
    {
      id: 1,
      title: "Premium Feature",
      description: "Unlock all premium features for a month",
      cost: 500,
      icon: Star
    },
    {
      id: 2,
      title: "Exclusive Language",
      description: "Access exclusive language learning exercises",
      cost: 300,
      icon: BookOpen
    },
    {
      id: 3,
      title: "Cosmetic App Upgrades",
      description: "Customize your app with unique themes",
      cost: 200,
      icon: MessageSquare
    }
  ]

  const learningModules = [
    {
      title: "Vocabulary Quizzes",
      description: "Practice words from your corrections",
      image: "📚",
      color: "bg-orange-100"
    },
    {
      title: "Sentence Construction",
      description: "Build sentences with corrected words",
      image: "📝",
      color: "bg-blue-100"
    },
    {
      title: "Grammar Exercises",
      description: "Improve grammar with your corrections",
      image: "🎯",
      color: "bg-green-100"
    }
  ]

  const lessons = [
    {
      title: "Beginner Spanish",
      description: "Learn basic Spanish phrases and grammar",
      image: "🌮",
      color: "bg-yellow-100"
    },
    {
      title: "Intermediate French",
      description: "Enhance your French with complex sentences",
      image: "🗼",
      color: "bg-purple-100"
    }
  ]

  // Shared bottom navigation component
  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200">
      <div className="px-6 py-3">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "home" ? "text-yellow-600" : "text-gray-400"}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "rewards" ? "text-yellow-600" : "text-gray-400"}`}
          >
            <Gift className="h-5 w-5" />
            <span className="text-xs font-medium">Rewards</span>
          </button>
          <button
            onClick={() => setActiveTab("learn")}
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "learn" ? "text-yellow-600" : "text-gray-400"}`}
          >
            <GraduationCap className="h-5 w-5" />
            <span className="text-xs font-medium">Learn</span>
          </button>
        </div>
      </div>
    </div>
  )

  // Sidebar component
  const Sidebar = () => (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={() => setIsSidebarOpen(false)}
      />
      <div className="fixed right-0 top-0 bottom-0 w-72 max-w-[80%] bg-white shadow-lg z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <X
            className="h-5 w-5 text-gray-600 cursor-pointer"
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <Link
            href="/profile"
            onClick={() => setIsSidebarOpen(false)}
            className="block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700"
          >
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setIsSidebarOpen(false)}
            className="block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700"
          >
            Settings
          </Link>
          <Link
            href="/history"
            onClick={() => setIsSidebarOpen(false)}
            className="block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700"
          >
            History
          </Link>
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-600">GPT Model</span>
            <Select
              value={selectedModel}
              onValueChange={(value: SetStateAction<string>) => setSelectedModel(value)}
            >
              <SelectTrigger className="bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-auto text-xs text-gray-500">App version: 1.0.0</div>
        </div>
      </div>
    </>
  )

  // Reset copied state when the corrected text changes (e.g., after a new correction)
  useEffect(() => {
    setIsCopied(false)
  }, [correctedText])

  if (activeTab === "home") {
    return (
      <>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Bonkilingo</h1>
            <button onClick={() => {
              setIsSidebarOpen(true);
              console.log("sidebar open");
            }}>
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-20">
          {/* Language Selection and Auto-Detect */}
          <Card className="bg-gray-100 border-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Languages className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Target Language</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Auto-detect</span>
                    <button
                      onClick={() => setAutoDetect(!autoDetect)}
                      className={`w-10 h-6 rounded-full transition-colors ${autoDetect ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${autoDetect ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Select
                    value={autoDetect && detectedLanguage ? detectedLanguage : selectedLanguage}
                    onValueChange={(value: SetStateAction<string>) => {
                      setSelectedLanguage(value)
                      if (autoDetect) setAutoDetect(false)
                    }}
                    disabled={autoDetect && detectedLanguage !== null}
                  >
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {autoDetect && (
                    <div className="flex items-center space-x-2 text-xs">
                      {isDetecting ? (
                        <>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                          <span className="text-gray-600">Detecting language...</span>
                        </>
                      ) : detectedLanguage ? (
                        <>
                          <Zap className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Auto-detected: {languages.find(l => l.value === detectedLanguage)?.label}</span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>

                <Textarea
                  placeholder="Enter the text you want to correct..."
                  value={inputText}
                  onChange={(e: { target: { value: SetStateAction<string> } }) => setInputText(e.target.value)}
                  className="min-h-[120px] bg-white border-gray-200 resize-none"
                />

                {isAnalyzing && (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span>Analyzing text...</span>
                    </div>
                    <Progress value={60} className="mt-2 h-1" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Correct Button */}
          <Button
            onClick={correctText}
            disabled={!inputText.trim() || isLoading}
            className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            {isLoading ? "Correcting..." : "Correct Text"}
          </Button>

          {/* Corrections Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Corrections</h3>
            {correctedText ? (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <p className="text-gray-700 text-sm leading-relaxed">{correctedText}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`mt-3 w-full border-green-300 text-green-700 hover:bg-green-100 ${isCopied ? 'animate-bounce border-green-500 bg-green-50' : ''}`}
                    onClick={() => {
                      navigator.clipboard.writeText(correctedText)
                      setIsCopied(true)
                      setTimeout(() => setIsCopied(false), 2000)
                    }}
                  >
                    {isCopied ? "Copied!" : "Copy Corrected Text"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                      if (correctedText) {
                        localStorage.setItem("correctedText", correctedText)
                      }
                    }}
                    asChild
                  >
                    <Link href="/explanation">Show Explanation</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No corrections yet. Tap 'Correct Text' to get started.</p>
              </div>
            )}
          </div>
        </div>

        {isSidebarOpen && <Sidebar />}
        <BottomNavigation />
      </>
    )
  }

  if (activeTab === "learn") {
    return (
      <>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Learn</h1>
            <button onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto pb-20">
          {/* Personalized Learning */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personalized Learning</h2>
            <div className="space-y-4">
              {learningModules.map((module, index) => (
                <Card key={index} className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 ${module.color} rounded-xl flex items-center justify-center text-2xl`}>
                        {module.image}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                        <Button variant="outline" size="sm" className="mt-2 text-xs">
                          Start
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Lessons */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Lessons</h2>
            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <Card key={index} className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 ${lesson.color} rounded-xl flex items-center justify-center text-2xl`}>
                        {lesson.image}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                        <Button variant="outline" size="sm" className="mt-2 text-xs">
                          Start
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {isSidebarOpen && <Sidebar />}
        <BottomNavigation />
      </>
    )
  }

  if (activeTab === "rewards") {
    return (
      <>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <button onClick={() => setActiveTab("home")}>
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Rewards</h1>
            <div></div>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto pb-20">
          {/* BONK Balance */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">{userData.bonkPoints.toLocaleString()} BONK</h2>
          </div>

          {/* Next Reward Progress */}
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Next Reward</span>
                <span className="text-sm text-gray-500">250 BONK to go</span>
              </div>
              <Progress value={75} className="h-2" />
            </CardContent>
          </Card>

          {/* Available Rewards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Rewards</h3>
            <div className="space-y-3">
              {rewards.map((reward) => (
                <Card key={reward.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <reward.icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{reward.title}</h4>
                          <p className="text-sm text-gray-600">{reward.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={userData.bonkPoints < reward.cost}
                        className="text-xs"
                      >
                        Redeem
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* BONK Activity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">BONK Activity</h3>
            <div className="space-y-3">
              {bonkActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600">+{activity.amount} BONK</p>
                    <p className="text-xs text-gray-600">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isSidebarOpen && <Sidebar />}
        <BottomNavigation />
      </>
    )
  }

  return null
}
