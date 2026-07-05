"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { INTENTS, DEFAULT_INTENTS, PROMPT_LABEL, ABOUT_MAX, PROMPT_MAX } from "@/lib/intents";
import sdk from "@farcaster/frame-sdk";
import { TRADING_STYLES, RISK_PROFILES } from "@/lib/crypto";
import { ShareVibeButton } from "@/components/share/ShareVibeButton";
import { Avatar } from "@/components/ui/Avatar";
import type { Intent, TradingStyle, RiskProfile } from "@/types";
import toast from "react-hot-toast";
import { authFetch } from "@/lib/auth/authFetch";
import { Button } from "@/components/ui/Button";

const INTERESTS = ["🎨 Art", "🎵 Music", "🏋️ Fitness", "📚 Books", "🎮 Gaming", "🌍 Travel", "🍕 Food", "💻 Tech", "🌿 Nature", "🎬 Film"];
const TOTAL_STEPS = 4;

interface SocialProof {
  mode: "frens" | "total";
  count: number;
  profiles: { fid: number; username: string; pfp_url: string }[];
}

const inputCls = "w-full bg-surface border border-ui-border text-ink placeholder-ink-muted/60 rounded-lg px-4 py-2.5 text-sm font-sans outline-none focus:border-acid/50 focus:ring-1 focus:ring-acid/30 transition-colors";
const textareaCls = `${inputCls} resize-none`;
const labelCls = "text-xs font-mono text-ink-muted mb-1.5 block";

