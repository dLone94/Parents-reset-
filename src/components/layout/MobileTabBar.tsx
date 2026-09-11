"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/", key: "home", icon: HomeIcon },
  { href: "/reset", key: "reset", icon: ResetIcon },
  { href: "/load", key: "load", icon: LoadIcon },
  { href: "/community", key: "community", icon: CommunityIcon },
  { href: "/account", key: "account", icon: AccountIcon },
] as const;

/**
 * App-style bottom navigation on phones. Hidden inside the reset flow, which
 * has its own sticky action bar, and on desktop where the header does the job.
 */
export function MobileTabBar() {
  const t = useTranslations("nav.tabs");
  const pathname = usePathname();
  if (pathname === "/reset") return null;

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, key, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "tap focus-ring flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold",
                  active ? "text-clay-deep" : "text-ink-soft",
                )}
              >
                <Icon active={active} />
                <span>{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function iconProps(active: boolean) {
  return { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: active ? 2.4 : 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
}
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" />
    </svg>
  );
}
function ResetIcon({ active }: { active: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <path d="M4 12a8 8 0 0113.7-5.6M20 12a8 8 0 01-13.7 5.6" />
      <path d="M17 3v4h-4M7 21v-4h4" />
    </svg>
  );
}
function LoadIcon({ active }: { active: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <rect x="3" y="5" width="7" height="7" rx="2" />
      <rect x="14" y="5" width="7" height="7" rx="2" />
      <rect x="3" y="15" width="7" height="5" rx="2" />
      <rect x="14" y="15" width="7" height="5" rx="2" />
    </svg>
  );
}
function CommunityIcon({ active }: { active: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <path d="M4 6h16v9H9l-4 4v-4H4z" />
    </svg>
  );
}
function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0116 0" />
    </svg>
  );
}
