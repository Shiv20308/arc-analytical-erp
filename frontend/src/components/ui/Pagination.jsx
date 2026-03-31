import React from 'react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.pages <= 1) return null;
  const pages = Array.from({ length: meta.pages }, (_, i) => i + 1);
  const visible = pages.filter(p => p === 1 || p === meta.pages || Math.abs(p - meta.page) <= 2);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
      <span className="text-sm text-gray-500">
        Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(meta.page - 1)} disabled={!meta.hasPrev} className="btn btn-secondary btn-sm disabled:opacity-40">← Prev</button>
        {visible.map((p, i) => (
          <React.Fragment key={p}>
            {i > 0 && visible[i-1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
            <button
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === meta.page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
            >{p}</button>
          </React.Fragment>
        ))}
        <button onClick={() => onPageChange(meta.page + 1)} disabled={!meta.hasNext} className="btn btn-secondary btn-sm disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
}
