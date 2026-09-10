export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = Math.round((value / max) * 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-sand"
    >
      <div
        className="h-full rounded-full bg-clay transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
