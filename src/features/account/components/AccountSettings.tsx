"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { useToast } from "@/components/feedback/Toast";
import { Button } from "@/components/ui/Button";
import { useRepositories } from "@/services/persistence/PersistenceProvider";
import { deleteAccount, deleteHistory, signOut, updateDisplayName, type ProfileState } from "../actions";
import { generatePseudonym } from "../pseudonym";

interface AccountSettingsProps {
  email: string | null;
  displayName: string;
}

export function AccountSettings({ email, displayName }: AccountSettingsProps) {
  const t = useTranslations("account.settings");
  const locale = useLocale();
  const { toast } = useToast();
  const repos = useRepositories();
  const [nameState, nameAction, namePending] = useActionState<ProfileState, FormData>(updateDisplayName, { status: "idle" });
  const [name, setName] = useState(displayName);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function exportData() {
    setBusy(true);
    try {
      const [resets, load] = await Promise.all([repos.resets.list(), repos.load.list()]);
      const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), email, resets, familyLoad: load }, null, 2)],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `parent-reset-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(t("exportDone"), "success");
    } finally {
      setBusy(false);
    }
  }

  async function clearHistory() {
    if (!window.confirm(t("deleteHistoryConfirm"))) return;
    setBusy(true);
    try {
      const result = await deleteHistory();
      toast(result.status === "done" ? t("deleteHistoryDone") : t("genericError"), result.status === "done" ? "success" : "neutral");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-paper p-5 shadow-soft md:p-6">
        <h2 className="font-display text-2xl">{t("profile.title")}</h2>
        <p className="mt-1 text-base text-ink-soft">{email}</p>

        <form action={nameAction} className="mt-5 space-y-2">
          <label htmlFor="displayName" className="block text-sm font-semibold text-ink-soft">
            {t("profile.displayName")}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="displayName"
              name="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="tap focus-ring w-full flex-1 rounded-full border border-line bg-paper px-5 text-lg text-ink"
            />
            <Button type="button" variant="secondary" onClick={() => setName(generatePseudonym())}>
              {t("profile.shuffle")}
            </Button>
            <Button type="submit" disabled={namePending}>
              {t("profile.save")}
            </Button>
          </div>
          <p className="text-sm text-ink-muted">{t("profile.displayNameHint")}</p>
          {nameState.status === "saved" && <p className="text-sm text-moss">{t("profile.saved")}</p>}
          {nameState.status === "error" && (
            <p role="alert" className="text-sm text-clay-deep">
              {nameState.code === "invalid" ? t("profile.invalid") : t("genericError")}
            </p>
          )}
        </form>
      </section>

      <section className="rounded-3xl border border-line bg-paper p-5 shadow-soft md:p-6">
        <h2 className="font-display text-2xl">{t("data.title")}</h2>
        <p className="mt-1 text-base text-ink-soft">{t("data.body")}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={exportData} disabled={busy}>
            {t("data.export")}
          </Button>
          <Button variant="secondary" onClick={clearHistory} disabled={busy}>
            {t("data.deleteHistory")}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-paper p-5 shadow-soft md:p-6">
        <form action={signOut}>
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" variant="secondary">
            {t("signOut")}
          </Button>
        </form>
      </section>

      <section className="rounded-3xl border border-clay/40 bg-clay-soft/40 p-5 md:p-6">
        <h2 className="font-display text-2xl">{t("danger.title")}</h2>
        <p className="mt-1 text-base text-ink-soft">{t("danger.body")}</p>
        {!confirmDelete ? (
          <Button variant="secondary" className="mt-4" onClick={() => setConfirmDelete(true)}>
            {t("danger.delete")}
          </Button>
        ) : (
          <form action={deleteAccount} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="primary">
              {t("danger.confirm")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
              {t("danger.cancel")}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
