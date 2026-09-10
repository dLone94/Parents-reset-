import { cn } from "@/lib/utils/cn";
import type { LoadLevel } from "@/types/load";

const SEGMENTS = 5;

export const levelStyles: Record<LoadLevel, { fill: string; chip: string }> = {
  clear: { fill: "bg-line", chip: "bg-sand text-ink-soft" },
  light: { fill: "bg-moss", chip: "bg-moss-soft text-moss" },
  busy: { fill: "bg-honey", chip: "bg-honey-soft text-honey" },
  heavy: { fill: "bg-clay", chip: "bg-clay-soft text-clay-deep" },
};

/** Five-segment meter. Purely visual; the label next to it carries meaning. */
export function LoadMeter({ score, level, label }: { score: number; level: LoadLevel; label: string }) {
  const filled = Math.min(SEGMENTS, Math.ceil(score));
  return (
    <div className="flex items-center gap-1" role="img" aria-label={label}>
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <span
          key={i}
          className={cn("h-1.5 flex-1 rounded-full", i < filled ? levelStyles[level].fill : "bg-line")}
        />
      ))}
    </div>
  );
}
