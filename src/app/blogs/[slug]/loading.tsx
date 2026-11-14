export default function BlogDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-5 w-24 rounded bg-gray-200 dark:bg-white/[0.06] mb-8" />

      {/* Cover image skeleton */}
      <div className="h-64 sm:h-80 rounded-2xl bg-gray-200 dark:bg-white/[0.06] mb-8" />

      {/* Tags skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-white/[0.06]" />
        <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-white/[0.06]" />
      </div>

      {/* Title skeleton */}
      <div className="h-9 w-3/4 rounded-lg bg-gray-200 dark:bg-white/[0.06] mb-4" />

      {/* Summary skeleton */}
      <div className="h-5 w-full rounded bg-gray-200 dark:bg-white/[0.06] mb-6" />

      {/* Meta author row */}
      <div className="flex items-center gap-3 py-5 border-y border-gray-200 dark:border-white/[0.07] mb-8">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/[0.06]" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-28 rounded bg-gray-200 dark:bg-white/[0.06]" />
          <div className="h-3 w-16 rounded bg-gray-200 dark:bg-white/[0.06]" />
        </div>
      </div>

      {/* Body lines */}
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-white/[0.06]" />
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-white/[0.06]" />
        <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-white/[0.06]" />
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-white/[0.06]" />
        <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-white/[0.06]" />
      </div>
    </div>
  );
}
