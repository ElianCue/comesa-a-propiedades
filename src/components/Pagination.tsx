import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  total: number;
  perPage: number;
  onChange: (p: number) => void;
}

export function Pagination({ page, total, perPage, onChange }: Props) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const visible = (): (number | "...")[] => {
    const r: (number | "...")[] = [];
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) r.push(i);
      return r;
    }
    r.push(1);
    if (page > 3) r.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
      r.push(i);
    }
    if (page < pages - 2) r.push("...");
    r.push(pages);
    return r;
  };

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-10" aria-label="Paginación">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {visible().map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="flex h-10 w-10 items-center justify-center text-xs text-muted-foreground">
            ⋯
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`flex h-10 min-w-[40px] items-center justify-center rounded-lg px-3 text-sm font-medium transition ${
              p === page
                ? "bg-accent text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
