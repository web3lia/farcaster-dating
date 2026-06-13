"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { INTENTS, DEFAULT_INTENT, PROMPT_LABEL, ABOUT_MAX, PROMPT_MAX } from "@/lib/intents";
import type { Intent } from "@/types";
import toast from "react-hot-toast";

export default function OnboardingPage() {
  const router = useRouter();
  const { fid, isAuthenticated, profile, updateProfile, setOnboarded } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [intent, setIntent] = useState<Intent>(profile?.intent ?? DEFAULT_INTENT);
  const [about, setAbout] = useState(profile?.about ?? "");
  const [promptAnswer, setPromptAnswer] = useState(profile?.prompt_answer ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  async function finish() {
    if (!fid || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/profiles/${fid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          about: about.trim().slice(0, ABOUT_MAX),
          prompt_answer: promptAnswer.trim().slice(0, PROMPT_MAX),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      updateProfile(data.profile);
    } catch {
      // Non-blocking: onboarding shouldn't trap the user if the save hiccups
      toast.error("Не удалось сохранить — можно изменить позже в профиле");
    } finally {
      setOnboarded(true);
      setSaving(false);
      router.replace("/swipe");
    }
  }

  function skipAll() {
    setOnboarded(true);
    router.replace("/swipe");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 flex flex-col p-6 safe-top safe-bottom">
      {/* Progress + skip */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-1.5">
          <span className={`h-1.5 w-8 rounded-full ${step >= 1 ? "bg-brand-500" : "bg-gray-700"}`} />
          <span className={`h-1.5 w-8 rounded-full ${step >= 2 ? "bg-brand-500" : "bg-gray-700"}`} />
        </div>
        <button onClick={skipAll} className="text-sm text-gray-400">
          Пропустить
        </button>
      </div>

      {step === 1 ? (
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold text-white">Что ты ищешь?</h1>
          <p className="text-gray-400 text-sm mt-1 mb-6">Можно поменять в любой момент</p>

          <div className="space-y-3">
            {INTENTS.map((meta) => {
              const active = intent === meta.id;
              return (
                <button
                  key={meta.id}
                  onClick={() => setIntent(meta.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-colors ${
                    active ? meta.selectedClass : "border-gray-800 bg-gray-900/50"
                  }`}
                >
                  <span className="text-3xl">{meta.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{meta.label}</p>
                    <p className="text-sm text-gray-400">{meta.description}</p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 shrink-0 ${
                      active ? "border-brand-500 bg-brand-500" : "border-gray-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-6">
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 bg-brand-600 text-white font-bold rounded-2xl text-lg"
            >
              Далее
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold text-white">Немного о тебе</h1>
          <p className="text-gray-400 text-sm mt-1 mb-6">Оба поля можно пропустить</p>

          <div className="space-y-5">
            <div>
              <label className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Расскажи о себе</span>
                <span>{about.length}/{ABOUT_MAX}</span>
              </label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value.slice(0, ABOUT_MAX))}
                rows={4}
                placeholder="Чем занимаешься, что интересно…"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div>
              <label className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>{PROMPT_LABEL}</span>
                <span>{promptAnswer.length}/{PROMPT_MAX}</span>
              </label>
              <textarea
                value={promptAnswer}
                onChange={(e) => setPromptAnswer(e.target.value.slice(0, PROMPT_MAX))}
                rows={3}
                placeholder="Над чем работаешь прямо сейчас…"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>

          <div className="mt-auto pt-6 flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-4 text-gray-400 font-semibold"
            >
              Назад
            </button>
            <button
              onClick={finish}
              disabled={saving}
              className="flex-1 py-4 bg-brand-600 text-white font-bold rounded-2xl text-lg disabled:opacity-50"
            >
              {saving ? "Сохраняю…" : "Готово"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
