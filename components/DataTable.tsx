'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

function getValue<T extends Record<string, unknown>>(row: T, key: string): unknown {
  return key.split('.').reduce((obj: unknown, k: string) => {
    if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k];
    return undefined;
  }, row);
}

export default function DataTable<T extends Record<string, unknown>>({
  data, columns, searchable, searchKeys = [], emptyMessage = 'No data found', loading, className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  let filtered = data;

  if (search && searchKeys.length > 0) {
    const lower = search.toLowerCase();
    filtered = data.filter((row) =>
      searchKeys.some((k) => String(getValue(row, k as string) ?? '').toLowerCase().includes(lower))
    );
  }

  if (sortKey) {
    filtered = [...filtered].sort((a, b) => {
      const av = String(getValue(a, sortKey) ?? '');
      const bv = String(getValue(b, sortKey) ?? '');
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  return (
    <div className={cn('glass-card rounded-2xl overflow-hidden', className)}>
      {searchable && (
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="input-dark w-full pl-9 h-9 rounded-xl text-sm"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full table-dark">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn('px-6 py-3 text-left cursor-pointer select-none', col.className)}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <span className="text-white/30">
                        {sortKey === String(col.key) ? (
                          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronsUpDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-6 py-4">
                      <div className="shimmer-bg h-4 rounded-lg" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">
                      🔍
                    </div>
                    <p className="text-sm text-white/40">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className={cn('px-6 py-4 text-sm text-white/80', col.className)}>
                      {col.render
                        ? col.render(getValue(row, String(col.key)), row)
                        : String(getValue(row, String(col.key)) ?? '—')}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-white/30">
            Showing {filtered.length} of {data.length} entries
          </p>
        </div>
      )}
    </div>
  );
}
