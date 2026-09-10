import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-clay text-paper hover:bg-clay-deep active:bg-clay-deep shadow-soft disabled:bg-ink-muted",
  secondary:
    "bg-paper text-ink border border-line hover:border-ink-muted active:bg-sand disabled:text-ink-muted",
  ghost: "bg-transparent text-ink-soft hover:text-ink hover:bg-sand disabled:text-ink-muted",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-base",
  lg: "px-6 py-3.5 text-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * Buttons wrap their text and never use fixed widths, so long German or
 * Finnish labels stay readable.
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "tap focus-ring inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150",
        "whitespace-normal text-center leading-snug disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export const buttonClassName = (variant: Variant = "primary", size: Size = "md") =>
  cn(
    "tap focus-ring inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 whitespace-normal text-center leading-snug",
    variants[variant],
    sizes[size],
  );
