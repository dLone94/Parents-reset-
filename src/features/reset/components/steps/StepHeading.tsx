export function StepHeading({ title, help, id, badge }: { title: string; help?: string; id: string; badge?: string }) {
  return (
    <div className="space-y-2">
      {badge && (
        <span className="inline-block rounded-full bg-sand px-3 py-1 text-sm font-semibold text-ink-soft">{badge}</span>
      )}
      <h1 id={id} className="font-display text-3xl leading-tight md:text-4xl">
        {title}
      </h1>
      {help && <p className="text-lg text-ink-soft">{help}</p>}
    </div>
  );
}
