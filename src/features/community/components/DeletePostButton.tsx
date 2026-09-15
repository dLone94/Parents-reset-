"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { deleteOwnPost } from "../actions";

export function DeletePostButton({ postId }: { postId: string }) {
  const t = useTranslations("community");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(t("deleteConfirm"))) startTransition(() => deleteOwnPost(postId, locale));
      }}
      className="focus-ring rounded-full text-sm text-ink-muted underline-offset-4 hover:underline"
    >
      {t("delete")}
    </button>
  );
}
