"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth";
import { BottomNav } from "@/components/layout/BottomNav";
import { INTENTS, DEFAULT_INTENTS, PROMPT_LABEL, ABOUT_MAX, PROMPT_MAX } from "@/lib/intents";
import { TRADING_STYLES, RISK_PROFILES } from "@/lib/crypto";
import type { Intent, TradingStyle, RiskProfile } from "@/types";
import toast from "react-hot-toast";
import { authFetch } from "@/lib/auth/authFetch";
import { ShareVibeButton } from "@/components/share/ShareVibeButton";
import { Button } from "@/components/ui/Button";

const INTERESTS = ["🎨 Art", "🎵 Music", "🏋️ Fitness", "📚 Books", "🎮 Gaming", "🌍 Travel", "🍕 Food", "💻 Tech", "🌿 Nature", "🎬 Film"];

function buildForm(profile: NonNullable<ReturnType<typeof useAuthStore.getState>["profile"]>) {
  return {
    bio: profile.bio ?? "",
    age: profile.age?.toString() ?? "",
    location: profile.location ?? "",
    interests: profile.interests ?? [] as string[],

    intents: (profile.intents ?? []) as Intent[],
    trading_style: (profile.trading_style ?? []) as TradingStyle[],
    risk_profile: (profile.risk_profile ?? "") as RiskProfile | "",
    about: profile.about ?? "",
    prompt_answer: profile.prompt_answer ?? "",
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile, fid, updateProfile, signOut } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => profile ? buildForm(profile) : null!);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) router.replace("/");
  }, [profile, router]);

  if (!profile) {
    return null;
  }

  function startEdit() {
    setForm(buildForm(profile!));
    setEditing(true);
  }

  function cancelEdit() {
    setForm(buildForm(profile!));
    setEditing(false);
  }

  function toggleIntent(id: Intent) {
    if (!editing) return;
    setForm((f) => ({
      ...f,
      intents: f.intents.includes(id)
        ? f.intents.filter((x) => x !== id)
        : [...f.intents, id],
    }));
  }

  function toggleTradingStyle(id: TradingStyle) {
    if (!editing) return;
    setForm((f) => ({
      ...f,
      trading_style: f.trading_style.includes(id)
        ? f.trading_style.filter((x) => x !== id)
        : [...f.trading_style, id],
    }));
  }

  function toggleInterest(tag: string) {
    if (!editing) return;
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(tag)
        ? f.interests.filter((i) => i !== tag)
        : [...f.interests, tag],
    }));
  }

  async function save() {
    if (!fid) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/profiles/${fid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: form.bio,
          age: form.age ? parseInt(form.age) : null,
          location: form.location,
          interests: form.interests,

          intents: form.intents.length > 0 ? form.intents : DEFAULT_INTENTS,
          trading_style: form.trading_style,
          risk_profile: form.risk_profile || null,
          about: form.about.trim().slice(0, ABOUT_MAX),
          prompt_answer: form.prompt_answer.trim().slice(0, PROMPT_MAX),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateProfile(data.profile);
      setEditing(false);
      toast.success("Profile saved!");
    } catch (e: unknown) {
      // Stay in edit mode so the user doesn't lose their changes
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const ro = !editing; // read-only shorthand

  return (
    <div className="flex flex-col h-full safe-top overflow-y-auto pb-[calc(4rem_+_env(safe-area-inset-bottom)_+_2rem)]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 shrink-0">
        <h1 className="text-xl font-bold text-white">👤 Profile</h1>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={cancelEdit}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={startEdit}>Edit</Button>
        )}
      </header>

      <div className="px-5 space-y-6">
        {/* Avatar + identity */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-brand-500 shrink-0">
            <Avatar
              src={profile.pfp_url}
              alt={profile.display_name}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile.display_name}</h2>
            <p className="text-gray-400 text-sm">@{profile.username}</p>
            <p className="text-gray-500 text-xs mt-1">
              {profile.follower_count.toLocaleString()} followers
            </p>
          </div>
        </div>

        {/* Share my vibe */}
        <ShareVibeButton profile={profile} />

        {/* Fields — always rendered; disabled when not editing */}
        <div className="space-y-4">
          {/* Age */}
          <div>
            <label className="text-xs font-mono text-ink-muted mb-1.5 block">Age</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              disabled={ro}
              className="w-full bg-surface border border-ui-border text-ink placeholder-ink-muted/60 rounded-lg px-4 py-2.5 text-sm font-sans outline-none focus:border-acid/50 focus:ring-1 focus:ring-acid/30 transition-colors disabled:opacity-60 disabled:cursor-default"
              placeholder="18"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-mono text-ink-muted mb-1.5 block">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              disabled={ro}
              className="w-full bg-surface border border-ui-border text-ink placeholder-ink-muted/60 rounded-lg px-4 py-2.5 text-sm font-sans outline-none focus:border-acid/50 focus:ring-1 focus:ring-acid/30 transition-colors disabled:opacity-60 disabled:cursor-default"
              placeholder="SF, CA"
            />
          </div>

          {/* About */}
          <div>
            <label className="flex justify-between text-xs font-mono text-ink-muted mb-1.5">
              <span>About you</span>
              {editing && <span>{form.about.length}/{ABOUT_MAX}</span>}
            </label>
            <textarea
              value={form.about}
              onChange={(e) => setForm((f) => ({ ...f, about: e.target.value.slice(0, ABOUT_MAX) }))}
              disabled={ro}
              rows={3}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none disabled:opacity-60 disabled:cursor-default"
              placeholder="What you do, what you're into…"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-mono text-ink-muted mb-1.5 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              disabled={ro}
              rows={3}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none disabled:opacity-60 disabled:cursor-default"
              placeholder="Tell people about yourself…"
            />
          </div>

          {/* Intents */}
          <div>
            <label className="text-xs font-mono text-ink-muted mb-2 block">I'm here for (pick one or more)</label>
            <div className="space-y-2">
              {INTENTS.map((meta) => {
                const active = form.intents.includes(meta.id);
                return (
                  <button
                    key={meta.id}
                    type="button"
                    onClick={() => toggleIntent(meta.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                      active ? meta.selectedClass : "border-ui-border bg-surface/50"
                    } ${ro ? "cursor-default" : ""}`}
                  >
                    <span className="text-2xl">{meta.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{meta.label}</p>
                      <p className="text-xs text-gray-400">{meta.description}</p>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-md border-2 shrink-0 flex items-center justify-center text-[10px] ${
                        active ? "border-brand-500 bg-brand-500 text-white" : "border-gray-600"
                      }`}
                    >
                      {active ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="text-xs font-mono text-ink-muted mb-2 block">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.interests.includes(tag)
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "border-ui-border text-ink-muted"
                  } ${ro ? "cursor-default" : ""}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Trading style */}
          <div>
            <label className="text-xs font-mono text-ink-muted mb-2 block">Trading style (pick all that apply)</label>
            <div className="grid grid-cols-2 gap-2">
              {TRADING_STYLES.map((s) => {
                const active = form.trading_style.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleTradingStyle(s.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-colors ${
                      active
                        ? "border-acid bg-acid/15 text-ink"
                        : "border-ui-border bg-surface/50 text-ink-muted"
                    } ${ro ? "cursor-default" : ""}`}
                  >
                    <span className="text-lg leading-none">{s.emoji}</span>
                    <span className="text-xs font-mono font-semibold">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Risk profile */}
          <div>
            <label className="text-xs font-mono text-ink-muted mb-2 block">Risk profile</label>
            <div className="flex flex-wrap gap-2">
              {RISK_PROFILES.map((r) => {
                const active = form.risk_profile === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      if (!editing) return;
                      setForm((f) => ({ ...f, risk_profile: active ? "" : r.id }));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-semibold transition-colors ${
                      active
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-ui-border bg-surface/50 text-ink-muted"
                    } ${ro ? "cursor-default" : ""}`}
                  >
                    <span>{r.emoji}</span>
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="flex justify-between text-xs font-mono text-ink-muted mb-1.5">
              <span>{PROMPT_LABEL}</span>
              {editing && <span>{form.prompt_answer.length}/{PROMPT_MAX}</span>}
            </label>
            <textarea
              value={form.prompt_answer}
              onChange={(e) => setForm((f) => ({ ...f, prompt_answer: e.target.value.slice(0, PROMPT_MAX) }))}
              disabled={ro}
              rows={2}
              className="w-full bg-surface border border-ui-border text-ink placeholder-ink-muted/60 rounded-lg px-4 py-2.5 text-sm font-sans outline-none focus:border-acid/50 focus:ring-1 focus:ring-acid/30 transition-colors resize-none disabled:opacity-60 disabled:cursor-default"
              placeholder="What you're working on right now…"
            />
          </div>
        </div>

        {/* Sign out */}
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={() => { signOut(); router.replace("/"); }}
        >
          Sign out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
