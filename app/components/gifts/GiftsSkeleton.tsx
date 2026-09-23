export default function GiftsSkeleton() {
  return (
    <section className="border-t border-ink/[0.06] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <div className="mx-auto h-3 w-32 animate-pulse rounded-full bg-ink/10" />
          <div className="mx-auto mt-5 h-12 w-80 max-w-full animate-pulse rounded-2xl bg-ink/10" />
          <div className="mx-auto mt-3 h-12 w-64 max-w-full animate-pulse rounded-2xl bg-ink/10" />
          <div className="mx-auto mt-6 h-4 w-96 max-w-full animate-pulse rounded-full bg-ink/5" />
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl border border-ink/[0.07] bg-cream"
            >
              <div className="aspect-[4/5] animate-pulse bg-ink/[0.06]" />
              <div className="space-y-3 px-6 pb-6 pt-5">
                <div className="h-6 w-2/3 animate-pulse rounded-full bg-ink/10" />
                <div className="h-4 w-full animate-pulse rounded-full bg-ink/5" />
                <div className="h-4 w-4/5 animate-pulse rounded-full bg-ink/5" />
                <div className="mt-6 h-8 w-1/2 animate-pulse rounded-full bg-ink/10" />
                <div className="mt-5 h-11 w-full animate-pulse rounded-full bg-ink/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}