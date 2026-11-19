import { NextResponse } from "next/server";
import { DEFAULT_MODEL } from "@/constants/models";
import { completeChat } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const trimmed = text.trim();
    if (trimmed.length < 15 || trimmed.split(/\s+/).length < 3) {
      // Not enough signal to confidently detect
      return NextResponse.json({ language: "unknown", confidence: 0 });
    }

    const answer = await completeChat({
      model: DEFAULT_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a strict language classifier. Respond with ONLY one token from this exact set: english|spanish|french|german|italian|portuguese|unknown. No explanation.",
        },
        { role: "user", content: trimmed },
      ],
    });

    const raw = answer.text.toLowerCase();
    const match = raw.match(/english|spanish|french|german|italian|portuguese|unknown/);
    let language = match ? match[0] : "unknown";

    // Fallback: if unknown, bias to english when the text looks like English
    if (language === "unknown") {
      const isAsciiOnly = !/[^\x00-\x7F]/.test(trimmed);
      const englishStopwordPattern =
        /\b(the|and|is|are|to|of|in|that|for|with|on|it|this|as|was|were|be|have|has|had|at|by|from)\b/i;
      if (isAsciiOnly && englishStopwordPattern.test(trimmed)) {
        language = "english";
      }
    }

    return NextResponse.json({ language });
  } catch (error) {
    console.error("Error in /api/detect-language:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
