import { CORRECTION_SYSTEM_PROMPT } from '@/lib/prompts';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { text, model = 'gpt-3.5-turbo', language } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const systemPrompt = CORRECTION_SYSTEM_PROMPT;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
    });

    const corrected = completion.choices[0].message?.content?.trim();

    return NextResponse.json({ corrected });
  } catch (error) {
    console.error(error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
