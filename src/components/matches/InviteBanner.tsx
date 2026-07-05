"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { authFetch } from "@/lib/auth/authFetch";
import { openCastComposer, localDateString } from "@/lib/openCastComposer";
import { Button } from "@/components/ui/Button";

const INVITE_TEXT =
  "come find your frens on Onlyfrens 💜 dating, friendship & networking for Farcaster 👇";

export function InviteBanner() {
  const { inviteBannerLastShown, setInviteBannerLastShown } = useAuthStore();
  const [frensCount, setFrensCount] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const today = localDateString();
  const alreadyShownToday = inviteBannerLastShown === today;

  useEffect(() => {
    if (alreadyShownToday) return;
    authFetch("/api/social-proof")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setFrensCount(d.count ?? 0); })
      .catch(() => {});
  }, [alreadyShownToday]);

  if (alreadyShownToday || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    setInviteBannerLastShown(today);
  }

  async function invite() {
    await openCastComposer(INVITE_TEXT);
    dismiss();
  }

  return (
    <div className="mx-4 mt-3 mb-1 px-4 py-3 rounded-2xl bg-brand-600/15 border border-brand-500/30 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-brand-300 font-medium leading-snug">
          {frensCount !== null && frensCount > 0
            ? `You have ${frensCount} frens on Onlyfrens 💜 invite more 👇`
            : "Invite your frens to Onlyfrens 💜"}
        </p>
        <button
          onClick={dismiss}
          className="text-brand-400 hover:text-white shrink-0 text-base leading-none mt-0.5"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <Button variant="primary" size="sm" onClick={invite} showPrefix>
        Invite frens
      </Button>
    </div>
  );
}
