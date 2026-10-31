import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`skeleton-shimmer rounded-lg ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};

interface MetricCardSkeletonProps {
  count?: number;
}

export const MetricCardSkeleton: React.FC<MetricCardSkeletonProps> = ({ count = 1 }) => {
  if (count > 1) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="card-surface p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
      <div className="space-y-2 pt-1">
        <Skeleton className="h-7 w-32 rounded" />
        <Skeleton className="h-3.5 w-40 rounded" />
      </div>
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 px-6 py-3.5 bg-[var(--surface-secondary)] border-b border-[var(--border)]">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={`th-${i}`}
            className={`h-3.5 ${i === 0 ? 'w-36' : i === columns - 1 ? 'w-20 ml-auto' : 'w-24'} rounded`}
          />
        ))}
      </div>
      {/* Row skeletons */}
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`tr-${r}`} className="flex items-center gap-4 px-6 py-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={`td-${r}-${c}`}
                className={`flex items-center gap-3 ${
                  c === 0 ? 'w-36' : c === columns - 1 ? 'w-20 ml-auto' : 'w-24'
                }`}
              >
                {c === 0 && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-full rounded" />
                  {c === 0 && <Skeleton className="h-2.5 w-20 rounded" />}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface CardGridSkeletonProps {
  count?: number;
  columns?: '2' | '3' | '4';
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({ count = 6, columns = '3' }) => {
  const colClass =
    columns === '4'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : columns === '2'
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${colClass} gap-4 sm:gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`card-${i}`} className="card-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const AppointmentCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`appt-${i}`} className="card-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const StaffCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`staff-${i}`} className="card-surface p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
          </div>
          <div className="p-3 bg-[var(--surface-secondary)] rounded-xl space-y-2 border border-[var(--border)]">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
