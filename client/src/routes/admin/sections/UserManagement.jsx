import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { isPlaceholderImage } from '../../../utils/imageUtils';
import { Users, Search, MoreHorizontal, Eye, UserCog, Lock, Unlock, Trash2, Download, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatGrid, Toolbar, SelectionBar, EmptyState, Pagination, statusVariant, formatDate } from '@/components/admin/primitives';

const PAGE_SIZE = 25;
const ROLES = ['user', 'agent', 'moderator', 'admin'];

const normaliseUser = (id, data, verified) => ({
  id,
  email: data.email || '',
  name: data.username || data.name || data.displayName || data.email || 'User',
  role: ROLES.includes(String(data.role || '').toLowerCase()) ? String(data.role).toLowerCase() : 'user',
  isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
  avatar: data.avatar || data.photoURL || '',
  phone: data.phone || data.phoneNumber || '',
  properties: Number(data.propertiesCount) || 0,
  createdAt: data.createdAt,
  lastLogin: data.lastLogin,
  verified: !!verified,
});

// Used only when the users collection is empty: build rows from agent profiles.
const normaliseAgentAsUser = (id, a) => ({
  id,
  email: a.email || '',
  name: a.name || a.fullName || a.email || 'Agent',
  role: 'agent',
  isActive: true,
  avatar: a.image || a.avatar || '',
  phone: a.phoneNumber || a.phone || '',
  properties: Number(a.propertiesSold) || 0,
  createdAt: a.createdAt,
  lastLogin: a.lastLogin,
  verified: !!a.verified,
});

