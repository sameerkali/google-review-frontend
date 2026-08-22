"use client";

/* Shared pager — used by any paginated list (Businesses, Hardware, Reviews). */
export function PageBtn({
  active, disabled, onClick, children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-brand text-white"
          : "border border-border-strong text-fg-tertiary hover:text-fg hover:border-fg-quaternary"
      }`}
    >
      {children}
    </button>
  );
}

export function Pagination({
  page, totalPages, total, onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Show at most 5 page buttons around the current page, collapsing the rest into "…".
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
    .reduce<(number | "…")[]>((acc, n, i, arr) => {
      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <p className="text-xs text-fg-tertiary">
        Page {page} of {totalPages} · {total} result{total !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <PageBtn onClick={() => onChange(page - 1)} disabled={page <= 1}>← Prev</PageBtn>
        {pages.map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-fg-quaternary text-xs">…</span>
          ) : (
            <PageBtn key={n} active={n === page} onClick={() => onChange(n)}>{n}</PageBtn>
          )
        )}
        <PageBtn onClick={() => onChange(page + 1)} disabled={page >= totalPages}>Next →</PageBtn>
      </div>
    </div>
  );
}
