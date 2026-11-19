import { supabase, UserProfile, ChatSession, SavedLesson } from "./supabase";

// User profile functions
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data as UserProfile;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);

  if (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

// Chat session functions
export async function saveChatSession(session: Omit<ChatSession, "id" | "created_at">) {
  const { data, error } = await supabase.from("chat_sessions").insert(session).select().single();

  if (error) {
    console.error("Error saving chat session:", error);
    throw error;
  }

  return data as ChatSession;
}

export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  const { data, error } = await supabase.from("chat_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching chat sessions:", error);
    return [];
  }

  return data as ChatSession[];
}

// Saved lesson functions
export async function saveLesson(lesson: Omit<SavedLesson, "id" | "created_at">) {
  const { data, error } = await supabase.from("saved_lessons").insert(lesson).select().single();

  if (error) {
    console.error("Error saving lesson:", error);
    throw error;
  }

  return data as SavedLesson;
}

export async function getSavedLessons(userId: string): Promise<SavedLesson[]> {
  const { data, error } = await supabase.from("saved_lessons").select("*").eq("user_id", userId).order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching saved lessons:", error);
    return [];
  }

  return data as SavedLesson[];
}

export async function deleteLesson(lessonId: string, userId: string) {
  const { error } = await supabase.from("saved_lessons").delete().eq("id", lessonId).eq("user_id", userId);

  if (error) {
    console.error("Error deleting lesson:", error);
    throw error;
  }
}

// Sync local storage data with database
export async function syncLocalStorageWithDatabase(userId: string) {
  try {
    // Sync chat history
    const chatHistory = localStorage.getItem("chatHistory");
    if (chatHistory) {
      const sessions = JSON.parse(chatHistory);
      for (const session of sessions) {
        await saveChatSession({
          user_id: userId,
          corrected_text: session.correctedText,
          input_text: session.messages.find((m: { sender: string; text: string }) => m.sender === "user")?.text || "",
          language: "unknown", // We don't have this info in local storage
          model: "gpt-3.5-turbo", // Default model
        });
      }
    }

    // Sync saved lessons
    const savedLessons = localStorage.getItem("savedLessons");
    if (savedLessons) {
      const lessons = JSON.parse(savedLessons);
      for (const lesson of lessons) {
        await saveLesson({
          user_id: userId,
          title: lesson.title,
          content: lesson.content,
        });
      }
    }

    // Sync user data
    const userData = localStorage.getItem("languageLearnerData");
    if (userData) {
      const parsedData = JSON.parse(userData);
      await updateUserProfile(userId, {
        bonk_points: parsedData.bonkPoints || 0,
        total_corrections: parsedData.totalCorrections || 0,
        languages_learned: parsedData.languagesLearned || [],
        streak_days: parsedData.streakDays || 0,
        level: parsedData.level || 1,
        daily_challenge: parsedData.dailyChallenge || false,
      });
    }

    return true;
  } catch (error) {
    console.error("Error syncing local storage with database:", error);
    return false;
  }
}
