import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { getPropertyImage, handleImageError } from '../../../utils/imageUtils';
import { Home, Search, MoreHorizontal, Eye, Check, X, Trash2, EyeOff, Download, Bed, Bath, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatGrid, Toolbar, SelectionBar, EmptyState, Pagination, statusVariant, formatKsh, formatDate } from '@/components/admin/primitives';

const PAGE_SIZE = 25;
const ACTIVE = new Set(['active', 'approved', 'published', 'live']);

const normalise = (id, data) => {
  const rawLoc = data.location;
  const location = typeof rawLoc === 'string'
    ? rawLoc
    : rawLoc && typeof rawLoc === 'object'
      ? [rawLoc.address || rawLoc.area, rawLoc.city || rawLoc.county].filter(Boolean).join(', ')
      : [data.address, data.city].filter(Boolean).join(', ');
  return {
    id,
    title: data.title || (typeof data.address === 'string' ? data.address : 'Untitled listing'),
    price: Number(data.price) || 0,
    location: location || '—',
    status: String(data.status || 'pending').toLowerCase(),
    submittedBy: data.submittedBy || data.ownerEmail || data.agentEmail || data.agent?.email || data.owner || '—',
    createdAt: data.createdAt,
    images: Array.isArray(data.images) ? data.images : [],
    image: data.image, coverPhoto: data.coverPhoto,
    bedrooms: Number(data.bedrooms || data.beds || 0),
    bathrooms: Number(data.bathrooms || data.baths || 0),
    description: data.description || '',
    rejectionReason: data.rejectionReason || '',
    listingType: String(data.listingType || data.listing_type || '').toLowerCase(),
    views: Number(data.views || 0),
  };
};

const statusLabel = (s) => (ACTIVE.has(s) ? 'Active' : s === 'pending' ? 'Pending' : s === 'rejected' ? 'Rejected' : s === 'inactive' ? 'Unpublished' : s);

