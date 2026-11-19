import { NextResponse } from "next/server";
import { resolveModel } from "@/constants/models";
import { getOpenAI } from "@/lib/openai";
import { EXPLANATION_SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { messages, model, systemPrompt } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      // Some callers send no model, and a tab loaded before a model was
      // retired may still send the old name.
      model: resolveModel(model),
      messages: [{ role: "system", content: systemPrompt ?? EXPLANATION_SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
    });

    const reply = completion.choices[0].message?.content?.trim();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