const initials = (name) => String(name || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const Avatar = ({ src, name, className }) => {
  const [broken, setBroken] = useState(false);
  const show = !!src && !broken && !isPlaceholderImage(src);
  return show ? (
    <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className={cn('shrink-0 rounded-full bg-muted object-cover', className)} />
  ) : (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground', className)}>{initials(name)}</span>
  );
};

const roleVariant = (role) => (role === 'admin' ? 'default' : role === 'moderator' ? 'secondary' : 'outline');
const roleLabel = (role) => role.charAt(0).toUpperCase() + role.slice(1);
const statusOf = (u) => (u.isActive ? 'active' : 'suspended');
const statusLabel = (u) => (u.isActive ? 'Active' : 'Suspended');

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [roleEdit, setRoleEdit] = useState(null); // { user, role }
  const [suspending, setSuspending] = useState(null); // { ids: [] }
  const [deleting, setDeleting] = useState(null); // { ids: [] }
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // One read of each collection; agent profiles supply the "verified" flag.
        const [usersSnap, agentsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'agents')).catch(() => null),
        ]);
        const verifiedIds = new Set((agentsSnap?.docs || []).filter((d) => d.data().verified === true).map((d) => d.id));
        let list = usersSnap.docs.map((d) => normaliseUser(d.id, d.data(), verifiedIds.has(d.id)));
        if (list.length === 0 && agentsSnap) list = agentsSnap.docs.map((d) => normaliseAgentAsUser(d.id, d.data()));
        const t = (v) => (v?.toDate ? v.toDate().getTime() : v ? new Date(v).getTime() : 0);
        list.sort((a, b) => t(b.createdAt) - t(a.createdAt));
        setRows(list);
      } catch (e) {
        setError('Could not load users. ' + (e.message || ''));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.isActive).length,
    verified: rows.filter((r) => r.verified).length,
    admins: rows.filter((r) => r.role === 'admin').length,
  }), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (role !== 'all' && r.role !== role) return false;
      if (status !== 'all' && statusOf(r) !== status) return false;
      if (!q) return true;
      return [r.name, r.email, r.phone].some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, search, role, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const someVisibleSelected = visible.some((r) => selected.has(r.id));

  useEffect(() => { setPage(1); }, [search, role, status]);

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((r) => next.delete(r.id));
      else visible.forEach((r) => next.add(r.id));
      return next;
    });
  };
  const toggleOne = (id) => setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const isSelf = (id) => !!currentUser?.id && id === currentUser.id;

  // ── writes ──
  const patch = async (ids, data) => {
    setBusy(true); setError('');
    try {
      await Promise.all(ids.map((id) => updateDoc(doc(db, 'users', id), data)));
      setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, ...data } : r)));
      setDetail((d) => (d && ids.includes(d.id) ? { ...d, ...data } : d));
      return true;
    } catch (e) {
      setError('Update failed. ' + (e.message || ''));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const activate = (ids) => patch(ids, { isActive: true });
  const confirmSuspend = async () => {
    if (!suspending) return;
    await patch(suspending.ids, { isActive: false });
    setSuspending(null);
  };
  const saveRole = async () => {
    if (!roleEdit) return;
    const ok = await patch([roleEdit.user.id], { role: roleEdit.role });
    if (ok) setRoleEdit(null);
  };
  const openDelete = (ids) => {
    const allowed = ids.filter((id) => !isSelf(id));
    if (allowed.length === 0) { setError('You cannot delete your own account.'); return; }
    setDeleteConfirm('');
    setDeleting({ ids: allowed });
  };
  const confirmDelete = async () => {
    if (!deleting || deleteConfirm !== 'DELETE') return;
    setBusy(true); setError('');
    try {
      await Promise.all(deleting.ids.map((id) => deleteDoc(doc(db, 'users', id))));
      setRows((prev) => prev.filter((r) => !deleting.ids.includes(r.id)));
      setSelected((prev) => { const next = new Set(prev); deleting.ids.forEach((id) => next.delete(id)); return next; });
      setDetail(null);
      setDeleting(null);
    } catch (e) {
      setError('Delete failed. ' + (e.message || ''));
    } finally {
      setBusy(false); setDeleteConfirm('');
    }
  };

  const exportCsv = () => {
    const header = ['id', 'name', 'email', 'phone', 'role', 'status', 'verifiedAgent', 'properties', 'joined', 'lastLogin'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [header.join(','), ...filtered.map((r) => [r.id, r.name, r.email, r.phone, r.role, statusOf(r), r.verified ? 'yes' : 'no', r.properties, formatDate(r.createdAt), formatDate(r.lastLogin)].map(esc).join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `users-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click(); URL.revokeObjectURL(url);
  };

  const selectedIds = [...selected];
  const selectedRows = rows.filter((r) => selected.has(r.id));

  return (
    <>
      <PageHeader title="Users" description="Every account on the site. Change roles, suspend or reactivate, or remove accounts.">
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}><Download />Export CSV</Button>
      </PageHeader>

      <StatGrid
        loading={loading}
        items={[
          { label: 'All users', value: stats.total, icon: Users },
          { label: 'Active', value: stats.active, note: stats.total - stats.active ? `${(stats.total - stats.active).toLocaleString()} suspended` : 'none suspended' },
          { label: 'Verified agents', value: stats.verified, icon: ShieldCheck },
          { label: 'Admins', value: stats.admins },
        ]}
      />

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-hidden">
        <div className="space-y-3 p-3 md:p-4">
          <Toolbar>
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or phone" className="pl-8" />
            </div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">{filtered.length.toLocaleString()} result{filtered.length === 1 ? '' : 's'}</span>
          </Toolbar>

          <SelectionBar count={selectedIds.length} onClear={() => setSelected(new Set())}>
            <Button size="sm" variant="outline" disabled={busy || selectedRows.every((r) => r.isActive)} onClick={() => activate(selectedIds)}><Unlock />Activate</Button>
            <Button size="sm" variant="outline" disabled={busy || selectedRows.every((r) => !r.isActive)} onClick={() => setSuspending({ ids: selectedIds })}><Lock />Suspend</Button>
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => openDelete(selectedIds)}><Trash2 />Delete</Button>
          </SelectionBar>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState icon={Users} title="No users match" description={search || role !== 'all' || status !== 'all' ? 'Try clearing the search or the filters.' : 'Accounts will appear here as people sign up.'} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false} onCheckedChange={toggleAll} aria-label="Select all on this page" />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Listings</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead className="hidden md:table-cell">Last login</TableHead>
                  <TableHead className="w-12 text-right pr-3"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id} data-state={selected.has(r.id) ? 'selected' : undefined}>
                    <TableCell className="pl-4">
                      <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleOne(r.id)} aria-label={`Select ${r.name}`} />
                    </TableCell>
                    <TableCell>
                      <button type="button" onClick={() => setDetail(r)} className="flex min-w-0 items-center gap-3 text-left">
                        <Avatar src={r.avatar} name={r.name} className="h-9 w-9" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <span className="truncate">{r.name}</span>
                            {isSelf(r.id) && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                            {r.verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Verified agent" />}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">{r.email || r.phone || '—'}</span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell><Badge variant={roleVariant(r.role)}>{roleLabel(r.role)}</Badge></TableCell>
                    <TableCell><Badge variant={statusVariant(statusOf(r))}>{statusLabel(r)}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-right tabular-nums text-muted-foreground">{r.properties.toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell whitespace-nowrap text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                    <TableCell className="hidden md:table-cell whitespace-nowrap text-muted-foreground">{formatDate(r.lastLogin)}</TableCell>
                    <TableCell className="text-right pr-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Row actions"><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setDetail(r)}><Eye />View details</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setRoleEdit({ user: r, role: r.role })}><UserCog />Change role…</DropdownMenuItem>
                          {r.isActive
                            ? <DropdownMenuItem onSelect={() => setSuspending({ ids: [r.id] })}><Lock />Suspend…</DropdownMenuItem>
                            : <DropdownMenuItem onSelect={() => activate([r.id])}><Unlock />Activate</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" disabled={isSelf(r.id)} onSelect={() => openDelete([r.id])}><Trash2 />Delete…</DropdownMenuItem>
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
        <DialogContent>
          {detail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 pr-8">
                  <Avatar src={detail.avatar} name={detail.name} className="h-12 w-12 text-sm" />
                  <div className="min-w-0">
                    <DialogTitle className="truncate">{detail.name}</DialogTitle>
                    <DialogDescription className="truncate">{detail.email || 'No email on file'}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={roleVariant(detail.role)}>{roleLabel(detail.role)}</Badge>
                <Badge variant={statusVariant(statusOf(detail))}>{statusLabel(detail)}</Badge>
                {detail.verified && <Badge variant="success">Verified agent</Badge>}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-muted-foreground">
                <div><dt className="uppercase tracking-wide">Phone</dt><dd className="mt-0.5 text-foreground">{detail.phone || '—'}</dd></div>
                <div><dt className="uppercase tracking-wide">Listings</dt><dd className="mt-0.5 tabular-nums text-foreground">{detail.properties.toLocaleString()}</dd></div>
                <div><dt className="uppercase tracking-wide">Joined</dt><dd className="mt-0.5 text-foreground">{formatDate(detail.createdAt)}</dd></div>
                <div><dt className="uppercase tracking-wide">Last login</dt><dd className="mt-0.5 text-foreground">{formatDate(detail.lastLogin)}</dd></div>
                <div className="col-span-2"><dt className="uppercase tracking-wide">User ID</dt><dd className="mt-0.5 break-all font-mono text-foreground">{detail.id}</dd></div>
              </dl>
              <DialogFooter>
                <Button variant="destructive" size="sm" disabled={isSelf(detail.id)} onClick={() => openDelete([detail.id])}><Trash2 />Delete</Button>
                <Button variant="outline" size="sm" onClick={() => setRoleEdit({ user: detail, role: detail.role })}><UserCog />Change role</Button>
                {detail.isActive
                  ? <Button variant="outline" size="sm" disabled={busy} onClick={() => setSuspending({ ids: [detail.id] })}><Lock />Suspend</Button>
                  : <Button size="sm" disabled={busy} onClick={() => activate([detail.id])}><Unlock />Activate</Button>}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Change role */}
      <Dialog open={!!roleEdit} onOpenChange={(o) => !o && setRoleEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>{roleEdit?.user.name}{roleEdit?.user.email ? ` · ${roleEdit.user.email}` : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-role">New role</Label>
            <Select value={roleEdit?.role || 'user'} onValueChange={(v) => setRoleEdit((s) => (s ? { ...s, role: v } : s))}>
              <SelectTrigger id="new-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
              </SelectContent>
            </Select>
            {roleEdit && isSelf(roleEdit.user.id) && roleEdit.role !== 'admin' && (
              <p className="text-xs text-destructive">This is your own account. Leaving the admin role will lock you out of this panel.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleEdit(null)}>Cancel</Button>
            <Button disabled={busy || !roleEdit || roleEdit.role === roleEdit.user.role} onClick={saveRole}>Save role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend confirmation */}
      <AlertDialog open={!!suspending} onOpenChange={(o) => !o && setSuspending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {suspending?.ids.length === 1 ? 'this account' : `${suspending?.ids.length} accounts`}?</AlertDialogTitle>
            <AlertDialogDescription>Suspended accounts are marked inactive. You can reactivate them at any time from this page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={busy} onClick={(e) => { e.preventDefault(); confirmSuspend(); }}>Suspend</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) { setDeleting(null); setDeleteConfirm(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.ids.length === 1 ? 'this account' : `${deleting?.ids.length} accounts`}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the user profile from Firestore permanently. It cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">Type <span className="font-semibold text-destructive">DELETE</span> to confirm</Label>
            <Input id="delete-confirm" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" autoComplete="off" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={busy || deleteConfirm !== 'DELETE'} onClick={(e) => { e.preventDefault(); confirmDelete(); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserManagement;
