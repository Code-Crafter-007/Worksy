export default function PhaseBadge({ phase = 'Phase 3/4', text = 'This screen is designed and routed, but functionality starts in later phases.' }) {
  return (
    <div className="rounded-xl border border-[color:var(--dark-green)]/20 bg-[color:var(--accent-yellow)]/40 p-4 text-sm text-[color:var(--dark-green)]">
      <p className="font-semibold uppercase tracking-[0.12em]">{phase} Preview</p>
      <p className="mt-1">{text}</p>
    </div>
  );
}
