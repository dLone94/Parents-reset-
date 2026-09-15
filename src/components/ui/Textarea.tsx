"use client";

import { cn } from "@/lib/utils/cn";
import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "focus-ring block w-full resize-y rounded-2xl border bg-paper px-4 py-3.5 text-lg leading-relaxed text-ink placeholder:text-ink-muted",
        invalid ? "border-clay" : "border-field",
        className,
      )}
      lang={undefined}
      spellCheck
      {...rest}
    />
  );
}
