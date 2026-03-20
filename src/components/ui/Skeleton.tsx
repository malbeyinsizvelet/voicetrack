// ============================================================
// SKELETON — Yükleme durumu placeholder'ları
// ============================================================

import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ className = '', rounded = 'md' }: SkeletonProps) {
  const r = { sm: 'rounded', md: 'rounded-lg', lg: 'rounded-xl', full: 'rounded-full' }[rounded];
  return <div className={cn('skeleton', r, className)} />;
}

// ─── Kart Skeleton ───────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8" rounded="lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-16 h-5" rounded="full" />
      </div>
      <Skeleton className="h-2 w-full" rounded="full" />
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

// ─── Satır Skeleton ──────────────────────────────────────────
export function RowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 animate-fade-in">
      <Skeleton className="w-8 h-8 shrink-0" rounded="full" />
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === 0 ? 'flex-1' : 'w-20')}
        />
      ))}
    </div>
  );
}

// ─── Task Card Skeleton ──────────────────────────────────────
export function TaskCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 px-4 py-3.5 animate-fade-in space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="w-20 h-5" rounded="full" />
      </div>
      <Skeleton className="h-1.5 w-full" rounded="full" />
    </div>
  );
}

// ─── Stat Card Skeleton ──────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-fade-in space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="w-7 h-7" rounded="lg" />
      </div>
      <Skeleton className="h-8 w-16" rounded="lg" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// ─── Page Skeleton ───────────────────────────────────────────
export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="flex flex-col h-full">
      {/* Fake topbar */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" rounded="lg" />
          <Skeleton className="h-8 w-32" rounded="lg" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Stat row */}
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Detail Skeleton ─────────────────────────────────────────
export function DetailSkeleton() {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-8 w-28" rounded="lg" />
      </div>
      <div className="px-6 pt-5 pb-4 border-b border-slate-800 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" rounded="full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-2 w-full" rounded="full" />
      </div>
      <div className="border-b border-slate-800 px-6 py-0">
        <div className="flex gap-1 py-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-28" rounded="lg" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
