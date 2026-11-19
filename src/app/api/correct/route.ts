import { NextResponse } from "next/server";
import { resolveModel } from "@/constants/models";
import { getOpenAI } from "@/lib/openai";
import { CORRECTION_SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { text, model } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      // A tab loaded before a model was retired may still send the old name.
      model: resolveModel(model),
      messages: [
        { role: "system", content: CORRECTION_SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    });

    const corrected = completion.choices[0].message?.content?.trim();

    return NextResponse.json({ corrected });
  } catch (error) {
    console.error("Error in /api/correct:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
