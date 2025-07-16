"use client";

import { useEffect } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased bg-gray-100";
  }, []);

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-100 py-4">
      <div className="w-full max-w-md min-h-[calc(100vh-2rem)] bg-white shadow-lg rounded-2xl overflow-hidden flex flex-col relative">
        {children}
      </div>
    </div>
  );
}
