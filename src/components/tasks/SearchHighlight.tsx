// ============================================================
// SEARCH HIGHLIGHT — Phase 11
// Arama sorgusuyla eşleşen metni highlight eder.
// Pure bileşen — herhangi bir listede kullanılabilir.
// ============================================================

interface Props {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

export function SearchHighlight({
  text,
  query,
  className = '',
  highlightClassName = 'bg-amber-500/25 text-amber-200 rounded px-0.5',
}: Props) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
