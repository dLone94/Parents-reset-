"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

type ActionKey = "pause" | "vent" | "evening" | "kept";

const actions: Record<ActionKey, { href: string; tone: string; Icon: () => React.ReactElement }> = {
  pause: { href: "/pause", tone: "border-clay/40 bg-clay-soft text-clay-deep", Icon: BreathIcon },
  vent: { href: "/vent", tone: "border-honey/40 bg-honey-soft text-honey", Icon: TearIcon },
  evening: { href: "/evening", tone: "border-moss/40 bg-moss-soft text-moss", Icon: MoonIcon },
  kept: { href: "/kept", tone: "border-moss/40 bg-moss-soft text-moss", Icon: KeepIcon },
};

/**
 * The three things a parent can do in under a minute, on the home screen
 * where they can be reached with a thumb. After dark the third slot becomes
 * closing the day; once the day is closed it becomes what they kept.
 */
export function QuickActions({
  className,
  closedToday,
  hour,
}: {
  className?: string;
  closedToday: boolean;
  hour: number;
}) {
  const t = useTranslations("home.quick");
  const third: ActionKey = closedToday ? "kept" : "evening";
  const keys: ActionKey[] = hour < 12 ? ["pause", "vent", third] : ["pause", third, "vent"];

  return (
    <ul className={cn("grid grid-cols-3 gap-2 sm:gap-3", className)}>
      {keys.map((key) => {
        const { href, tone, Icon } = actions[key];
        return (
          <li key={key}>
            <Link
              href={href}
              className={cn(
                "tap focus-ring flex h-full flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-4 text-center transition-transform hover:-translate-y-0.5",
                tone,
              )}
            >
              <Icon />
              <span className="text-sm font-semibold leading-tight">{t(`${key}.label`)}</span>
              <span className="text-xs leading-tight opacity-80">{t(`${key}.hint`)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const svg = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function BreathIcon() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="3.6" />
    </svg>
  );
}

/** A sheet of paper torn down the middle. */
function TearIcon() {
  return (
    <svg {...svg}>
      <path d="M10 3.5H6.5a1 1 0 00-1 1v15a1 1 0 001 1H10" />
      <path d="M14 3.5h3.5a1 1 0 011 1v15a1 1 0 01-1 1H14" />
      <path d="M12 3.5l-1.6 3.2 3.2 2.6-3.2 2.6 3.2 2.6-3.2 2.6 1.6 3.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...svg}>
      <path d="M20 13.4A8.2 8.2 0 1110.6 4a6.6 6.6 0 009.4 9.4z" />
    </svg>
  );
}

function KeepIcon() {
  return (
    <svg {...svg}>
      <path d="M12 20.5s-7.2-4.4-7.2-9.3A4 4 0 0112 8.8a4 4 0 017.2 2.4c0 4.9-7.2 9.3-7.2 9.3z" />
    </svg>
  );
}
