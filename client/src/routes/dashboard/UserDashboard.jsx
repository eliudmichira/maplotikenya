import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { accountDashboardAPI } from '../../lib/firebaseAPI';
import { getPropertyImage, handleImageError } from '../../utils/imageUtils';
import WorkspaceShell from '../../components/workspace/WorkspaceShell';
import ProfileSection from './sections/ProfileSection';
import ListingCard from '../../components/listing/ListingCard';
import { Home, Heart, Calendar, Search, Eye, Mail, User, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatGrid, EmptyState, SectionHeader, statusVariant, formatKsh, formatDate } from '@/components/admin/primitives';

// A home-seeker's workspace: what they saved, what they asked to view, and
// what they looked at recently. Every number is a count of real records.

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'favorites', label: 'Saved homes', icon: Heart },
  { id: 'bookings', label: 'Viewing requests', icon: Calendar },
  { id: 'profile', label: 'Profile', icon: User },
];

const LINKS = [
  { label: 'Messages', icon: Mail, to: '/messages' },
];

const areaOf = (p) => p.location?.address || p.location?.area || p.address || p.city || '';

const UserDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, favorites } = useAuth();

  const sectionFromUrl = searchParams.get('section');
  const [active, setActive] = useState(SECTIONS.some((s) => s.id === sectionFromUrl) ? sectionFromUrl : 'overview');
  useEffect(() => {
    if (active !== sectionFromUrl) setSearchParams({ section: active }, { replace: true });
  }, [active, sectionFromUrl, setSearchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [viewed, setViewed] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [bk, vw] = await Promise.all([
        accountDashboardAPI.getUserBookings(currentUser.id).catch(() => null),
        accountDashboardAPI.getUserViewHistory(currentUser.id).catch(() => []),
      ]);
      if (cancelled) return;
      if (bk === null) setError('Some of your data could not be loaded. Check your connection and refresh.');
      setBookings(bk || []);
      setViewed(Array.isArray(vw) ? vw : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const saved = useMemo(() => (Array.isArray(favorites) ? favorites.filter((f) => f && f.id) : []), [favorites]);
  const pendingBookings = useMemo(() => bookings.filter((b) => (b.status || 'pending') === 'pending'), [bookings]);
  const upcoming = useMemo(() => bookings.filter((b) => ['pending', 'confirmed'].includes(b.status || 'pending')).slice(0, 5), [bookings]);

  const cancelBooking = async (b) => {
    setBusyId(b.id);
    try {
      await updateDoc(doc(db, 'bookings', b.id), { status: 'cancelled', updatedAt: serverTimestamp() });
      setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: 'cancelled' } : x)));
    } catch (e) {
      setError(`Could not cancel that request. ${e.message || ''}`);
    } finally {
      setBusyId(null);
    }
  };

  const browseButton = (
    <Button size="sm" asChild><Link to="/desktop/properties"><Search />Browse listings</Link></Button>
  );

  // ── pieces ──
  const BookingItem = ({ b }) => {
    const status = b.status || 'pending';
    return (
      <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={b.propertyId ? `/property/${b.propertyId}` : '#'} className="text-sm font-medium text-foreground hover:underline">{b.propertyTitle || 'Listing'}</Link>
            <Badge variant={statusVariant(status)}>{status}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {b.viewingDate || formatDate(b.date)}{b.viewingTime ? ` at ${b.viewingTime}` : ''}{b.agentName ? ` · with ${b.agentName}` : ''}
          </p>
        </div>
        {['pending', 'confirmed'].includes(status) && (
          <Button size="sm" variant="outline" onClick={() => cancelBooking(b)} disabled={busyId === b.id}>
            {busyId === b.id ? <Loader2 className="animate-spin" /> : <X />}Cancel
          </Button>
        )}
      </li>
    );
  };

  // ── sections ──
  const Overview = () => (
    <>
      <PageHeader title={`Welcome back, ${(currentUser?.name || 'there').split(' ')[0]}`} description="Your saved homes, viewing requests and recent activity in one place.">
        {browseButton}
      </PageHeader>
      <StatGrid
        loading={loading}
        columns={3}
        items={[
          { label: 'Saved homes', value: saved.length, note: 'Listings you have hearted', icon: Heart },
          { label: 'Viewing requests', value: bookings.length, note: `${pendingBookings.length.toLocaleString()} awaiting confirmation`, icon: Calendar },
          { label: 'Recently viewed', value: viewed.length, note: 'Listings you have opened', icon: Eye },
        ]}
      />

      <Card>
        <div className="flex items-center justify-between border-b border-border p-4">
          <SectionHeader title="Saved homes" description={saved.length ? `${saved.length.toLocaleString()} saved` : undefined} />
          {saved.length > 4 && <Button variant="ghost" size="sm" onClick={() => setActive('favorites')}>View all</Button>}
        </div>
        {saved.length === 0 ? (
          <EmptyState icon={Heart} title="Nothing saved yet" description="Tap the heart on any listing to keep it here." action={browseButton} />
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
            {saved.slice(0, 4).map((p) => <ListingCard key={p.id} property={p} />)}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-border p-4">
            <SectionHeader title="Upcoming viewings" />
            {bookings.length > 0 && <Button variant="ghost" size="sm" onClick={() => setActive('bookings')}>View all</Button>}
          </div>
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : upcoming.length === 0 ? (
            <EmptyState icon={Calendar} title="No viewings booked" description="Request a viewing from any listing page." className="py-10" />
          ) : (
            <ul className="divide-y divide-border px-4">{upcoming.map((b) => <BookingItem key={b.id} b={b} />)}</ul>
          )}
        </Card>

        <Card>
          <div className="border-b border-border p-4"><SectionHeader title="Recently viewed" /></div>
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : viewed.length === 0 ? (
            <EmptyState icon={Eye} title="Nothing viewed yet" description="Listings you open will show up here so you can find them again." className="py-10" />
          ) : (
            <ul className="divide-y divide-border px-4">
              {viewed.slice(0, 5).map((p, i) => (
                <li key={p.id || i} className="flex items-center gap-3 py-3">
                  <img src={getPropertyImage(p)} alt="" loading="lazy" onError={(e) => handleImageError(e, null, p)} className="h-10 w-14 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to={p.id ? `/property/${p.id}` : '#'} className="block truncate text-sm font-medium text-foreground hover:underline">{p.title || 'Listing'}</Link>
                    <p className="truncate text-xs text-muted-foreground">{areaOf(p) || formatDate(p.viewedAt || p.timestamp)}</p>
                  </div>
                  <span className="text-sm tabular-nums text-foreground">{formatKsh(p.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );

  const Favorites = () => (
    <>
      <PageHeader title="Saved homes" description="Listings you hearted. Tap the heart again to remove one.">{browseButton}</PageHeader>
      {saved.length === 0 ? (
        <Card><EmptyState icon={Heart} title="Nothing saved yet" description="Tap the heart on any listing to keep it here." action={browseButton} /></Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {saved.map((p) => <ListingCard key={p.id} property={p} />)}
        </div>
      )}
    </>
  );

  const Bookings = () => (
    <>
      <PageHeader title="Viewing requests" description="Viewings you have asked for and what the agent said." />
      <Card>
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : bookings.length === 0 ? (
          <EmptyState icon={Calendar} title="No viewing requests yet" description="Request a viewing from any listing page and track it here." action={browseButton} />
        ) : (
          <ul className="divide-y divide-border px-4">{bookings.map((b) => <BookingItem key={b.id} b={b} />)}</ul>
        )}
      </Card>
    </>
  );

  const body = { overview: <Overview />, favorites: <Favorites />, bookings: <Bookings />, profile: <ProfileSection role="user" /> }[active] || <Overview />;

  return (
    <WorkspaceShell root="My account" navLabel="Workspace" sections={SECTIONS} links={LINKS} active={active} onSelect={setActive}>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {body}
    </WorkspaceShell>
  );
};

export default UserDashboard;
