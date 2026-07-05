"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import sdk from "@farcaster/frame-sdk";
import { authFetch } from "@/lib/auth/authFetch";

async function saveToken(token: string, url: string) {
  return authFetch("/api/notification-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, url }),
  });
}

export default function AddAppPage() {
  const router = useRouter();
  const { setFrameAdded, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  // On mount: check if already added with a token in context.
  // Save the token silently, but STILL show this screen so the user sees it.
  useEffect(() => {
    if (!isAuthenticated) return;
    sdk.context.then((ctx) => {
      console.log("[add-app] sdk.context client:", JSON.stringify(ctx.client));
      if (ctx.client.added && ctx.client.notificationDetails) {
        const { token, url } = ctx.client.notificationDetails;
        console.log("[add-app] already added — saving token from context silently");
        saveToken(token, url)
          .then(() => console.log("[add-app] context token saved"))
          .catch((e) => console.error("[add-app] context token save failed:", e));
        setFrameAdded(true);
        // Don't redirect here — let user see and dismiss the screen themselves
      }
    }).catch((e) => console.error("[add-app] sdk.context failed:", e));
  }, [isAuthenticated, setFrameAdded]);

  async function handleAdd() {
    setLoading(true);
    try {
      console.log("[add-app] calling sdk.actions.addFrame()");
      const result = await sdk.actions.addFrame();
      console.log("[add-app] addFrame result:", JSON.stringify(result));
      if (result?.notificationDetails) {
        const { token, url } = result.notificationDetails;
        console.log("[add-app] saving token from addFrame result");
        await saveToken(token, url);
        console.log("[add-app] addFrame token saved");
      } else {
        console.log("[add-app] addFrame returned no notificationDetails");
      }
      setFrameAdded(true);
    } catch (e) {
      console.log("[add-app] addFrame threw:", e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setFrameAdded(true);
      router.replace("/swipe");
    }
  }

  function handleSkip() {
    setFrameAdded(true);
    router.replace("/swipe");
  }

  return (
    <div className="min-h-screen bg-terminal-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center">
          <img src="/onlyfrens_mascot_green.png" alt="Onlyfrens" className="w-20 h-20 mb-4 mx-auto" />
          <h1 className="text-2xl font-mono font-bold text-ink mb-2">Don&apos;t miss your matches 💚</h1>
          <p className="text-sm font-mono text-ink-muted leading-relaxed">
            Turn on notifications so you know the moment someone matches or messages you.
          </p>
        </div>

        <div className="w-full bg-surface border border-ui-border rounded-2xl p-5 space-y-3">
          {[
            ["💜", "Instant match alerts"],
            ["💬", "New message notifications"],
            ["⭐", "Superlike notifications"],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-xl shrink-0">{icon}</span>
              <span className="text-sm font-mono text-ink">{text}</span>
            </div>
          ))}
        </div>

        <div className="w-full space-y-4">
          <Button variant="primary" size="lg" fullWidth showPrefix onClick={handleAdd} disabled={loading}>
            {loading ? "Adding…" : "Add Onlyfrens"}
          </Button>
          <p className="text-[11px] font-mono text-ink-muted text-center">
            Tapping opens a quick system prompt — takes 2 seconds.
          </p>
          <button
            onClick={handleSkip}
            className="block w-full text-center text-xs font-mono text-ink-muted/60 hover:text-ink-muted transition-colors py-1"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
