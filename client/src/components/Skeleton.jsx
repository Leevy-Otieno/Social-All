export default function Skeleton({ className, circle }) {
  return (
    <div className={`animate-pulse bg-slate-200 ${circle ? 'rounded-full' : 'rounded-md'} ${className}`} />
  )
}

export function PostSkeleton() {
  return (
    <div className="p-4 border-b border-border space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10" circle />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2 w-1/4" />
        </div>
      </div>
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

export function UserSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-10 h-10" circle />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2 w-1/4" />
      </div>
    </div>
  )
}

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
        <Skeleton key={i} className="aspect-square w-full rounded-none" />
      ))}
    </div>
  )
}
