"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Link } from "@/i18n/navigation";
import { createComment, type CommentFormState } from "../actions";

export function CommentForm({ postId, signedIn }: { postId: string; signedIn: boolean }) {
  const t = useTranslations("community");
  const locale = useLocale();
  const [state, action, pending] = useActionState<CommentFormState, FormData>(createComment, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "posted") formRef.current?.reset();
  }, [state]);

  if (!signedIn) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-paper/60 p-5">
        <p className="text-base text-ink-soft">{t("comment.signInPrompt")}</p>
        <Link href={`/account?next=/community/${postId}`} className={`${buttonClassName("secondary", "md")} mt-3`}>
          {t("comment.signIn")}
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="locale" value={locale} />
      <label htmlFor="comment" className="block text-sm font-semibold text-ink-soft">
        {t("comment.label")}
      </label>
      <Textarea id="comment" name="body" rows={3} required placeholder={t("comment.placeholder")} />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-clay-deep">
          {t(`errors.${state.code}`)}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? t("comment.posting") : t("comment.submit")}
      </Button>
    </form>
  );
}
