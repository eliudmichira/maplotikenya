import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Shared building blocks for every admin section. Keep these quiet:
// one accent, hairline borders, muted ink for labels.

// Page header: title, one-line description, and the page's actions.
export function PageHeader({ title, description, children, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

// Stat tile: uppercase label, large tabular number, one line of context.
export function StatTile({ label, value, note, icon: Icon, className }) {
  return (
    <Card className={cn('p-4 md:p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/60" />}
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums leading-none text-foreground">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </Card>
  );
}

// Grid of stat tiles with a loading state.
export function StatGrid({ items, loading, columns = 4 }) {
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4' }[columns] || 'grid-cols-2 lg:grid-cols-4';
  return (
    <div className={cn('grid gap-3 md:gap-4', cols)}>
      {loading
        ? Array.from({ length: columns }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-lg" />)
        : items.map((item) => <StatTile key={item.label} {...item} />)}
    </div>
  );
}

// Toolbar above a table: search, filters, actions, on one row that wraps.
export function Toolbar({ children, className }) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>;
}

// Bulk action bar shown only while rows are selected.
export function SelectionBar({ count, onClear, children }) {
  if (!count) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2">
      <p className="text-sm text-foreground">
        <span className="font-medium tabular-nums">{count}</span> selected
        {onClear && (
          <button type="button" onClick={onClear} className="ml-3 text-xs text-muted-foreground underline-offset-2 hover:underline">
            Clear
          </button>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

// Empty state for tables and lists.
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && <Icon className="mb-3 h-8 w-8 text-muted-foreground/50" />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Section within a page: title on the left, optional action on the right.
export function SectionHeader({ title, description, children, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-2', className)}>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// Status badge variant helper for listing / user / request states.
export function statusVariant(status) {
  const s = String(status || '').toLowerCase();
  if (['active', 'approved', 'published', 'live', 'verified', 'confirmed'].includes(s)) return 'success';
  if (['pending', 'review', 'draft', 'requested'].includes(s)) return 'warning';
  if (['rejected', 'suspended', 'banned', 'cancelled', 'deleted'].includes(s)) return 'destructive';
  return 'muted';
}

export function formatKsh(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `Ksh ${n.toLocaleString()}` : '—';
}

export function formatDate(value) {
  const d = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

// Simple client-side pagination controls.
export function Pagination({ page, pageCount, onPage, total, pageSize }) {
  if (pageCount <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
      <span className="tabular-nums">{from}–{to} of {total.toLocaleString()}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-md border border-border px-2.5 py-1 text-foreground disabled:opacity-40 hover:bg-muted">Previous</button>
        <span className="px-2 tabular-nums">{page} / {pageCount}</span>
        <button type="button" disabled={page >= pageCount} onClick={() => onPage(page + 1)} className="rounded-md border border-border px-2.5 py-1 text-foreground disabled:opacity-40 hover:bg-muted">Next</button>
      </div>
    </div>
  );
}
