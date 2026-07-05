import sdk from "@farcaster/frame-sdk";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://farcaster-dating.vercel.app";

export async function openCastComposer(text: string): Promise<void> {
  try {
    await sdk.actions.composeCast({ text, embeds: [APP_URL] });
  } catch {
    // Dismissed or unavailable — ignore
  }
}

export function localDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
