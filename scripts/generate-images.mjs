import sharp from "sharp";
import { mkdir } from "fs/promises";

await mkdir("public", { recursive: true });

function makeSvg(width, height, { showTagline = false } = {}) {
  const cx = width / 2;
  const cy = height / 2;

  // Heart path scaled to fit nicely
  const heartScale = Math.min(width, height) * 0.22;
  const hx = cx;
  const hy = cy - height * 0.06;

  // og.png gets a two-line layout; others are square/compact
  const isWide = width > height;
  const titleY = isWide ? cy + height * 0.12 : cy + height * 0.27;
  const taglineY = titleY + (isWide ? height * 0.1 : height * 0.09);
  const titleSize = Math.round(Math.min(width, height) * (isWide ? 0.065 : 0.1));
  const taglineSize = Math.round(titleSize * 0.55);
  const heartY = isWide ? cy - height * 0.15 : hy;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%"  stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#3B0764"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${Math.round(heartScale * 0.08)}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <!-- Subtle grid dots -->
  <pattern id="dots" x="0" y="0" width="${Math.round(width * 0.04)}" height="${Math.round(width * 0.04)}" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="white" fill-opacity="0.06"/>
  </pattern>
  <rect width="${width}" height="${height}" fill="url(#dots)"/>

  <!-- Heart shape -->
  <g transform="translate(${hx}, ${heartY}) scale(${heartScale / 60})" filter="url(#glow)">
    <path d="M0,18 C0,18 -30,-8 -30,-22 C-30,-36 -18,-44 0,-32 C18,-44 30,-36 30,-22 C30,-8 0,18 0,18 Z"
          fill="white" fill-opacity="0.95"/>
  </g>

  <!-- Title -->
  <text x="${cx}" y="${titleY}"
        font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
        font-size="${titleSize}" font-weight="700" fill="white"
        text-anchor="middle" letter-spacing="-0.5">Farcaster Dating</text>

  ${showTagline ? `<text x="${cx}" y="${taglineY}"
        font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
        font-size="${taglineSize}" font-weight="400" fill="white" fill-opacity="0.65"
        text-anchor="middle">Swipe · Match · Chat</text>` : ""}
</svg>`;
}

const images = [
  { file: "public/icon.png",   w: 200,  h: 200,  opts: {} },
  { file: "public/splash.png", w: 200,  h: 200,  opts: {} },
  { file: "public/og.png",     w: 1200, h: 628,  opts: { showTagline: true } },
];

for (const { file, w, h, opts } of images) {
  const svg = Buffer.from(makeSvg(w, h, opts));
  await sharp(svg).png().toFile(file);
  console.log(`✓  ${file}  (${w}×${h})`);
}
