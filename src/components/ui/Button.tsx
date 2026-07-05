"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "destructive" | "superlike";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  showPrefix?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-mono rounded-lg transition-colors " +
  "min-h-[44px] active:scale-[0.97] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary:
    "border border-acid bg-acid/10 text-acid hover:bg-acid hover:text-terminal-bg active:bg-acid active:text-terminal-bg",
  secondary:
    "border border-ui-border text-ink-muted hover:bg-surface hover:text-ink active:bg-surface active:text-ink",
  destructive:
    "border border-danger text-danger hover:bg-danger/10 active:bg-danger/10",
  superlike:
    "border border-gold bg-gold/10 text-gold hover:bg-gold hover:text-terminal-bg active:bg-gold active:text-terminal-bg",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", fullWidth = false, showPrefix = false, className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={[
        base,
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {showPrefix && <span className="opacity-70">&gt;</span>}
      {children}
    </button>
  );
});
