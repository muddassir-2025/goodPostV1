export default function PostSkeleton({ count = 2 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[28px] border border-white/10 bg-[#121212]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-full bg-white/8" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded-full bg-white/8" />
              <div className="h-3 w-20 animate-pulse rounded-full bg-white/6" />
            </div>
          </div>
          <div className="aspect-[4/5] animate-pulse rounded-[24px] bg-white/8" />
          <div className="mt-4 flex gap-2">
            <div className="h-10 w-20 animate-pulse rounded-full bg-white/8" />
            <div className="h-10 w-20 animate-pulse rounded-full bg-white/8" />
            <div className="ml-auto h-10 w-10 animate-pulse rounded-full bg-white/8" />
          </div>
        </div>
      ))}
    </div>
  );
}
