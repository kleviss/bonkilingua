import { NextResponse } from 'next/server';

// Proxy to standalone backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Forward request to standalone backend
    const response = await fetch(`${BACKEND_URL}/api/correct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Backend request failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
