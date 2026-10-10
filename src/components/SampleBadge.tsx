/** Marks a section as showing stand-in data because Google is not connected. */
export function SampleBadge() {
  return (
    <span className="rounded-full border border-dashed border-[var(--accent-border)] px-3 py-1 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
      Sample data
    </span>
  );
}
