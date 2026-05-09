/**
 * C5 – SkeletonCard
 * Cartão placeholder animado enquanto os dados carregam.
 */

export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-fade-in"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
    >
      {/* photo placeholder */}
      <div className="skeleton" style={{ aspectRatio: '16/10', width: '100%' }} />
      {/* body */}
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-5 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/4 rounded" />
        <hr style={{ borderColor: 'var(--border-subtle)' }} />
        <div className="flex justify-between">
          <div className="skeleton h-5 w-1/3 rounded" />
          <div className="skeleton h-4 w-1/4 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonKpi() {
  return (
    <div
      className="kpi-card"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
    >
      <div className="skeleton h-3 w-1/2 rounded mb-3" />
      <div className="skeleton h-8 w-3/4 rounded" />
    </div>
  );
}
