import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { accountDashboardAPI, propertiesAPI } from '../../lib/firebaseAPI';
import { getPropertyImage, handleImageError } from '../../utils/imageUtils';
import WorkspaceShell from '../../components/workspace/WorkspaceShell';
import ProfileSection from './sections/ProfileSection';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LabelList
} from 'recharts';
import {
  Home, Building2, MessageCircle, Calendar, Plus, Eye, MoreHorizontal, Pencil, Trash2, ExternalLink,
  Check, X, Mail, Phone, User, Search, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from '@/components/ui/alert-dialog';
import { PageHeader, StatGrid, EmptyState, SectionHeader, Toolbar, statusVariant, formatKsh, formatDate } from '@/components/admin/primitives';

// Everything on this dashboard is counted from the agent's own listings,
// inquiries and viewing requests. Nothing is estimated.

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'listings', label: 'My listings', icon: Building2 },
  { id: 'inquiries', label: 'Inquiries', icon: MessageCircle },
  { id: 'bookings', label: 'Viewing requests', icon: Calendar },
  { id: 'profile', label: 'Profile', icon: User },
];

const LINKS = [
  { label: 'Messages', icon: Mail, to: '/messages' },
];

const toDate = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : null);
const listingTypeOf = (p) => {
  const raw = String(p.listingType || p.listing_type || p.type || '').toLowerCase();
  return /rent|let/.test(raw) ? 'For rent' : /sale|sell/.test(raw) ? 'For sale' : '—';
};
const areaOf = (p) => p.location?.address || p.location?.area || p.address || p.city || '—';

