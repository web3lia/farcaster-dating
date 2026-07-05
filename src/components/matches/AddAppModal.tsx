"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth";
import { authFetch } from "@/lib/auth/authFetch";
import { localDateString } from "@/lib/openCastComposer";
import sdk from "@farcaster/frame-sdk";

async function saveToken(token: string, url: string) {
  return authFetch("/api/notification-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, url }),
  });
}

export function AddAppModal() {
  const { addAppModalLastShown, setAddAppModalLastShown } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sdk.context.then((ctx) => {
      // Gate 1: already added → never show, full stop.
      if (ctx.client.added) return;

      // Gate 2: already shown today → skip.
      if (addAppModalLastShown === localDateString()) return;

      // App not added, not shown today → show the modal.
      setOpen(true);
      setAddAppModalLastShown(localDateString());
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setOpen(false);
  }

  async function handleAdd() {
    setLoading(true);
    try {
      // Check context first — token may already be there.
      const ctx = await sdk.context;
      if (ctx.client.added && ctx.client.notificationDetails) {
        const { token, url } = ctx.client.notificationDetails;
        await saveToken(token, url);
        close();
        return;
      }

      // Prompt add via Warpcast dialog.
      const result = await sdk.actions.addFrame();
      if (result?.notificationDetails) {
        const { token, url } = result.notificationDetails;
        await saveToken(token, url);
      }
    } catch {
      // Rejected or unavailable — close anyway, will retry tomorrow.
    } finally {
      setLoading(false);
      close();
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
      onClick={close}
    >
      <div
        className="bg-surface border border-ui-border rounded-2xl px-7 py-8 w-full max-w-sm text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img src="/onlyfrens_mascot_green.png" alt="Onlyfrens" className="w-16 h-16 mb-3 mx-auto" />
        <h2 className="text-xl font-mono font-bold text-ink mb-2">Add Onlyfrens</h2>
        <p className="text-sm font-mono text-ink-muted mb-7">
          Get notified when someone messages you 💬
        </p>
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            showPrefix
            onClick={handleAdd}
            disabled={loading}
          >
            {loading ? "Adding…" : "Add Onlyfrens"}
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={close}>
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}
