"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useToast } from "@/components/feedback/Toast";
import { reportContent } from "../actions";

export function ReportButton({ postId, commentId, signedIn }: { postId?: string; commentId?: string; signedIn: boolean }) {
  const t = useTranslations("community.report");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  if (!signedIn) return null;

  function send(reason: string) {
    startTransition(async () => {
      const result = await reportContent({ postId, commentId, reason });
      toast(result.ok ? t("thanks") : t("failed"));
      setOpen(false);
    });
  }

  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen((v) => !v)} className="focus-ring rounded-full text-sm text-ink-muted underline-offset-4 hover:underline">
        {t("button")}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-2xl border border-line bg-paper p-2 shadow-lift">
          {(["spam", "harmful", "personal_info", "other"] as const).map((reason) => (
            <button
              key={reason}
              type="button"
              disabled={pending}
              onClick={() => send(reason)}
              className="tap focus-ring block w-full rounded-xl px-3 text-left text-sm text-ink hover:bg-sand"
            >
              {t(`reasons.${reason}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