const PropertyModeration = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(null); // { ids: [] }
  const [busy, setBusy] = useState(false);
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

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => ACTIVE.has(r.status)).length,
    pending: rows.filter((r) => r.status === 'pending').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  }), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status === 'active' && !ACTIVE.has(r.status)) return false;
      if (status !== 'all' && status !== 'active' && r.status !== status) return false;
      if (!q) return true;
      return [r.title, r.location, r.submittedBy].some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const someVisibleSelected = visible.some((r) => selected.has(r.id));

  useEffect(() => { setPage(1); }, [search, status]);

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((r) => next.delete(r.id));
      else visible.forEach((r) => next.add(r.id));
      return next;
    });
  };
  const toggleOne = (id) => setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  // ── writes ──
  const patch = async (ids, data) => {
    setBusy(true); setError('');
    try {
      await Promise.all(ids.map((id) => updateDoc(doc(db, 'listings', id), { ...data, updatedAt: serverTimestamp() })));
      setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, ...data } : r)));
    } catch (e) {
      setError('Update failed. ' + (e.message || ''));
    } finally {
      setBusy(false);
    }
  };
  const approve = (ids) => patch(ids, { status: 'active', rejectionReason: '' });
  const unpublish = (ids) => patch(ids, { status: 'inactive' });
  const reject = async () => {
    if (!rejecting || !reason.trim()) return;
    await patch(rejecting, { status: 'rejected', rejectionReason: reason.trim() });
    setRejecting(null); setReason(''); setDetail(null);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true); setError('');
    try {
      await Promise.all(deleting.ids.map((id) => deleteDoc(doc(db, 'listings', id))));
      setRows((prev) => prev.filter((r) => !deleting.ids.includes(r.id)));
      setSelected((prev) => { const next = new Set(prev); deleting.ids.forEach((id) => next.delete(id)); return next; });
      setDetail(null);
    } catch (e) {
      setError('Delete failed. ' + (e.message || ''));
    } finally {
      setBusy(false); setDeleting(null);
    }
  };

  const exportCsv = () => {
    const header = ['id', 'title', 'status', 'price', 'location', 'submittedBy', 'createdAt'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [header.join(','), ...filtered.map((r) => [r.id, r.title, r.status, r.price, r.location, r.submittedBy, formatDate(r.createdAt)].map(esc).join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `listings-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click(); URL.revokeObjectURL(url);
  };

  const selectedIds = [...selected];

  return (
    <>
      <PageHeader title="Listings" description="Every listing on the site. Approve, unpublish, reject with a reason, or remove.">
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}><Download />Export CSV</Button>
      </PageHeader>

      <StatGrid
        loading={loading}
        items={[
          { label: 'All listings', value: stats.total, icon: Home },
          { label: 'Active', value: stats.active, note: 'visible on the site' },
          { label: 'Pending review', value: stats.pending, note: stats.pending ? 'waiting on you' : 'nothing waiting' },
          { label: 'Rejected', value: stats.rejected },
        ]}
      />

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-hidden">
        <div className="space-y-3 p-3 md:p-4">
          <Toolbar>
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, area or submitter" className="pl-8" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Unpublished</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">{filtered.length.toLocaleString()} result{filtered.length === 1 ? '' : 's'}</span>
          </Toolbar>

          <SelectionBar count={selectedIds.length} onClear={() => setSelected(new Set())}>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => approve(selectedIds)}><Check />Approve</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => unpublish(selectedIds)}><EyeOff />Unpublish</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => { setRejecting(selectedIds); setReason(''); }}><X />Reject</Button>
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => setDeleting({ ids: selectedIds })}><Trash2 />Delete</Button>
          </SelectionBar>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState icon={Home} title="No listings match" description={search || status !== 'all' ? 'Try clearing the search or the status filter.' : 'Listings will appear here as they are added.'} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false} onCheckedChange={toggleAll} aria-label="Select all on this page" />
                  </TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead className="hidden md:table-cell">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Submitted by</TableHead>
                  <TableHead className="hidden md:table-cell">Added</TableHead>
                  <TableHead className="w-12 text-right pr-3"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id} data-state={selected.has(r.id) ? 'selected' : undefined}>
                    <TableCell className="pl-4">
                      <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleOne(r.id)} aria-label={`Select ${r.title}`} />
                    </TableCell>
                    <TableCell>
                      <button type="button" onClick={() => setDetail(r)} className="flex min-w-0 items-center gap-3 text-left">
                        <img src={getPropertyImage(r)} alt="" loading="lazy" onError={(e) => handleImageError(e, null, r)} className="h-11 w-16 shrink-0 rounded-md object-cover bg-muted" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">{r.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{r.location}</span>
                          <span className="block text-xs text-muted-foreground md:hidden">{formatKsh(r.price)}</span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell whitespace-nowrap tabular-nums">{formatKsh(r.price)}</TableCell>
                    <TableCell><Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[180px] truncate text-muted-foreground">{r.submittedBy}</TableCell>
                    <TableCell className="hidden md:table-cell whitespace-nowrap text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                    <TableCell className="text-right pr-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Row actions"><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setDetail(r)}><Eye />View details</DropdownMenuItem>
                          {!ACTIVE.has(r.status) && <DropdownMenuItem onSelect={() => approve([r.id])}><Check />Approve</DropdownMenuItem>}
                          {ACTIVE.has(r.status) && <DropdownMenuItem onSelect={() => unpublish([r.id])}><EyeOff />Unpublish</DropdownMenuItem>}
                          {r.status !== 'rejected' && <DropdownMenuItem onSelect={() => { setRejecting([r.id]); setReason(''); }}><X />Reject…</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleting({ ids: [r.id] })}><Trash2 />Delete…</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={safePage} pageCount={pageCount} onPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
          </>
        )}
      </Card>

      {/* Detail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{detail.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{detail.location}</DialogDescription>
              </DialogHeader>
              <img src={getPropertyImage(detail)} alt="" onError={(e) => handleImageError(e, null, detail)} className="h-56 w-full rounded-md object-cover bg-muted" />
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="font-semibold tabular-nums">{formatKsh(detail.price)}{detail.listingType.includes('rent') ? <span className="font-normal text-muted-foreground"> / month</span> : null}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Bed className="h-4 w-4" />{detail.bedrooms || '—'}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Bath className="h-4 w-4" />{detail.bathrooms || '—'}</span>
                <Badge variant={statusVariant(detail.status)}>{statusLabel(detail.status)}</Badge>
                <span className="text-muted-foreground">{detail.views.toLocaleString()} views</span>
              </div>
              {detail.description && <p className="max-h-40 overflow-y-auto text-sm leading-relaxed text-muted-foreground">{detail.description}</p>}
              {detail.rejectionReason && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">Rejected: {detail.rejectionReason}</p>}
              <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div><dt className="uppercase tracking-wide">Submitted by</dt><dd className="mt-0.5 truncate text-foreground">{detail.submittedBy}</dd></div>
                <div><dt className="uppercase tracking-wide">Added</dt><dd className="mt-0.5 text-foreground">{formatDate(detail.createdAt)}</dd></div>
              </dl>
              <DialogFooter>
                <Button variant="destructive" size="sm" onClick={() => setDeleting({ ids: [detail.id] })}><Trash2 />Delete</Button>
                {detail.status !== 'rejected' && <Button variant="outline" size="sm" onClick={() => { setRejecting([detail.id]); setReason(''); }}><X />Reject</Button>}
                {ACTIVE.has(detail.status)
                  ? <Button variant="outline" size="sm" disabled={busy} onClick={() => { unpublish([detail.id]); setDetail({ ...detail, status: 'inactive' }); }}><EyeOff />Unpublish</Button>
                  : <Button size="sm" disabled={busy} onClick={() => { approve([detail.id]); setDetail({ ...detail, status: 'active' }); }}><Check />Approve</Button>}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject with reason */}
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejecting?.length === 1 ? 'this listing' : `${rejecting?.length} listings`}</DialogTitle>
            <DialogDescription>The reason is stored on the listing and shown to the agent.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Photos don't show the property, or the price is missing." rows={4} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!reason.trim() || busy} onClick={reject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.ids.length === 1 ? 'this listing' : `${deleting?.ids.length} listings`}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the listing from Firestore permanently. It cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={busy} onClick={(e) => { e.preventDefault(); confirmDelete(); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PropertyModeration;
