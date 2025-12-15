import { NextResponse } from "next/server";

// Proxy to standalone backend
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Forward request to standalone backend
    const response = await fetch(`${BACKEND_URL}/api/detect-language`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Check content type before parsing JSON
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, read as text to see what we got
      const text = await response.text();
      console.error("Backend returned non-JSON response:", text.substring(0, 200));
      return NextResponse.json({ error: `Backend returned invalid response: ${text.substring(0, 100)}` }, { status: 500 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Backend request failed" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying to backend:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
