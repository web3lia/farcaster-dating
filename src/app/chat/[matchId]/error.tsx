"use client";

// ⚠️ TEMPORARY debug error boundary for the chat route.
// Shows the real error text instead of the generic "Application error".
// Remove once the chat crash is diagnosed.

import { useEffect } from "react";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[chat error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-5 overflow-auto safe-top">
      <h1 className="text-lg font-bold text-red-400 mb-3">💥 Chat crashed</h1>

      <div className="space-y-4 text-sm">
        <div>
          <p className="text-gray-400 mb-1">Message:</p>
          <pre className="bg-gray-900 rounded-lg p-3 whitespace-pre-wrap break-words text-red-300">
            {error?.name}: {error?.message || "(no message)"}
          </pre>
        </div>

        {error?.digest && (
          <div>
            <p className="text-gray-400 mb-1">Digest:</p>
            <pre className="bg-gray-900 rounded-lg p-3 break-words">{error.digest}</pre>
          </div>
        )}

        <div>
          <p className="text-gray-400 mb-1">Stack:</p>
          <pre className="bg-gray-900 rounded-lg p-3 whitespace-pre-wrap break-words text-xs text-gray-300">
            {error?.stack || "(no stack)"}
          </pre>
        </div>

        <button
          onClick={reset}
          className="px-5 py-2.5 bg-brand-600 rounded-2xl font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
