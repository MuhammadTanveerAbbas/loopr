import { Skeleton } from "./skeleton";

interface SkeletonConfig {
  type: "cards" | "table" | "kanban" | "ai" | "stats";
  count?: number;
}

export function PageSkeleton({ type, count = 4 }: SkeletonConfig) {
  if (type === "stats") {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="neu-raised p-4 rounded-2xl">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "cards") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="neu-raised p-4 rounded-xl">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="space-y-3">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="neu-raised p-4 rounded-xl">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "kanban") {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="shrink-0 w-[300px]">
            <div className="neu-raised rounded-2xl p-3">
              <Skeleton className="h-5 w-20 mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="neu-raised-sm rounded-xl p-3">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "ai") {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="neu-raised p-5 rounded-2xl">
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
