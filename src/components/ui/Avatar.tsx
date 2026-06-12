"use client";

import { useState } from "react";

// Plain <img> avatar — intentionally NOT next/image, because Farcaster pfp URLs
// live on arbitrary hosts (imagedelivery.net, mypinata.cloud, seadn.io, …) and
// next/image throws a hard client-side exception on any unlisted host.
// Falls back to an inline SVG so a broken/empty URL never crashes or 404s.

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#7C3AED"/><text x="50%" y="54%" font-size="36" text-anchor="middle" dominant-baseline="middle">💜</text></svg>`
  );

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export function Avatar({ src, alt, className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const url = !errored && src ? src : FALLBACK;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      draggable={false}
      onError={() => setErrored(true)}
    />
  );
}
