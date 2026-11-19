"use client";

import { useState } from "react";

export default function LanguageLearnerApp() {
  const [inputText, setInputText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const correctText = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError("");
    setCorrectedText("");

    try {
      const response = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          model: "gpt-4o-mini",
          language: "english",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Correction request failed.");
      }

      setCorrectedText(data.corrected || "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Bonkilingua</h1>
      <p>Enter text to get an English correction.</p>
      <textarea
        className="min-h-36 w-full rounded-md border p-3"
        value={inputText}
        onChange={(event) => setInputText(event.target.value)}
        placeholder="Enter the text you want to correct..."
      />
      <button
        className="rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black disabled:opacity-50"
        onClick={correctText}
        disabled={!inputText.trim() || isLoading}
      >
        {isLoading ? "Correcting..." : "Correct Text"}
      </button>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {correctedText && (
        <section className="rounded-md border bg-green-50 p-4">
          <h2 className="font-semibold">Correction</h2>
          <p className="mt-2 whitespace-pre-wrap">{correctedText}</p>
        </section>
      )}
    </main>
  );
}