// Chart frame with the same quiet treatment as the admin analytics page.
function ChartCard({ title, subtitle, legend, empty, emptyText, children }) {
  return (
    <Card>
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
          </div>
          {legend && legend.length > 1 && (
            <ul className="flex items-center gap-4">
              {legend.map((l) => (
                <li key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                  {l.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {empty ? <EmptyState title={emptyText} className="py-10" /> : children}
      </CardContent>
    </Card>
  );
}

const AgentDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();

  const sectionFromUrl = searchParams.get('section');
  const [active, setActive] = useState(SECTIONS.some((s) => s.id === sectionFromUrl) ? sectionFromUrl : 'overview');
  useEffect(() => {
    if (active !== sectionFromUrl) setSearchParams({ section: active }, { replace: true });
  }, [active, sectionFromUrl, setSearchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      const [props, inq, bk] = await Promise.all([
        accountDashboardAPI.getUserProperties(currentUser.id).catch(() => null),
        accountDashboardAPI.getAgentInquiries(currentUser.id).catch(() => []),
        accountDashboardAPI.getAgentBookings(currentUser.id).catch(() => []),
      ]);
      if (cancelled) return;
      if (props === null) setError('Some of your data could not be loaded. Check your connection and refresh.');
      setProperties(props || []);
      setInquiries(inq || []);
      setBookings(bk || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // ── derived ──
  const stats = useMemo(() => ({
    active: properties.filter((p) => String(p.status || 'active').toLowerCase() === 'active').length,
    views: properties.reduce((s, p) => s + Number(p.views || p.viewsCount || 0), 0),
    newInquiries: inquiries.filter((i) => (i.status || 'new') === 'new').length,
    pendingBookings: bookings.filter((b) => (b.status || 'pending') === 'pending').length,
  }), [properties, inquiries, bookings]);

  const viewsByListing = useMemo(() => (
    [...properties]
      .map((p) => ({ name: (p.title || 'Untitled').slice(0, 28), views: Number(p.views || p.viewsCount || 0) }))
      .filter((d) => d.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 6)
  ), [properties]);

  const activityByMonth = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name: d.toLocaleString('en', { month: 'short' }), inquiries: 0, bookings: 0 });
    }
    const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
    const bump = (list, field) => list.forEach((item) => {
      const d = toDate(item.createdAt || item.timestamp || item.date);
      if (!d) return;
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (k in idx) buckets[idx[k]][field] += 1;
    });
    bump(inquiries, 'inquiries');
    bump(bookings, 'bookings');
    return buckets;
  }, [inquiries, bookings]);
  const hasActivity = activityByMonth.some((b) => b.inquiries > 0 || b.bookings > 0);

  const visibleListings = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return properties;
    return properties.filter((p) => [p.title, areaOf(p)].some((v) => String(v || '').toLowerCase().includes(s)));
  }, [properties, search]);

  // ── writes ──
  const confirmDelete = async () => {
    if (!deleting?.id) return;
    setBusy(true);
    try {
      await propertiesAPI.delete(deleting.id);
      setProperties((prev) => prev.filter((p) => p.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      setError(`Could not delete that listing. ${e.message || ''}`);
    } finally {
      setBusy(false);
    }
  };

  const setBookingStatus = async (booking, status) => {
    setBookingBusy(booking.id);
    try {
      await updateDoc(doc(db, 'bookings', booking.id), { status, updatedAt: serverTimestamp() });
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status } : b)));
    } catch (e) {
      setError(`Could not update that viewing request. ${e.message || ''}`);
    } finally {
      setBookingBusy(null);
    }
  };

  // ── chart ink ──
  const ink = isDark ? '#a3a3a3' : '#6b6b6b';
  const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const secondBar = isDark ? '#e5e5e5' : '#303030';
  const tooltipStyle = {
    backgroundColor: isDark ? '#111111' : '#ffffff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 8, color: isDark ? '#f2f2f2' : '#111111', fontSize: 13,
  };

  // ── pieces ──
  const ListingRow = ({ p }) => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <img src={getPropertyImage(p)} alt="" loading="lazy" onError={(e) => handleImageError(e, null, p)} className="h-10 w-14 shrink-0 rounded-md object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{p.title || 'Untitled listing'}</p>
            <p className="truncate text-xs text-muted-foreground">{areaOf(p)}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm tabular-nums">{formatKsh(p.price)}</TableCell>
      <TableCell className="hidden text-sm md:table-cell">{listingTypeOf(p)}</TableCell>
      <TableCell><Badge variant={statusVariant(p.status || 'active')}>{p.status || 'active'}</Badge></TableCell>
      <TableCell className="hidden text-sm tabular-nums sm:table-cell">{Number(p.views || p.viewsCount || 0).toLocaleString()}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Listing actions"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => navigate(`/property/${p.id}`)}><ExternalLink />View listing</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(`/properties/add?edit=${p.id}`)}><Pencil />Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setDeleting(p)} className="text-destructive focus:text-destructive"><Trash2 />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  const ListingsTable = ({ rows }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Listing</TableHead>
          <TableHead>Price</TableHead>
          <TableHead className="hidden md:table-cell">Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Views</TableHead>
          <TableHead className="w-[1%] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{rows.map((p) => <ListingRow key={p.id} p={p} />)}</TableBody>
    </Table>
  );

  const InquiryItem = ({ i }) => (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{i.client?.name || i.clientName || i.name || 'Client'}</p>
          <Badge variant={(i.status || 'new') === 'new' ? 'warning' : 'muted'}>{i.status || 'new'}</Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {i.property?.title || i.propertyTitle || 'Listing'} · {formatDate(i.updatedAt || i.createdAt)}
        </p>
        {(i.lastMessage || i.message) && <p className="mt-1.5 line-clamp-2 text-sm text-foreground/80">{i.lastMessage || i.message}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {i.conversationId && (
          <Button size="sm" variant="outline" asChild><Link to={`/messages?conversation=${i.conversationId}`}><MessageCircle />Open chat</Link></Button>
        )}
        {(i.client?.email || i.clientEmail || i.email) && (
          <Button size="sm" variant="ghost" asChild><a href={`mailto:${i.client?.email || i.clientEmail || i.email}`} aria-label="Email client"><Mail /></a></Button>
        )}
        {(i.client?.phone || i.clientPhone || i.phone) && (
          <Button size="sm" variant="ghost" asChild><a href={`tel:${i.client?.phone || i.clientPhone || i.phone}`} aria-label="Call client"><Phone /></a></Button>
        )}
      </div>
    </li>
  );

  const BookingItem = ({ b }) => {
    const status = b.status || 'pending';
    const isBusy = bookingBusy === b.id;
    return (
      <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">{b.userName || b.name || 'Client'}</p>
            <Badge variant={statusVariant(status)}>{status}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {b.propertyTitle || 'Listing'} · {b.viewingDate || formatDate(b.date)}{b.viewingTime ? ` at ${b.viewingTime}` : ''}
          </p>
        </div>
        {status === 'pending' && (
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" onClick={() => setBookingStatus(b, 'confirmed')} disabled={isBusy}>
              {isBusy ? <Loader2 className="animate-spin" /> : <Check />}Confirm
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBookingStatus(b, 'declined')} disabled={isBusy}><X />Decline</Button>
          </div>
        )}
      </li>
    );
  };

  const addButton = (
    <Button size="sm" asChild><Link to="/properties/add"><Plus />Add listing</Link></Button>
  );

  // ── sections ──
  const Overview = () => (
    <>
      <PageHeader title={`Welcome back, ${(currentUser?.name || 'there').split(' ')[0]}`} description="Counted from your listings, inquiries and viewing requests. Nothing here is estimated.">
        {addButton}
      </PageHeader>
      <StatGrid
        loading={loading}
        items={[
          { label: 'Active listings', value: stats.active, note: `${properties.length.toLocaleString()} total`, icon: Building2 },
          { label: 'Views', value: stats.views, note: 'Across your listings', icon: Eye },
          { label: 'Inquiries', value: inquiries.length, note: `${stats.newInquiries.toLocaleString()} new`, icon: MessageCircle },
          { label: 'Viewing requests', value: bookings.length, note: `${stats.pendingBookings.toLocaleString()} pending`, icon: Calendar },
        ]}
      />
      {loading ? (
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2"><Skeleton className="h-64 rounded-lg" /><Skeleton className="h-64 rounded-lg" /></div>
      ) : (
        <>
          <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
            <ChartCard title="Views by listing" subtitle="Your six most viewed listings" empty={viewsByListing.length === 0} emptyText="No views recorded yet. A view is counted each time someone opens one of your listings.">
              <ResponsiveContainer width="100%" height={Math.max(160, viewsByListing.length * 44)}>
                <BarChart data={viewsByListing} layout="vertical" margin={{ top: 4, right: 40, left: 0, bottom: 4 }} barCategoryGap={10}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={150} axisLine={false} tickLine={false} tick={{ fill: ink, fontSize: 12 }} />
                  <Tooltip cursor={{ fill: grid }} contentStyle={tooltipStyle} formatter={(v) => [v.toLocaleString(), 'Views']} />
                  <Bar dataKey="views" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={14}>
                    <LabelList dataKey="views" position="right" style={{ fill: ink, fontSize: 12 }} formatter={(v) => v.toLocaleString()} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Inquiries and viewing requests" subtitle="Last six months" legend={[{ label: 'Inquiries', color: '#fbbf24' }, { label: 'Viewing requests', color: secondBar }]} empty={!hasActivity} emptyText="No inquiries or viewing requests in the last six months.">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activityByMonth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke={grid} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: ink, fontSize: 12 }} dy={6} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: ink, fontSize: 12 }} />
                  <Tooltip cursor={{ fill: grid }} contentStyle={tooltipStyle} />
                  <Bar dataKey="inquiries" name="Inquiries" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="bookings" name="Viewing requests" fill={secondBar} radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <Card>
            <div className="flex items-center justify-between border-b border-border p-4">
              <SectionHeader title="Recent listings" description={`${properties.length.toLocaleString()} in total`} />
              <Button variant="ghost" size="sm" onClick={() => setActive('listings')}>View all</Button>
            </div>
            {properties.length === 0 ? (
              <EmptyState icon={Building2} title="No listings yet" description="Add your first listing and it will show up here with its views." action={addButton} />
            ) : (
              <ListingsTable rows={properties.slice(0, 5)} />
            )}
          </Card>
        </>
      )}
    </>
  );

  const Listings = () => (
    <>
      <PageHeader title="My listings" description="Everything you have published, with views and status.">{addButton}</PageHeader>
      <Card>
        <div className="border-b border-border p-3">
          <Toolbar>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or area" className="w-64 pl-8" aria-label="Search listings" />
            </div>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">{visibleListings.length.toLocaleString()} of {properties.length.toLocaleString()}</span>
          </Toolbar>
        </div>
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : visibleListings.length === 0 ? (
          <EmptyState icon={Building2} title={search ? 'No listings match your search' : 'No listings yet'} description={search ? undefined : 'Add your first listing to start receiving inquiries.'} action={search ? undefined : addButton} />
        ) : (
          <ListingsTable rows={visibleListings} />
        )}
      </Card>
    </>
  );

  const Inquiries = () => (
    <>
      <PageHeader title="Inquiries" description="Messages from people interested in your listings." />
      <Card>
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : inquiries.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No inquiries yet" description="When someone asks about one of your listings it will appear here." />
        ) : (
          <ul className="divide-y divide-border px-4">{inquiries.map((i) => <InquiryItem key={i.id} i={i} />)}</ul>
        )}
      </Card>
    </>
  );

  const Bookings = () => {
    const pending = bookings.filter((b) => (b.status || 'pending') === 'pending');
    const rest = bookings.filter((b) => (b.status || 'pending') !== 'pending');
    return (
      <>
        <PageHeader title="Viewing requests" description="Confirm or decline requests to view your listings." />
        {loading ? (
          <Skeleton className="h-40 rounded-lg" />
        ) : bookings.length === 0 ? (
          <Card><EmptyState icon={Calendar} title="No viewing requests yet" description="Requests to view your listings will appear here." /></Card>
        ) : (
          <>
            <Card>
              <div className="border-b border-border p-4"><SectionHeader title="Awaiting your reply" description={`${pending.length} pending`} /></div>
              {pending.length === 0 ? <EmptyState title="Nothing pending" className="py-8" /> : <ul className="divide-y divide-border px-4">{pending.map((b) => <BookingItem key={b.id} b={b} />)}</ul>}
            </Card>
            {rest.length > 0 && (
              <Card>
                <div className="border-b border-border p-4"><SectionHeader title="Earlier" /></div>
                <ul className="divide-y divide-border px-4">{rest.map((b) => <BookingItem key={b.id} b={b} />)}</ul>
              </Card>
            )}
          </>
        )}
      </>
    );
  };

  const body = { overview: <Overview />, listings: <Listings />, inquiries: <Inquiries />, bookings: <Bookings />, profile: <ProfileSection role="agent" /> }[active] || <Overview />;

  return (
    <WorkspaceShell root="Agent" navLabel="Workspace" sections={SECTIONS} links={LINKS} active={active} onSelect={setActive}>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {body}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && !busy && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title || 'This listing'}” will be removed from the site. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceShell>
  );
};

export default AgentDashboard;
