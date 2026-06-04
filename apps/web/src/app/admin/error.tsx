"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-6 text-sm text-red-400 max-w-md">
        <strong>Error:</strong> {error.message}
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950 transition-all hover:brightness-110"
      >
        Reintentar
      </button>
    </div>
  );
}
