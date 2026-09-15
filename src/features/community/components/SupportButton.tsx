"use client";

import { useLocale, useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { useToast } from "@/components/feedback/Toast";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { toggleSupport } from "../actions";

interface SupportButtonProps {
  postId: string;
  count: number;
  supported: boolean;
  signedIn: boolean;
}

export function SupportButton({ postId, count, supported, signedIn }: SupportButtonProps) {
  const t = useTranslations("community");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic({ count, supported });

  function onClick() {
    if (!signedIn) {
      router.push(`/account?next=/community/${postId}`);
      return;
    }
    startTransition(async () => {
      setOptimistic({ supported: !optimistic.supported, count: optimistic.count + (optimistic.supported ? -1 : 1) });
      const result = await toggleSupport(postId, locale);
      if ("error" in result) toast(t("errors.generic"));
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={optimistic.supported}
      className={cn(
        "tap focus-ring inline-flex items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors",
        optimistic.supported ? "border-clay bg-clay-soft text-clay-deep" : "border-line bg-paper text-ink-soft hover:border-ink-muted",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={optimistic.supported ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.4-9.5 9-9.5 9z" strokeLinejoin="round" />
      </svg>
      <span>{t("support", { count: optimistic.count })}</span>
    </button>
  );
}
