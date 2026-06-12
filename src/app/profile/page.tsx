"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/auth";
import { BottomNav } from "@/components/layout/BottomNav";
import toast from "react-hot-toast";

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
  });
  const [saving, setSaving] = useState(false);

  if (!profile) {
    router.replace("/");
    return null;
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
      const res = await fetch(`/api/profiles/${fid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: form.bio,
          age: form.age ? parseInt(form.age) : null,
          location: form.location,
          interests: form.interests,
          looking_for: form.looking_for,
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
            <Image
              src={profile.pfp_url || "/placeholder-pfp.png"}
              alt={profile.display_name}
              width={80}
              height={80}
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
