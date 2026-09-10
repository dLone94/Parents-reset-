import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

export function LandingPage() {
  const t = useTranslations("home");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-clay-soft/70 blur-3xl md:h-[28rem] md:w-[28rem]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-honey-soft/70 blur-3xl"
        />
        <Container className="relative flex flex-col gap-8 py-16 md:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
            {t("hero.eyebrow")}
          </p>
          <h1 className="font-display max-w-3xl text-[2.6rem] leading-[1.08] sm:text-6xl md:text-7xl">
            {t("hero.title")}
          </h1>
          <p className="max-w-xl text-xl leading-relaxed text-ink-soft md:text-2xl">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/reset" className={cn(buttonClassName("primary", "lg"), "sm:min-w-[14rem]")}>
              {t("hero.primaryCta")}
            </Link>
            <Link href="#how-it-works" className={buttonClassName("secondary", "lg")}>
              {t("hero.secondaryCta")}
            </Link>
          </div>
          <p className="text-base text-ink-muted">{t("hero.trust")}</p>
        </Container>
      </section>

      {/* Three steps */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-line bg-paper/60">
        <Container className="py-16 md:py-24">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl md:text-5xl">{t("steps.title")}</h2>
            <p className="text-lg text-ink-soft">{t("steps.subtitle")}</p>
          </div>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {(["one", "two", "three"] as const).map((step, index) => (
              <li
                key={step}
                className="flex gap-4 rounded-2xl border border-line bg-paper p-6 shadow-soft"
              >
                <span
                  aria-hidden
                  className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-soft text-xl text-clay-deep"
                >
                  {index + 1}
                </span>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-semibold leading-snug">{t(`steps.${step}.title`)}</h3>
                  <p className="text-base leading-relaxed text-ink-soft">{t(`steps.${step}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* What you get */}
      <section className="border-t border-line">
        <Container className="py-16 md:py-24">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl md:text-5xl">{t("buckets.title")}</h2>
            <p className="text-lg text-ink-soft">{t("buckets.subtitle")}</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <BucketPreview tone="clay" label={t("buckets.today.label")} body={t("buckets.today.body")} count={3} />
            <BucketPreview tone="honey" label={t("buckets.thisWeek.label")} body={t("buckets.thisWeek.body")} count={4} />
            <BucketPreview tone="moss" label={t("buckets.letGo.label")} body={t("buckets.letGo.body")} count={3} />
          </div>
        </Container>
      </section>

      {/* Reassurance */}
      <section className="border-t border-line bg-sand/50">
        <Container className="py-16 md:py-24">
          <h2 className="font-display text-3xl md:text-5xl">{t("reassurance.title")}</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {(["notTherapy", "private", "languages"] as const).map((item) => (
              <li key={item} className="flex gap-3 text-lg leading-relaxed text-ink-soft">
                <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-clay" />
                <span>{t(`reassurance.items.${item}`)}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="border-t border-line">
        <Container className="flex flex-col items-start gap-5 py-16 md:py-24">
          <h2 className="font-display text-3xl md:text-5xl">{t("finalCta.title")}</h2>
          <p className="max-w-xl text-lg text-ink-soft">{t("finalCta.body")}</p>
          <Link href="/reset" className={buttonClassName("primary", "lg")}>
            {t("finalCta.cta")}
          </Link>
        </Container>
      </section>
    </>
  );
}

const tones = {
  clay: { chip: "bg-clay-soft text-clay-deep", bar: "bg-clay" },
  honey: { chip: "bg-honey-soft text-honey", bar: "bg-honey" },
  moss: { chip: "bg-moss-soft text-moss", bar: "bg-moss" },
} as const;

function BucketPreview({
  tone,
  label,
  body,
  count,
}: {
  tone: keyof typeof tones;
  label: string;
  body: string;
  count: number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-6 shadow-soft">
      <span className={cn("inline-block rounded-full px-3 py-1 text-sm font-semibold", tones[tone].chip)}>
        {label}
      </span>
      <div aria-hidden className="mt-5 space-y-2.5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className={cn("h-2 w-2 rounded-full", tones[tone].bar)} />
            <span className="h-2.5 flex-1 rounded-full bg-sand" style={{ maxWidth: `${88 - i * 16}%` }} />
          </div>
        ))}
      </div>
      <p className="mt-5 text-base leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
