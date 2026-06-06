import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, borderRadius = 'var(--radius)', style }) => (
  <div
    aria-hidden="true"
    style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }}
  />
);

interface CardSkeletonProps {
  lines?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ lines = 4 }) => (
  <div className="card" style={{ padding: 20 }} role="status" aria-label="Yükleniyor">
    <Skeleton height={20} width="60%" style={{ marginBottom: 16 }} />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height={14} width={`${70 + Math.random() * 30}%`} style={{ marginBottom: 8 }} />
    ))}
    <span className="sr-only">Yükleniyor...</span>
  </div>
);

export const StatsGridSkeleton: React.FC = () => (
  <div className="stats-grid" role="status" aria-label="İstatistikler yükleniyor">
    {Array.from({ length: 6 }).map((_, i) => (
      <div className="card stat-card" key={i}>
        <Skeleton height={12} width="60%" style={{ marginBottom: 8 }} />
        <Skeleton height={32} width="40%" />
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="card" style={{ padding: 16 }} role="status" aria-label="Tablo yükleniyor">
    <Skeleton height={16} width="100%" style={{ marginBottom: 12 }} />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} height={40} width="100%" style={{ marginBottom: 8 }} />
    ))}
  </div>
);

export default Skeleton;
