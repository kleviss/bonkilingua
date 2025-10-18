"use client";

import { ArrowLeft, BookOpen, CheckCircle, Gift, GraduationCap, Home, Languages, Menu, MessageSquare, Star, X, Zap } from "lucide-react";
import { Card, CardContent } from "./components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { SetStateAction, useEffect, useState } from "react";

import { AVAILABLE_MODELS } from "@/constants/models";
import { Button } from "./components/ui/button";
import Link from "next/link";
import { Progress } from "@radix-ui/react-progress";
import { Sparkles } from "./components/ui/sparkles";
import { Textarea } from "./components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { getUserProfile, updateUserProfile, saveChatSession, saveLesson as dbSaveLesson, getSavedLessons, deleteLesson } from "@/lib/db";
import AuthButton from "@/components/AuthButton";

interface UserData {
  bonkPoints: number;
  totalCorrections: number;
  languagesLearned: string[];
  streakDays: number;
  level: number;
  dailyChallenge: boolean;
}

interface BonkActivity {
  id: string;
  amount: number;
  description: string;
  type: string;
}

export default function LanguageLearnerApp() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    bonkPoints: 0,
    totalCorrections: 0,
    languagesLearned: [],
    streakDays: 0,
    level: 1,
    dailyChallenge: false,
  });

  const [inputText, setInputText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "learn" | "rewards">("home");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
  // Track copy status for the "Copy Corrected Text" button
  const [isCopied, setIsCopied] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [activeLearnTool, setActiveLearnTool] = useState<string | null>(null);
  const [situationInput, setSituationInput] = useState("");
  const [tinyLessonResult, setTinyLessonResult] = useState<string | null>(null);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [savedLessons, setSavedLessons] = useState<Array<{ id: string; title: string; content: string; date: string }>>([]);
  const [showFlashcards, setShowFlashcards] = useState(false);

  const [bonkActivity] = useState<BonkActivity[]>([
    { id: "1", amount: 100, description: "Completed daily challenge", type: "challenge" },
    { id: "2", amount: 50, description: "Corrected 50 sentences", type: "milestone" },
    { id: "3", amount: 200, description: "Streak bonus", type: "streak" },
  ]);

  // Load user data and saved lessons on mount
  useEffect(() => {
    // If user is authenticated, fetch data from database
    if (user) {
      const fetchUserData = async () => {
        const profile = await getUserProfile(user.id);
        if (profile) {
          setUserData({
            bonkPoints: profile.bonk_points,
            totalCorrections: profile.total_corrections,
            languagesLearned: profile.languages_learned,
            streakDays: profile.streak_days,
            level: profile.level,
            dailyChallenge: profile.daily_challenge,
          });
        }

        // Fetch saved lessons from database
        const dbLessons = await getSavedLessons(user.id);
        const formattedLessons = dbLessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          content: lesson.content,
          date: new Date(lesson.created_at || "").toLocaleDateString(),
        }));
        setSavedLessons(formattedLessons);
      };
      fetchUserData();
    } else {
      // If not authenticated, use localStorage
      const savedData = localStorage.getItem("languageLearnerData");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setUserData((prev) => ({ ...prev, ...parsed }));
      }

      // Load lessons from localStorage for unauthenticated users
      const savedLessonsData = localStorage.getItem("savedLessons");
      if (savedLessonsData) {
        try {
          const parsed = JSON.parse(savedLessonsData);
          if (Array.isArray(parsed)) {
            setSavedLessons(parsed);
          }
        } catch (error) {
          console.error("Failed to parse saved lessons", error);
        }
      }
    }
  }, [user]);

  // Separate useEffect for handling redirection from explanation page
  useEffect(() => {
    // Check for redirection from explanation page
    const activeTabFromStorage = localStorage.getItem("activeTab");
    const activeLearnToolFromStorage = localStorage.getItem("activeLearnTool");
    const viewLessonId = localStorage.getItem("viewLessonId");

    if (activeTabFromStorage === "learn") {
      setActiveTab("learn");

      if (activeLearnToolFromStorage === "flashcards") {
        setActiveLearnTool("flashcards");

        // If we have a specific lesson to view
        if (viewLessonId) {
          // We'll handle the lesson finding after savedLessons is loaded
          const checkForLesson = () => {
            const savedLessonsData = localStorage.getItem("savedLessons");
            if (savedLessonsData) {
              try {
                const lessons = JSON.parse(savedLessonsData);
                const lesson = lessons.find((l: { id: string; title: string; content: string; date: string }) => l.id === viewLessonId);
                if (lesson) {
                  setShowFlashcards(true);
                  setTinyLessonResult(lesson.content || "");
                }
              } catch (error) {
                console.error("Failed to find specific lesson", error);
              }
            }
          };
          checkForLesson();
        }
      }

      // Clear the redirection data
      localStorage.removeItem("activeTab");
      localStorage.removeItem("activeLearnTool");
      localStorage.removeItem("viewLessonId");
    }
  }, []); // Only run once on mount

  // Auto-detect language when text changes (debounced + server-side detection)
  useEffect(() => {
    if (!autoDetect) {
      setDetectedLanguage(null);
      return;
    }
    const text = inputText.trim();
    const hasEnoughSignal = text.length >= 15 && text.split(/\s+/).length >= 3;
    if (!hasEnoughSignal) {
      setIsDetecting(false);
      setDetectedLanguage(null);
      return;
    }
    setIsDetecting(true);
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/detect-language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to detect language");
        const data = await res.json();
        const lang = typeof data.language === "string" ? data.language : "unknown";
        if (lang !== "unknown") setDetectedLanguage(lang);
        else setDetectedLanguage(null);
      } catch (err: unknown) {
        const errorName =
          typeof err === "object" && err !== null && "name" in err && typeof (err as { name?: unknown }).name === "string"
            ? (err as { name: string }).name
            : undefined;
        if (errorName !== "AbortError") {
          console.error(err);
        }
      } finally {
        setIsDetecting(false);
      }
    }, 600);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [inputText, autoDetect]);

  // Save user data to localStorage or database
  const saveUserData = async (newData: UserData) => {
    setUserData(newData);

    if (user) {
      // Save to database if authenticated
      try {
        await updateUserProfile(user.id, {
          bonk_points: newData.bonkPoints,
          total_corrections: newData.totalCorrections,
          languages_learned: newData.languagesLearned,
          streak_days: newData.streakDays,
          level: newData.level,
          daily_challenge: newData.dailyChallenge,
        });
      } catch (error) {
        console.error("Failed to update user profile", error);
      }
    } else {
      // Save to localStorage if not authenticated
      localStorage.setItem("languageLearnerData", JSON.stringify(newData));
    }
  };

  // Removed naive client-side language detection; using server-side detection via /api/detect-language.

  // Simulate text analysis
  const analyzeText = async () => {
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
  };

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
          language: autoDetect && detectedLanguage ? detectedLanguage : selectedLanguage,
        }),
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
          : [...userData.languagesLearned, selectedLanguage],
      };

      await saveUserData(newUserData);

      // Save chat session to database if user is authenticated
      if (user) {
        try {
          await saveChatSession({
            user_id: user.id,
            corrected_text: data.corrected,
            input_text: inputText,
            language: autoDetect && detectedLanguage ? detectedLanguage : selectedLanguage,
            model: selectedModel,
          });
        } catch (error) {
          console.error("Failed to save chat session", error);
        }
      } else {
        // Save to localStorage if not authenticated
        const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
        chatHistory.push({
          id: Date.now(),
          correctedText: data.corrected,
          messages: [
            { sender: "user", text: inputText },
            { sender: "gpt", text: data.corrected },
          ],
          createdAt: Date.now(),
        });
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while contacting GPT. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Tiny Lesson tool
  const handleTinyLesson = async () => {
    if (!situationInput.trim()) return;

    setIsLessonLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `I need vocabulary, phrases, and grammar tips for this situation in ${selectedLanguage}: ${situationInput}`,
            },
          ],
          model: selectedModel,
          systemPrompt:
            "You are a helpful language tutor. Provide relevant vocabulary, useful phrases, and grammar tips for the situation described by the user. Format your response in three clear sections: 1) Key Vocabulary (10-15 relevant words with translations), 2) Useful Phrases (5-8 practical expressions with translations), and 3) Grammar Tips (2-3 relevant grammar points with simple examples). Keep your response concise and focused on practical language use.",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch tiny lesson");
      }

      const data = await res.json();
      setTinyLessonResult(data.reply);

      // Award BONK points
      const bonkEarned = Math.floor(Math.random() * 15) + 10;
      const newUserData = {
        ...userData,
        bonkPoints: userData.bonkPoints + bonkEarned,
      };

      saveUserData(newUserData);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while generating your lesson. Please try again.");
    } finally {
      setIsLessonLoading(false);
    }
  };

  // Save lesson to localStorage or database
  const saveLesson = async () => {
    if (!tinyLessonResult || !situationInput) return;

    // Award BONK points for saving a lesson
    const bonkEarned = 5;
    const newUserData = {
      ...userData,
      bonkPoints: userData.bonkPoints + bonkEarned,
    };
    await saveUserData(newUserData);

    if (user) {
      // Save to database if authenticated
      try {
        const savedLesson = await dbSaveLesson({
          user_id: user.id,
          title: situationInput.length > 30 ? situationInput.substring(0, 30) + "..." : situationInput,
          content: tinyLessonResult,
        });

        // Update local state with the saved lesson
        const newLesson = {
          id: savedLesson.id,
          title: savedLesson.title,
          content: savedLesson.content,
          date: new Date(savedLesson.created_at || "").toLocaleDateString(),
        };
        setSavedLessons((prev) => [...prev, newLesson]);

        alert(`Lesson saved! +${bonkEarned} BONK points awarded.`);
      } catch (error) {
        console.error("Failed to save lesson", error);
        alert("Failed to save lesson. Please try again.");
      }
    } else {
      // Save to localStorage if not authenticated
      const newLesson = {
        id: Date.now().toString(),
        title: situationInput.length > 30 ? situationInput.substring(0, 30) + "..." : situationInput,
        content: tinyLessonResult,
        date: new Date().toLocaleDateString(),
      };

      const updatedLessons = [...savedLessons, newLesson];
      setSavedLessons(updatedLessons);
      localStorage.setItem("savedLessons", JSON.stringify(updatedLessons));
      alert(`Lesson saved! +${bonkEarned} BONK points awarded.`);
    }
  };

  const languages = [
    { value: "english", label: "English" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
    { value: "italian", label: "Italian" },
    { value: "portuguese", label: "Portuguese" },
  ];

  const models = AVAILABLE_MODELS;

  const rewards = [
    {
      id: 1,
      title: "Premium Feature",
      description: "Unlock all premium features for a month",
      cost: 500,
      icon: Star,
    },
    {
      id: 2,
      title: "Exclusive Language",
      description: "Access exclusive language learning exercises",
      cost: 300,
      icon: BookOpen,
    },
    {
      id: 3,
      title: "Cosmetic App Upgrades",
      description: "Customize your app with unique themes",
      cost: 200,
      icon: MessageSquare,
    },
  ];

  const learningModules = [
    {
      title: "Vocabulary Quizzes",
      description: "Practice words from your corrections",
      image: "📚",
      color: "bg-orange-100",
    },
    {
      title: "Sentence Construction",
      description: "Build sentences with corrected words",
      image: "📝",
      color: "bg-blue-100",
    },
    {
      title: "Grammar Exercises",
      description: "Improve grammar with your corrections",
      image: "🎯",
      color: "bg-green-100",
    },
  ];

  const lessons = [
    {
      title: "Beginner Spanish",
      description: "Learn basic Spanish phrases and grammar",
      image: "🌮",
      color: "bg-yellow-100",
    },
    {
      title: "Intermediate French",
      description: "Enhance your French with complex sentences",
      image: "🗼",
      color: "bg-purple-100",
    },
  ];

  const experiments = [
    {
      id: "001",
      title: "Tiny Lesson",
      description: "Find relevant vocabulary, phrases, and grammar tips for any situation.",
      image: "📚",
      color: "bg-blue-100",
    },
    {
      id: "002",
      title: "Slang Hang",
      description: "Learn expressions, idioms, and regional slang from a generated conversation between native speakers.",
      image: "💬",
      color: "bg-purple-100",
    },
    {
      id: "003",
      title: "Word Cam",
      description: "Snap a photo to learn how to speak about your surroundings.",
      image: "📸",
      color: "bg-green-100",
    },
  ];

  // Shared bottom navigation component
  const BottomNavigation = () => (
    <div className='fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200'>
      <div className='px-6 py-3'>
        <div className='flex justify-around'>
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "home" ? "text-yellow-600" : "text-gray-400"}`}
          >
            <Home className='h-5 w-5' />
            <span className='text-xs font-medium'>Home</span>
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "rewards" ? "text-yellow-600" : "text-gray-400"}`}
          >
            <Gift className='h-5 w-5' />
            <span className='text-xs font-medium'>Rewards</span>
          </button>
          <button
            onClick={() => setActiveTab("learn")}
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "learn" ? "text-yellow-600" : "text-gray-400"}`}
          >
            <GraduationCap className='h-5 w-5' />
            <span className='text-xs font-medium'>Learn</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Sidebar component
  const Sidebar = () => (
    <>
      <div className='fixed inset-0 bg-black/30 z-40' onClick={() => setIsSidebarOpen(false)} />
      <div className='fixed right-0 top-0 bottom-0 w-72 max-w-[80%] bg-white shadow-lg z-50 flex flex-col'>
        <div className='flex items-center justify-between p-4 border-b'>
          <h2 className='text-lg font-semibold text-gray-900'>Menu</h2>
          <X className='h-5 w-5 text-gray-600 cursor-pointer' onClick={() => setIsSidebarOpen(false)} />
        </div>
        <div className='p-4 flex-1 overflow-y-auto space-y-4'>
          <Link
            href='/profile'
            onClick={() => setIsSidebarOpen(false)}
            className='block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700'
          >
            Profile
          </Link>
          <Link
            href='/settings'
            onClick={() => setIsSidebarOpen(false)}
            className='block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700'
          >
            Settings
          </Link>
          <Link
            href='/history'
            onClick={() => setIsSidebarOpen(false)}
            className='block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700'
          >
            History
          </Link>
          <div className='space-y-2'>
            <span className='text-sm font-medium text-gray-600'>GPT Model</span>
            <Select value={selectedModel} onValueChange={(value: SetStateAction<string>) => setSelectedModel(value)}>
              <SelectTrigger className='bg-white border-gray-200'>
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
          <div className='mt-auto text-xs text-gray-500'>App version: 1.0.0</div>
        </div>
      </div>
    </>
  );

  // Reset copied state when the corrected text changes (e.g., after a new correction)
  useEffect(() => {
    setIsCopied(false);
    setShowSparkles(false);
  }, [correctedText]);

  if (activeTab === "home") {
    return (
      <>
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-100 bg-white'>
          <div className='flex items-center justify-between'>
            <h1 className='text-lg font-semibold text-gray-900'>Bonkilingo</h1>
            <div className='flex items-center space-x-2'>
              <AuthButton />
              <button
                onClick={() => {
                  setIsSidebarOpen(true);
                }}
              >
                <Menu className='h-5 w-5 text-gray-600' />
              </button>
            </div>
          </div>
        </div>

        <div className='p-6 space-y-6 flex-1 overflow-y-auto pb-20'>
          {/* Language Selection and Auto-Detect */}
          <Card className='bg-gray-100 border-0'>
            <CardContent className='p-6'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Languages className='h-4 w-4 text-gray-600' />
                    <span className='text-sm font-medium text-gray-700'>Target Language</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <span className='text-xs text-gray-500'>Auto-detect</span>
                    <button
                      onClick={() => setAutoDetect(!autoDetect)}
                      className={`w-10 h-6 rounded-full transition-colors ${autoDetect ? "bg-yellow-500" : "bg-gray-300"}`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                          autoDetect ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Select
                    value={autoDetect && detectedLanguage ? detectedLanguage : selectedLanguage}
                    onValueChange={(value: SetStateAction<string>) => {
                      setSelectedLanguage(value);
                      if (autoDetect) setAutoDetect(false);
                    }}
                    disabled={autoDetect && detectedLanguage !== null}
                  >
                    <SelectTrigger className='bg-white border-gray-200'>
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
                    <div className='flex items-center space-x-2 text-xs'>
                      {isDetecting ? (
                        <>
                          <div className='w-2 h-2 bg-yellow-500 rounded-full animate-pulse'></div>
                          <span className='text-gray-600'>Detecting language...</span>
                        </>
                      ) : detectedLanguage ? (
                        <>
                          <Zap className='h-3 w-3 text-green-600' />
                          <span className='text-green-600'>
                            Auto-detected: {languages.find((l) => l.value === detectedLanguage)?.label}
                          </span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>

                <Textarea
                  placeholder='Enter the text you want to correct...'
                  value={inputText}
                  onChange={(e: { target: { value: SetStateAction<string> } }) => setInputText(e.target.value)}
                  className='min-h-[120px] bg-white border-gray-200 resize-none'
                />

                {isAnalyzing && (
                  <div className='text-sm text-gray-600'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-2 h-2 bg-yellow-500 rounded-full animate-pulse'></div>
                      <span>Analyzing text...</span>
                    </div>
                    <Progress value={60} className='mt-2 h-1' />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Correct Button */}
          <Button
            onClick={correctText}
            disabled={!inputText.trim() || isLoading}
            className='w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold'
          >
            {isLoading ? "Correcting..." : "Correct Text"}
          </Button>

          {/* Corrections Section */}
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Corrections</h3>
            {correctedText ? (
              <Card className='bg-green-50 border-green-200'>
                <CardContent className='p-4'>
                  <p className='text-gray-700 text-sm leading-relaxed'>{correctedText}</p>
                  <Sparkles isActive={showSparkles} color='#10b981' density={10}>
                    <Button
                      variant='outline'
                      size='sm'
                      className={`mt-3 w-full border-green-300 text-green-700 hover:bg-green-100 ${
                        isCopied ? "border-green-500 bg-green-50" : ""
                      }`}
                      onClick={() => {
                        navigator.clipboard.writeText(correctedText);
                        setIsCopied(true);
                        setShowSparkles(true);
                        setTimeout(() => {
                          setIsCopied(false);
                          setShowSparkles(false);
                        }, 2000);
                      }}
                    >
                      {isCopied ? "Copied!" : "Copy Corrected Text"}
                    </Button>
                  </Sparkles>
                  <Button
                    variant='outline'
                    size='sm'
                    className='mt-2 w-full border-blue-300 text-blue-700 hover:bg-blue-100'
                    onClick={() => {
                      if (correctedText) {
                        localStorage.setItem("correctedText", correctedText);
                      }
                    }}
                    asChild
                  >
                    <Link href='/explanation'>Show Explanation</Link>
                  </Button>
                  <div className='mt-2 text-center'>
                    <Link href='/history' className='text-xs text-yellow-600 hover:underline'>
                      View correction history
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                <p className='text-sm'>No corrections yet. Tap 'Correct Text' to get started.</p>
                <p className='text-sm mt-2'>
                  Looking for history?{" "}
                  <Link href='/history' className='text-yellow-600 hover:underline'>
                    Click here
                  </Link>{" "}
                  to view past corrections.
                </p>
              </div>
            )}
          </div>
        </div>

        {isSidebarOpen && <Sidebar />}
        <BottomNavigation />
      </>
    );
  }

  if (activeTab === "learn") {
    return (
      <>
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-100 bg-white'>
          <div className='flex items-center justify-between'>
            {activeLearnTool ? (
              <div className='flex items-center'>
                <button
                  onClick={() => {
                    setActiveLearnTool(null);
                    setTinyLessonResult(null);
                    setSituationInput("");
                    setShowFlashcards(false);
                  }}
                  className='mr-2'
                >
                  <ArrowLeft className='h-5 w-5 text-gray-600' />
                </button>
                <h1 className='text-lg font-semibold text-gray-900'>
                  {activeLearnTool === "tinyLesson" ? "Tiny Lesson" : activeLearnTool === "flashcards" ? "My Flashcards" : "Learn"}
                </h1>
              </div>
            ) : (
              <h1 className='text-lg font-semibold text-gray-900'>Learn</h1>
            )}
            <button onClick={() => setIsSidebarOpen(true)}>
              <Menu className='h-5 w-5 text-gray-600' />
            </button>
          </div>
        </div>

        <div className='p-6 space-y-6 flex-1 overflow-y-auto pb-20'>
          {activeLearnTool === "tinyLesson" ? (
            // Tiny Lesson tool
            <div className='space-y-6'>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>Tiny Lesson</h2>
                <p className='text-sm text-gray-600 mt-1'>Find relevant vocabulary, phrases, and grammar tips for any situation.</p>
              </div>

              <div className='space-y-4'>
                <div className='space-y-2'>
                  <label htmlFor='situation' className='block text-sm font-medium text-gray-700'>
                    Describe a situation or topic you want to learn about
                  </label>
                  <Textarea
                    id='situation'
                    placeholder='e.g., Ordering food at a restaurant, asking for directions, talking about the weather...'
                    value={situationInput}
                    onChange={(e: { target: { value: SetStateAction<string> } }) => setSituationInput(e.target.value)}
                    className='min-h-[100px] bg-white border-gray-200 resize-none'
                  />
                </div>

                <div className='space-y-2'>
                  <label htmlFor='language' className='block text-sm font-medium text-gray-700'>
                    Language
                  </label>
                  <Select value={selectedLanguage} onValueChange={(value: SetStateAction<string>) => setSelectedLanguage(value)}>
                    <SelectTrigger className='bg-white border-gray-200'>
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
                </div>

                <Button
                  onClick={handleTinyLesson}
                  disabled={!situationInput.trim() || isLessonLoading}
                  className='w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold'
                >
                  {isLessonLoading ? "Generating..." : "Generate Tiny Lesson"}
                </Button>

                {tinyLessonResult && (
                  <Card className='bg-blue-50 border-blue-200 mt-6'>
                    <CardContent className='p-4'>
                      <div className='prose prose-sm max-w-none'>
                        <div className='whitespace-pre-wrap'>{tinyLessonResult}</div>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        className='mt-4 w-full border-blue-300 text-blue-700 hover:bg-blue-100'
                        onClick={saveLesson}
                      >
                        Save to My Cheatsheet
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : activeLearnTool === "flashcards" ? (
            // Flashcards/Cheatsheet view
            <div className='space-y-6'>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>My Language Cheatsheet</h2>
                <p className='text-sm text-gray-600 mt-1'>Your saved lessons and vocabulary</p>
              </div>

              {savedLessons.length > 0 ? (
                <div className='space-y-4'>
                  {savedLessons.map((lesson) => (
                    <Card key={lesson.id} className='border-gray-200'>
                      <CardContent className='p-4'>
                        <div className='flex justify-between items-start'>
                          <div>
                            <h3 className='font-semibold text-gray-900'>{lesson.title}</h3>
                            <p className='text-xs text-gray-500 mt-1'>Saved on {lesson.date}</p>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={async () => {
                              if (user) {
                                // Delete from database if authenticated
                                try {
                                  await deleteLesson(lesson.id, user.id);
                                  setSavedLessons((prev) => prev.filter((l) => l.id !== lesson.id));
                                } catch (error) {
                                  console.error("Failed to delete lesson", error);
                                  alert("Failed to delete lesson. Please try again.");
                                }
                              } else {
                                // Delete from localStorage if not authenticated
                                const updatedLessons = savedLessons.filter((l) => l.id !== lesson.id);
                                setSavedLessons(updatedLessons);
                                localStorage.setItem("savedLessons", JSON.stringify(updatedLessons));
                              }
                            }}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>

                        <Button
                          variant='outline'
                          size='sm'
                          className='mt-2 w-full'
                          onClick={() => {
                            setShowFlashcards(true);
                            setTinyLessonResult(lesson.content);
                          }}
                        >
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className='text-center py-10'>
                  <p className='text-gray-500'>No saved lessons yet. Create a Tiny Lesson to get started!</p>
                  <Button className='mt-4' onClick={() => setActiveLearnTool("tinyLesson")}>
                    Create Lesson
                  </Button>
                </div>
              )}

              {showFlashcards && tinyLessonResult && (
                <Card className='bg-blue-50 border-blue-200 mt-6'>
                  <CardContent className='p-4'>
                    <div className='prose prose-sm max-w-none'>
                      <div className='whitespace-pre-wrap'>{tinyLessonResult}</div>
                    </div>
                    <Button variant='outline' size='sm' className='mt-4 w-full' onClick={() => setShowFlashcards(false)}>
                      Close
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Main Learn tab
            <>
              {/* Learning Tools */}
              <div>
                <h2 className='text-xl font-bold text-gray-900 mb-6'>Learning Tools</h2>
                <div className='space-y-4'>
                  <Card className='border-gray-200 overflow-hidden'>
                    <CardContent className='p-0'>
                      <div className='bg-blue-100 p-4'>
                        <h3 className='text-lg font-bold text-gray-900'>Tiny Lesson</h3>
                        <p className='text-sm text-gray-700 mt-1'>Get vocabulary, phrases, and grammar tips for any situation.</p>
                      </div>
                      <div className='p-4 bg-white'>
                        <Button className='w-full bg-black hover:bg-gray-800 text-white' onClick={() => setActiveLearnTool("tinyLesson")}>
                          Create Lesson
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='border-gray-200 overflow-hidden'>
                    <CardContent className='p-0'>
                      <div className='bg-green-100 p-4'>
                        <h3 className='text-lg font-bold text-gray-900'>My Cheatsheet</h3>
                        <p className='text-sm text-gray-700 mt-1'>Access your saved lessons and vocabulary flashcards.</p>
                      </div>
                      <div className='p-4 bg-white'>
                        <Button className='w-full bg-black hover:bg-gray-800 text-white' onClick={() => setActiveLearnTool("flashcards")}>
                          View Cheatsheet
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Personalized Learning */}
              <div>
                <h2 className='text-xl font-bold text-gray-900 mb-6'>Personalized Learning</h2>
                <div className='space-y-4'>
                  {learningModules.map((module, index) => (
                    <Card key={index} className='border-gray-200 hover:shadow-md transition-shadow'>
                      <CardContent className='p-4'>
                        <div className='flex items-center space-x-4'>
                          <div className={`w-16 h-16 ${module.color} rounded-xl flex items-center justify-center text-2xl`}>
                            {module.image}
                          </div>
                          <div className='flex-1'>
                            <h3 className='font-semibold text-gray-900'>{module.title}</h3>
                            <p className='text-sm text-gray-600 mt-1'>{module.description}</p>
                            <Button variant='outline' size='sm' className='mt-2 text-xs'>
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
                <h2 className='text-xl font-bold text-gray-900 mb-6'>Lessons</h2>
                <div className='space-y-4'>
                  {lessons.map((lesson, index) => (
                    <Card key={index} className='border-gray-200 hover:shadow-md transition-shadow'>
                      <CardContent className='p-4'>
                        <div className='flex items-center space-x-4'>
                          <div className={`w-16 h-16 ${lesson.color} rounded-xl flex items-center justify-center text-2xl`}>
                            {lesson.image}
                          </div>
                          <div className='flex-1'>
                            <h3 className='font-semibold text-gray-900'>{lesson.title}</h3>
                            <p className='text-sm text-gray-600 mt-1'>{lesson.description}</p>
                            <Button variant='outline' size='sm' className='mt-2 text-xs'>
                              Start
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {isSidebarOpen && <Sidebar />}
        <BottomNavigation />
      </>
    );
  }

  if (activeTab === "rewards") {
    return (
      <>
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-100 bg-white'>
          <div className='flex items-center justify-between'>
            <button onClick={() => setActiveTab("home")}>
              <ArrowLeft className='h-5 w-5 text-gray-600' />
            </button>
            <h1 className='text-lg font-semibold text-gray-900'>Rewards</h1>
            <div></div>
          </div>
        </div>

        <div className='p-6 space-y-8 flex-1 overflow-y-auto pb-20'>
          {/* BONK Balance */}
          <div className='text-center'>
            <h2 className='text-3xl font-bold text-gray-900'>{userData.bonkPoints.toLocaleString()} BONK</h2>
          </div>

          {/* Next Reward Progress */}
          <Card className='border-gray-200'>
            <CardContent className='p-4'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm font-medium text-gray-700'>Next Reward</span>
                <span className='text-sm text-gray-500'>250 BONK to go</span>
              </div>
              <Progress value={75} className='h-2' />
            </CardContent>
          </Card>

          {/* Available Rewards */}
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Available Rewards</h3>
            <div className='space-y-3'>
              {rewards.map((reward) => (
                <Card key={reward.id} className='border-gray-200'>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                          <reward.icon className='h-5 w-5 text-gray-600' />
                        </div>
                        <div>
                          <h4 className='font-medium text-gray-900'>{reward.title}</h4>
                          <p className='text-sm text-gray-600'>{reward.description}</p>
                        </div>
                      </div>
                      <Button variant='outline' size='sm' disabled={userData.bonkPoints < reward.cost} className='text-xs'>
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
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>BONK Activity</h3>
            <div className='space-y-3'>
              {bonkActivity.map((activity) => (
                <div key={activity.id} className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-green-600'>+{activity.amount} BONK</p>
                    <p className='text-xs text-gray-600'>{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isSidebarOpen && <Sidebar />}
        <BottomNavigation />
      </>
    );
  }

  return null;
}
