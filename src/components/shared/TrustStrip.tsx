interface Props {
  items: string[];
}

export default function TrustStrip({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="trust-strip">
      <div className="section-shell flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-secondary)]">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-[color:var(--accent-main)]">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
