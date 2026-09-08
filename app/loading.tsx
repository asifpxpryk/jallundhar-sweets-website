export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fff8f0] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="h-16 animate-pulse rounded-2xl bg-gold-100" />
        <p className="mt-4 text-sm text-maroon-700/70">Products loading...</p>
        <div className="mt-4 h-64 animate-pulse rounded-3xl bg-maroon-800/80" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-gold-100/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
