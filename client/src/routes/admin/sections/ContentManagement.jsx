import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { getPropertyImage, handleImageError } from '../../../utils/imageUtils';
import { Star, Search, Download, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatGrid, Toolbar, EmptyState, Pagination, statusVariant, formatKsh } from '@/components/admin/primitives';

const PAGE_SIZE = 25;
const ACTIVE = new Set(['active', 'approved', 'published', 'live']);

const normalise = (id, data) => {
  const rawLoc = data.location;
  const location = typeof rawLoc === 'string'
    ? rawLoc
    : rawLoc && typeof rawLoc === 'object'
      ? [rawLoc.address || rawLoc.area, rawLoc.city || rawLoc.county, rawLoc.state].filter(Boolean).join(', ')
      : [data.address, data.city, data.state].filter((v) => typeof v === 'string' && v).join(', ');
  const category = typeof data.category === 'string' ? data.category : data.category?.name || '';
  return {
    id,
    title: data.title || (typeof data.address === 'string' ? data.address : data.address?.address || data.address?.city || 'Untitled listing'),
    price: Number(data.price) || 0,
    location: location || '—',
    category: category.toLowerCase(),
    status: String(data.status || 'pending').toLowerCase(),
    featured: !!data.featured,
    featuredOrder: Number.isFinite(Number(data.featuredOrder)) && data.featuredOrder !== null ? Number(data.featuredOrder) : null,
    owner: data.ownerEmail || data.owner || data.agentEmail || '',
    createdAt: data.createdAt,
    images: Array.isArray(data.images) ? data.images : [],
    image: data.image,
    coverPhoto: data.coverPhoto,
  };
};

const statusLabel = (s) => (ACTIVE.has(s) ? 'Active' : s === 'pending' ? 'Pending' : s === 'rejected' ? 'Rejected' : s === 'inactive' ? 'Unpublished' : s);
const byOrder = (a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999);

const ContentManagement = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState(() => new Set());
  const [rowErrors, setRowErrors] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'listings'));
        const list = snap.docs.map((d) => normalise(d.id, d.data()));
        const t = (v) => (v?.toDate ? v.toDate().getTime() : v ? new Date(v).getTime() : 0);
        list.sort((a, b) => t(b.createdAt) - t(a.createdAt));
        setRows(list);
      } catch (e) {
        setError('Could not load listings. ' + (e.message || ''));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featuredRows = useMemo(() => rows.filter((r) => r.featured).sort(byOrder), [rows]);
  const categories = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean))].sort(), [rows]);

  const stats = useMemo(() => ({
    total: rows.length,
    featured: featuredRows.length,
    active: rows.filter((r) => ACTIVE.has(r.status)).length,
    featuredActive: featuredRows.filter((r) => ACTIVE.has(r.status)).length,
  }), [rows, featuredRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (featuredFilter === 'featured' && !r.featured) return false;
      if (featuredFilter === 'not-featured' && r.featured) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (!q) return true;
      return [r.title, r.location, r.owner].some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, search, featuredFilter, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, featuredFilter, categoryFilter]);

  // ── writes ──
  // Optimistic: apply locally first, write to Firestore, roll back on failure.
  const patchRow = async (row, data, failMessage) => {
    const previous = { featured: row.featured, featuredOrder: row.featuredOrder };
    setPending((prev) => new Set(prev).add(row.id));
    setRowErrors((prev) => { const next = { ...prev }; delete next[row.id]; return next; });
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...data } : r)));
    try {
      await updateDoc(doc(db, 'listings', row.id), data);
    } catch (e) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...previous } : r)));
      setRowErrors((prev) => ({ ...prev, [row.id]: `${failMessage} ${e.message || ''}`.trim() }));
    } finally {
      setPending((prev) => { const next = new Set(prev); next.delete(row.id); return next; });
    }
  };

  const toggleFeatured = (row, on) => {
    if (on) {
      const nextOrder = Math.max(0, ...featuredRows.map((r) => r.featuredOrder || 0)) + 1;
      return patchRow(row, { featured: true, featuredOrder: nextOrder }, 'Could not feature this listing.');
    }
    return patchRow(row, { featured: false, featuredOrder: null }, 'Could not unfeature this listing.');
  };

  const reorder = (row, order) => patchRow(row, { featuredOrder: order }, 'Could not change the order.');

  const orderOptions = useMemo(() => {
    const max = Math.max(5, featuredRows.length, ...featuredRows.map((r) => r.featuredOrder || 0));
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [featuredRows]);

  const exportCsv = () => {
    const header = ['id', 'title', 'price', 'location', 'category', 'status', 'featured', 'featuredOrder', 'owner'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [header.join(','), ...filtered.map((r) => [r.id, r.title, r.price, r.location, r.category, r.status, r.featured ? 'true' : 'false', r.featuredOrder ?? '', r.owner].map(esc).join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `featured-listings-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Featured content" description="Choose which listings are highlighted on the home page and the order they appear in.">
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}><Download />Export CSV</Button>
      </PageHeader>

      <StatGrid
        loading={loading}
        items={[
          { label: 'Featured', value: stats.featured, icon: Star, note: stats.featured ? `${stats.featuredActive} of them active` : 'nothing featured yet' },
          { label: 'Active listings', value: stats.active, note: 'visible on the site' },
          { label: 'All listings', value: stats.total, icon: Home },
          { label: 'Categories', value: categories.length },
        ]}
      />

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-hidden">
        <div className="p-3 md:p-4">
          <Toolbar>
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, area or owner" className="pl-8" />
            </div>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Featured" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All listings</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="not-featured">Not featured</SelectItem>
              </SelectContent>
            </Select>
            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">{filtered.length.toLocaleString()} result{filtered.length === 1 ? '' : 's'}</span>
          </Toolbar>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No listings match"
            description={search || featuredFilter !== 'all' || categoryFilter !== 'all' ? 'Try clearing the search or the filters.' : 'Listings will appear here as they are added.'}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Listing</TableHead>
                  <TableHead className="hidden md:table-cell">Price</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Order</TableHead>
                  <TableHead className="pr-4 text-right">Featured</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <img src={getPropertyImage(r)} alt="" loading="lazy" onError={(e) => handleImageError(e, null, r)} className="h-11 w-16 shrink-0 rounded-md object-cover bg-muted" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">{r.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{r.location}</span>
                          <span className="block text-xs text-muted-foreground md:hidden">{formatKsh(r.price)}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell whitespace-nowrap tabular-nums">{formatKsh(r.price)}</TableCell>
                    <TableCell className="hidden lg:table-cell capitalize text-muted-foreground">{r.category || '—'}</TableCell>
                    <TableCell><Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">
                      {r.featured ? (
                        <Select value={r.featuredOrder ? String(r.featuredOrder) : ''} onValueChange={(v) => reorder(r, Number(v))} disabled={pending.has(r.id)}>
                          <SelectTrigger className="h-8 w-[72px]" aria-label={`Order for ${r.title}`}><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {orderOptions.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <Switch
                          checked={r.featured}
                          disabled={pending.has(r.id)}
                          onCheckedChange={(on) => toggleFeatured(r, on)}
                          aria-label={r.featured ? `Unfeature ${r.title}` : `Feature ${r.title}`}
                        />
                        {rowErrors[r.id] && <span className="max-w-[200px] text-right text-xs text-destructive">{rowErrors[r.id]}</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={safePage} pageCount={pageCount} onPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
          </>
        )}
      </Card>
    </>
  );
};

export default ContentManagement;
