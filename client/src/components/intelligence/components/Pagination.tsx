import React, { useState } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, total, limit, onPageChange }: PaginationProps) {
  const [jumpInput, setJumpInput] = useState('');

  const handleJump = () => {
    const p = parseInt(jumpInput);
    if (!isNaN(p) && p >= 1 && p <= totalPages) { onPageChange(p); setJumpInput(''); }
  };

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 9) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 4) pages.push('...');
    for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);
  const btnBase = "w-8 h-8 rounded-lg flex items-center justify-center text-[12px] transition-all";
  const btnStyle = { border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0a' }}>
      <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Showing <span className="font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{start.toLocaleString()}–{end.toLocaleString()}</span> of <span className="font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{total.toLocaleString()}</span> products
      </div>
      <div className="flex items-center gap-1">
        {[{ label: '«', page: 1, disabled: currentPage === 1, title: 'First' }, { label: '‹', page: currentPage - 1, disabled: currentPage === 1, title: 'Prev' }].map(b => (
          <button key={b.label} onClick={() => onPageChange(b.page)} disabled={b.disabled} title={b.title} className={`${btnBase} disabled:opacity-20 disabled:cursor-not-allowed`} style={{ ...btnStyle, color: 'rgba(255,255,255,0.3)' }}>{b.label}</button>
        ))}
        <div className="flex items-center gap-0.5 mx-1">
          {getPageNumbers().map((p, i) =>
            p === '...' ? <span key={`d${i}`} className="w-8 text-center text-[12px] select-none" style={{ color: 'rgba(255,255,255,0.2)' }}>···</span> :
            <button key={p} onClick={() => onPageChange(p as number)} className={`${btnBase} font-medium`} style={currentPage === p ? { background: '#6366f1', color: 'white', border: '1px solid #6366f1' } : { ...btnStyle, color: 'rgba(255,255,255,0.45)' }}>{p}</button>
          )}
        </div>
        {[{ label: '›', page: currentPage + 1, disabled: currentPage === totalPages }, { label: '»', page: totalPages, disabled: currentPage === totalPages, title: 'Last' }].map(b => (
          <button key={b.label} onClick={() => onPageChange(b.page)} disabled={b.disabled} className={`${btnBase} disabled:opacity-20 disabled:cursor-not-allowed`} style={{ ...btnStyle, color: 'rgba(255,255,255,0.3)' }}>{b.label}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Go to</span>
        <input type="number" value={jumpInput} onChange={e => setJumpInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJump()} min={1} max={totalPages} placeholder="—"
          className="w-12 rounded-lg px-2 py-1.5 text-[12px] text-center text-slate-100 outline-none tabular-nums"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
        <button onClick={handleJump} className="text-[12px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Go</button>
      </div>
    </div>
  );
}
