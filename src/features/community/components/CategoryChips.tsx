"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { communityCategories, type CommunityCategory } from "../schema";

export function CategoryChips({ active }: { active?: CommunityCategory }) {
  const t = useTranslations("community");
  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="navigation" aria-label={t("categoriesLabel")}>
      <ul className="flex gap-2 pb-1">
        <li>
          <Link
            href="/community"
            className={cn(
              "tap focus-ring inline-flex items-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold",
              !active ? "border-clay bg-clay-soft text-ink" : "border-line bg-paper text-ink-soft",
            )}
          >
            {t("all")}
          </Link>
        </li>
        {communityCategories.map((category) => (
          <li key={category}>
            <Link
              href={`/community?category=${category}`}
              className={cn(
                "tap focus-ring inline-flex items-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold",
                active === category ? "border-clay bg-clay-soft text-ink" : "border-line bg-paper text-ink-soft",
              )}
            >
              {t(`categories.${category}`)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
