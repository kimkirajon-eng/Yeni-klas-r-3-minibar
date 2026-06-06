import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const getPages = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', flexWrap: 'wrap', gap: 8,
    }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {startItem}-{endItem} / {totalItems} kayıt
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button
          className="btn btn-icon btn-ghost"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ opacity: currentPage === 1 ? 0.3 : 1 }}
        >
          <ChevronLeft size={16} />
        </button>
        {getPages().map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} style={{ padding: '4px 6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>...</span>
          ) : (
            <button
              key={page}
              className="btn btn-icon"
              style={{
                minWidth: 32, height: 32,
                background: currentPage === page ? 'var(--primary)' : 'transparent',
                color: currentPage === page ? '#fff' : 'var(--text)',
                border: currentPage === page ? 'none' : '1px solid var(--border)',
                borderRadius: 6, fontWeight: currentPage === page ? 600 : 400,
                fontSize: '0.85rem', padding: '0 8px',
              }}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        )}
        <button
          className="btn btn-icon btn-ghost"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export function usePagination<T>(items: T[], pageSize: number) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [items.length, totalPages, currentPage]);

  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    currentPage,
    totalPages,
    totalItems: items.length,
    pageSize,
    paginatedItems,
    setCurrentPage,
  };
}
