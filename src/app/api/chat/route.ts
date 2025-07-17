import { EXPLANATION_SYSTEM_PROMPT } from '@/lib/prompts';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages, model = 'gpt-3.5-turbo', systemPrompt } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt ?? EXPLANATION_SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0].message?.content?.trim();
    return NextResponse.json({ reply });
  } catch (error) {
    console.error(error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
