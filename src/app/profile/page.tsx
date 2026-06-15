"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth";
import { BottomNav } from "@/components/layout/BottomNav";
import { INTENTS, DEFAULT_INTENTS, intentsToMetas, PROMPT_LABEL, PROMPT_SHORT, ABOUT_MAX, PROMPT_MAX } from "@/lib/intents";
import { TRADING_STYLES, RISK_PROFILES } from "@/lib/crypto";
import type { Intent, TradingStyle, RiskProfile } from "@/types";
import toast from "react-hot-toast";
import { authFetch } from "@/lib/auth/authFetch";

const INTERESTS = ["🎨 Art", "🎵 Music", "🏋️ Fitness", "📚 Books", "🎮 Gaming", "🌍 Travel", "🍕 Food", "💻 Tech", "🌿 Nature", "🎬 Film"];

export default function ProfilePage() {
  const router = useRouter();
  const { profile, fid, updateProfile, signOut } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    bio: profile?.bio ?? "",
    age: profile?.age?.toString() ?? "",
    location: profile?.location ?? "",
    interests: profile?.interests ?? [] as string[],
    looking_for: profile?.looking_for ?? "",
    intents: (profile?.intents ?? []) as Intent[],
    trading_style: (profile?.trading_style ?? []) as TradingStyle[],
    risk_profile: (profile?.risk_profile ?? "") as RiskProfile | "",
    about: profile?.about ?? "",
    prompt_answer: profile?.prompt_answer ?? "",
  });
  const [saving, setSaving] = useState(false);

  if (!profile) {
    router.replace("/");
    return null;
  }

  function toggleIntent(id: Intent) {
    setForm((f) => ({
      ...f,
      intents: f.intents.includes(id)
        ? f.intents.filter((x) => x !== id)
        : [...f.intents, id],
    }));
  }

  function toggleTradingStyle(id: TradingStyle) {
    setForm((f) => ({
      ...f,
      trading_style: f.trading_style.includes(id)
        ? f.trading_style.filter((x) => x !== id)
        : [...f.trading_style, id],
    }));
  }

  function toggleInterest(tag: string) {
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
          looking_for: form.looking_for,
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
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full safe-top overflow-y-auto pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 shrink-0">
        <h1 className="text-xl font-bold text-white">👤 Profile</h1>
        <button
          onClick={() => setEditing((v) => !v)}
          className="text-sm px-3 py-1.5 rounded-full bg-gray-800 text-gray-300"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </header>

      <div className="px-5 space-y-6">
        {/* Avatar */}
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

        {editing ? (
          <div className="space-y-4">
            {/* Intent / goal */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">I'm here for (pick one or more)</label>
              <div className="space-y-2">
                {INTENTS.map((meta) => {
                  const active = form.intents.includes(meta.id);
                  return (
                    <button
                      key={meta.id}
                      type="button"
                      onClick={() => toggleIntent(meta.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                        active ? meta.selectedClass : "border-gray-800 bg-gray-900/50"
                      }`}
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

            {/* Trading style (multi-select) */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Trading style (pick all that apply)</label>
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
                          ? "border-brand-500 bg-brand-500/20 text-white"
                          : "border-gray-800 bg-gray-900/50 text-gray-400"
                      }`}
                    >
                      <span className="text-lg leading-none">{s.emoji}</span>
                      <span className="text-xs font-semibold">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Risk profile (single-select) */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Risk profile</label>
              <div className="flex flex-wrap gap-2">
                {RISK_PROFILES.map((r) => {
                  const active = form.risk_profile === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, risk_profile: active ? "" : r.id }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-semibold transition-colors ${
                        active
                          ? "border-amber-500 bg-amber-500/20 text-amber-300"
                          : "border-gray-800 bg-gray-900/50 text-gray-400"
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* About */}
            <div>
              <label className="flex justify-between text-xs text-gray-400 mb-1">
                <span>About you</span>
                <span>{form.about.length}/{ABOUT_MAX}</span>
              </label>
              <textarea
                value={form.about}
                onChange={(e) => setForm((f) => ({ ...f, about: e.target.value.slice(0, ABOUT_MAX) }))}
                rows={3}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="What you do, what you're into…"
              />
            </div>

            {/* Prompt */}
            <div>
              <label className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{PROMPT_LABEL}</span>
                <span>{form.prompt_answer.length}/{PROMPT_MAX}</span>
              </label>
              <textarea
                value={form.prompt_answer}
                onChange={(e) => setForm((f) => ({ ...f, prompt_answer: e.target.value.slice(0, PROMPT_MAX) }))}
                rows={2}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="What you're working on right now…"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Tell people about yourself…"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="18"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="SF, CA"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Interests</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.interests.includes(tag)
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "border-gray-700 text-gray-400"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-3 bg-brand-600 text-white font-bold rounded-2xl disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Intent badges */}
            <div className="flex flex-wrap gap-2">
              {intentsToMetas(profile.intents).map((meta) => (
                <div
                  key={meta.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold ${meta.badgeClass}`}
                >
                  <span className="text-sm leading-none">{meta.emoji}</span>
                  <span>{meta.label}</span>
                </div>
              ))}
            </div>

            {profile.about && (
              <p className="text-gray-200 text-sm leading-relaxed">{profile.about}</p>
            )}
            {profile.prompt_answer && (
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-white">🛠 {PROMPT_SHORT}:</span>{" "}
                {profile.prompt_answer}
              </p>
            )}
            {profile.bio && (
              <p className="text-gray-300 text-sm leading-relaxed">{profile.bio}</p>
            )}
            {profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-800 text-gray-300 rounded-full px-3 py-1.5">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {profile.location && (
              <p className="text-sm text-gray-400">📍 {profile.location}</p>
            )}
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={() => { signOut(); router.replace("/"); }}
          className="w-full py-2.5 border border-gray-700 text-gray-400 rounded-2xl text-sm mt-4"
        >
          Sign out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