export default function OnboardingPage() {
  const router = useRouter();
  const { fid, isAuthenticated, profile, updateProfile, setOnboarded, frameAdded, setFrameAdded } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving] = useState(false);
  const [socialProof, setSocialProof] = useState<SocialProof | null>(null);

  const [age, setAge] = useState(profile?.age?.toString() ?? "");
  const [userLocation, setUserLocation] = useState(profile?.location ?? "");

  const [about, setAbout] = useState(profile?.about ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [promptAnswer, setPromptAnswer] = useState(profile?.prompt_answer ?? "");
  const [intents, setIntents] = useState<Intent[]>(profile?.intents ?? []);
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [tradingStyle, setTradingStyle] = useState<TradingStyle[]>(profile?.trading_style ?? []);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | "">(profile?.risk_profile ?? "");

  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    authFetch("/api/social-proof")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setSocialProof(d); })
      .catch(() => {});
  }, [isAuthenticated]);

  function goNext() {
    if (step < TOTAL_STEPS) setStep((s) => (s + 1) as typeof step);
  }

  function goBack() {
    if (step > 1) setStep((s) => (s - 1) as typeof step);
  }

  function toggleIntent(id: Intent) {
    setIntents((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function toggleInterest(tag: string) {
    setInterests((prev) => prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]);
  }
  function toggleTradingStyle(id: TradingStyle) {
    setTradingStyle((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function finish() {
    if (!fid || saving) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/profiles/${fid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: age ? parseInt(age) : null,
          location: userLocation.trim(),

          about: about.trim().slice(0, ABOUT_MAX),
          bio: bio.trim(),
          prompt_answer: promptAnswer.trim().slice(0, PROMPT_MAX),
          intents: intents.length > 0 ? intents : DEFAULT_INTENTS,
          interests,
          trading_style: tradingStyle,
          risk_profile: riskProfile || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      updateProfile(data.profile);
    } catch {
      toast.error("Couldn't save — you can change this later in your profile");
    } finally {
      setOnboarded(true);
      setSaving(false);

      // If the SDK already reports the app as added with a token, save it now
      // so we skip the /add-app screen. Fire-and-forget — don't block navigation.
      sdk.context.then((ctx) => {
        if (ctx.client.added && ctx.client.notificationDetails) {
          const { token, url } = ctx.client.notificationDetails;
          authFetch("/api/notification-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, url }),
          }).catch(console.error);
          setFrameAdded(true);
        }
      }).catch(() => {});

      router.replace("/add-app");
    }
  }

  function skipAll() {
    setOnboarded(true);
    router.replace("/add-app");
  }

  return (
    <div className="h-screen bg-terminal-bg flex flex-col p-6 safe-top safe-bottom overflow-hidden">
      {/* Progress + skip all */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 <= step ? "w-8 bg-acid" : "w-4 bg-ui-border"
              }`}
            />
          ))}
        </div>
        <button onClick={skipAll} className="text-xs font-mono text-ink-muted hover:text-ink transition-colors">
          Skip all
        </button>
      </div>

      <p className="text-xs font-mono text-ink-muted uppercase tracking-widest mb-1 shrink-0">
        Step {step} of {TOTAL_STEPS}
      </p>

      {/* ── Step 1 — Basics ── */}
      {step === 1 && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <h1 className="text-2xl font-mono font-bold text-ink mb-1">Basics</h1>
            <p className="text-sm text-ink-muted mb-4">All optional — fill in what you want shown on your profile</p>

            {socialProof && (
              <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-2xl bg-acid/5 border border-acid/20">
                {socialProof.profiles.length > 0 && (
                  <div className="flex -space-x-2 shrink-0">
                    {socialProof.profiles.slice(0, 5).map((p) => (
                      <div key={p.fid} className="w-8 h-8 rounded-full overflow-hidden border-2 border-terminal-bg shrink-0">
                        <Avatar src={p.pfp_url} alt={p.username} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm font-mono text-acid leading-tight">
                  {socialProof.mode === "frens" && socialProof.count > 0
                    ? `${socialProof.count} of your frens ${socialProof.count === 1 ? "is" : "are"} already here 💜`
                    : socialProof.mode === "frens" && socialProof.count === 0
                    ? "Be the first of your frens here 💜"
                    : socialProof.count > 0
                    ? `${socialProof.count} people are already on Onlyfrens 💜`
                    : "Join the community 💜"}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="28"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  placeholder="SF, CA"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 pt-6 flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={goNext}>Skip</Button>
            <Button variant="primary" size="lg" className="flex-1" showPrefix onClick={goNext}>Next</Button>
          </div>
        </div>
      )}

      {/* ── Step 2 — About you ── */}
      {step === 2 && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <h1 className="text-2xl font-mono font-bold text-ink mb-1">About you</h1>
            <p className="text-sm text-ink-muted mb-5">Help people get to know you</p>

            <div className="space-y-4">
              <div>
                <label className="flex justify-between mb-1.5">
                  <span className="text-xs font-mono text-ink-muted">About you</span>
                  <span className="text-xs font-mono text-ink-muted">{about.length}/{ABOUT_MAX}</span>
                </label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value.slice(0, ABOUT_MAX))}
                  rows={3}
                  placeholder="What you do, what you're into…"
                  className={textareaCls}
                />
              </div>
              <div>
                <label className={labelCls}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell people about yourself…"
                  className={textareaCls}
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 pt-6 flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={goBack}>Back</Button>
            <Button variant="primary" size="lg" className="flex-1" showPrefix onClick={goNext}>Next</Button>
          </div>
        </div>
      )}

      {/* ── Step 3 — Goals & interests ── */}
      {step === 3 && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
          <h1 className="text-2xl font-mono font-bold text-ink mb-1">Goals & interests</h1>
          <p className="text-sm text-ink-muted mb-5">What brings you here, and what are you into?</p>

          <div className="space-y-5">
            <div>
              <label className={labelCls}>I&apos;m here for (pick one or more)</label>
              <div className="space-y-2">
                {INTENTS.map((meta) => {
                  const active = intents.includes(meta.id);
                  return (
                    <button
                      key={meta.id}
                      type="button"
                      onClick={() => toggleIntent(meta.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                        active ? meta.selectedClass : "border-ui-border bg-surface/50"
                      }`}
                    >
                      <span className="text-2xl">{meta.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-mono font-semibold text-ink">{meta.label}</p>
                        <p className="text-xs text-ink-muted">{meta.description}</p>
                      </div>
                      <span
                        className={`w-4 h-4 rounded-md border-2 shrink-0 flex items-center justify-center text-[10px] ${
                          active ? "border-acid bg-acid text-terminal-bg" : "border-ui-border"
                        }`}
                      >
                        {active ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelCls}>Interests</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
                      interests.includes(tag)
                        ? "bg-acid/20 border-acid/60 text-acid"
                        : "border-ui-border text-ink-muted hover:border-acid/40 hover:text-ink"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          </div>

          <div className="shrink-0 pt-6 flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={goBack}>Back</Button>
            <Button variant="primary" size="lg" className="flex-1" showPrefix onClick={goNext}>Next</Button>
          </div>
        </div>
      )}

      {/* ── Step 4 — Crypto vibe ── */}
      {step === 4 && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
          <h1 className="text-2xl font-mono font-bold text-ink mb-1">Crypto vibe</h1>
          <p className="text-sm text-ink-muted mb-5">Let people know how you move onchain</p>

          <div className="space-y-5">
            <div>
              <label className={labelCls}>Trading style (pick all that apply)</label>
              <div className="grid grid-cols-2 gap-2">
                {TRADING_STYLES.map((s) => {
                  const active = tradingStyle.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleTradingStyle(s.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-colors ${
                        active
                          ? "border-acid bg-acid/15 text-ink"
                          : "border-ui-border bg-surface/50 text-ink-muted"
                      }`}
                    >
                      <span className="text-lg leading-none">{s.emoji}</span>
                      <span className="text-xs font-mono font-semibold">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelCls}>Risk profile</label>
              <div className="flex flex-wrap gap-2">
                {RISK_PROFILES.map((r) => {
                  const active = riskProfile === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRiskProfile(active ? "" : r.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-mono font-semibold transition-colors ${
                        active
                          ? "border-gold bg-gold/15 text-gold"
                          : "border-ui-border bg-surface/50 text-ink-muted"
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="flex justify-between mb-1.5">
                <span className="text-xs font-mono text-ink-muted">{PROMPT_LABEL}</span>
                <span className="text-xs font-mono text-ink-muted">{promptAnswer.length}/{PROMPT_MAX}</span>
              </label>
              <textarea
                value={promptAnswer}
                onChange={(e) => setPromptAnswer(e.target.value.slice(0, PROMPT_MAX))}
                rows={2}
                placeholder="What you're working on right now…"
                className={textareaCls}
              />
            </div>
          </div>
          </div>

          <div className="shrink-0 pt-6 space-y-3">
            <ShareVibeButton
              profile={{ intents, trading_style: tradingStyle, risk_profile: riskProfile || undefined }}
              onAfter={finish}
              className="w-full"
            />
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" onClick={goBack}>Back</Button>
              <Button variant="primary" size="lg" className="flex-1" onClick={finish} disabled={saving}>
                {saving ? "Saving…" : "Done"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
