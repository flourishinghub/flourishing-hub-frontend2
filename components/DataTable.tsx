'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  // Receives the cell's raw value (row[key]), not the full row — matches how
  // it's actually invoked below. `row` is passed as a second argument for
  // callers that need sibling fields. Typed `any` (not `unknown`) so existing
  // renderers that narrow their param to a specific type (e.g. `(value: string) => ...`)
  // keep type-checking, since `unknown` would reject those narrower signatures.
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  // Optional override for the value used to sort (as opposed to display).
  // Needed when the column's raw value has already been formatted to a
  // display string (e.g. a date like "8 Jul 2026"), which would otherwise
  // sort lexicographically instead of chronologically/numerically.
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxRows?: number;
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchKeys = [],
  searchPlaceholder = 'Search...',
  emptyMessage = 'No records found.',
  maxRows,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = data.filter((row) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q));
  });

  const sortColumn = sortKey ? columns.find((c) => String(c.key) === sortKey) : undefined;

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        if (sortColumn?.sortValue) {
          const av = sortColumn.sortValue(a);
          const bv = sortColumn.sortValue(b);
          if (typeof av === 'number' && typeof bv === 'number') {
            return sortDir === 'asc' ? av - bv : bv - av;
          }
          const as = String(av);
          const bs = String(bv);
          return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
        }
        const av = String(a[sortKey] ?? '');
        const bv = String(b[sortKey] ?? '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : filtered;

  const displayed = maxRows ? sorted.slice(0, maxRows) : sorted;

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="space-y-4">
      {searchKeys.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="input-dark w-full pl-9 pr-4 py-2 rounded-xl text-sm"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full table-dark">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && toggleSort(String(col.key))}
                  className={`px-4 py-3 text-left ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="flex flex-col">
                        <ChevronUp className={`w-2.5 h-2.5 ${sortKey === col.key && sortDir === 'asc' ? 'text-primary' : 'text-white/20'}`} />
                        <ChevronDown className={`w-2.5 h-2.5 -mt-1 ${sortKey === col.key && sortDir === 'desc' ? 'text-primary' : 'text-white/20'}`} />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-white/30">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayed.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-sm text-white/80">
                      {col.render ? col.render(row[col.key as keyof T], row) : String(row[col.key as keyof T] ?? '—')}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {maxRows && sorted.length > maxRows && (
        <p className="text-xs text-white/30 text-center">Showing {maxRows} of {sorted.length} records</p>
      )}
    </div>
  );
}
