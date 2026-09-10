import { cn } from "@/lib/utils/cn";

export function Logo({ className, label }: { className?: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span aria-hidden className="relative inline-block h-6 w-6">
        <span className="absolute inset-0 rounded-full bg-clay-soft" />
        <span className="absolute inset-[6px] rounded-full bg-clay" />
      </span>
      <span className="font-display text-xl text-ink">{label}</span>
    </span>
  );
}
