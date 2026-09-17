import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import analyticsService from '../../../lib/analytics';
import { getTotalViews } from '../../../lib/propertyViews';
import { getTotalPageViews } from '../../../lib/pageViews';
import { getPropertyImage, handleImageError } from '../../../utils/imageUtils';
import { useTheme } from '../../../context/ThemeContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { Users, Home, Eye, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatGrid, EmptyState, formatKsh } from '@/components/admin/primitives';

// Every number on this screen is counted from Firestore. Nothing is estimated,
// so anything that cannot be measured yet (sessions, bounce rate, retention)
// is simply not shown.

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
const RANGE_LABEL = { '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days', '1y': 'last year' };
const ACTIVE_STATUSES = new Set(['active', 'approved', 'published', 'live']);

const toDate = (v) => {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const monthBuckets = (count = 6) => {
  const now = new Date();
  const buckets = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name: d.toLocaleString('en', { month: 'short' }), count: 0 });
  }
  return buckets;
};

const countByMonth = (items, field = 'createdAt') => {
  const buckets = monthBuckets();
  const index = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
  items.forEach((item) => {
    const d = toDate(item[field]);
    if (!d) return;
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (k in index) buckets[index[k]].count += 1;
  });
  return buckets;
};

const formatWhen = (d) => (d ? d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'date unknown');

// Bar chart card. One accent, recessive grid, muted axis ink.
function ChartCard({ title, subtitle, data, emptyText, isDark }) {
  const ink = isDark ? '#a3a3a3' : '#6b6b6b';
  const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const tooltipStyle = {
    backgroundColor: isDark ? '#111111' : '#ffffff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 8,
    color: isDark ? '#f2f2f2' : '#111111',
    fontSize: 13,
  };
  const empty = !data.some((b) => b.count);
  return (
    <Card>
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {empty ? (
          <EmptyState title={emptyText} className="py-10" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={grid} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: ink, fontSize: 12 }} dy={6} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: ink, fontSize: 12 }} />
              <Tooltip cursor={{ fill: grid }} contentStyle={tooltipStyle} />
              <Bar dataKey="count" name={title} fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={28}>
                <LabelList dataKey="count" position="top" style={{ fill: ink, fontSize: 11 }} formatter={(v) => (v > 0 ? v : '')} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function ListCard({ title, children }) {
  return (
    <Card>
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">{children}</CardContent>
    </Card>
  );
}

const AnalyticsDashboard = () => {
  const { isDark } = useTheme();
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [totals, setTotals] = useState({ propertyViews: 0, pageViews: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        analyticsService.trackCustomEvent('admin_dashboard_viewed', { section: 'analytics' });
        const [usersSnap, listingsSnap, propertyViews, pageViews] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'listings')),
          getTotalViews().catch(() => 0),
          getTotalPageViews().catch(() => 0),
        ]);
        setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setListings(listingsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setTotals({ propertyViews: Number(propertyViews) || 0, pageViews: Number(pageViews) || 0 });
      } catch (err) {
        console.error('AnalyticsDashboard failed to load stats:', err);
        setError(err?.message || 'Could not load analytics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const since = new Date(Date.now() - RANGE_DAYS[timeRange] * 86400000);
    const inRange = (item) => { const d = toDate(item.createdAt); return d && d >= since; };
    const statusOf = (p) => String(p.status || '').toLowerCase();
    const views = listings.reduce((sum, p) => sum + Number(p.views || p.viewsCount || 0), 0);
    return {
      totalUsers: users.length,
      totalListings: listings.length,
      activeListings: listings.filter((p) => ACTIVE_STATUSES.has(statusOf(p))).length,
      pendingListings: listings.filter((p) => statusOf(p) === 'pending').length,
      featuredListings: listings.filter((p) => !!p.featured || !!p.is_featured).length,
      newUsers: users.filter(inRange).length,
      newListings: listings.filter(inRange).length,
      listingViews: totals.propertyViews || views,
      pageViews: totals.pageViews,
      listingsByMonth: countByMonth(listings),
      usersByMonth: countByMonth(users),
      topListings: [...listings]
        .map((p) => ({ ...p, _views: Number(p.views || p.viewsCount || 0) }))
        .sort((a, b) => b._views - a._views)
        .slice(0, 5),
      recent: [
        ...users.map((u) => ({ kind: 'user', label: u.email || u.name || 'New user', at: toDate(u.createdAt) })),
        ...listings.map((p) => ({ kind: 'listing', label: p.title || p.id, at: toDate(p.createdAt) })),
      ]
        .filter((e) => e.at)
        .sort((a, b) => b.at - a.at)
        .slice(0, 8),
    };
  }, [users, listings, totals, timeRange]);

  const rangeLabel = RANGE_LABEL[timeRange];

  return (
    <>
      <PageHeader title="Analytics" description="Counted from your Firestore data. Nothing here is estimated.">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]" aria-label="Time range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <StatGrid
        loading={loading}
        items={[
          { label: 'Users', value: stats.totalUsers, note: `${stats.newUsers.toLocaleString()} joined in the ${rangeLabel}`, icon: Users },
          { label: 'Listings', value: stats.totalListings, note: `${stats.newListings.toLocaleString()} added in the ${rangeLabel}`, icon: Home },
          { label: 'Listing views', value: stats.listingViews, note: 'Opens of a listing page, all time', icon: Eye },
          { label: 'Page views', value: stats.pageViews, note: 'Tracked site pages, all time', icon: Activity },
        ]}
      />

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 rounded-lg" />
          <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm">Listing status</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <dl className="grid grid-cols-3 gap-4">
                {[
                  ['Active', stats.activeListings],
                  ['Pending review', stats.pendingListings],
                  ['Featured', stats.featuredListings],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value.toLocaleString()}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
            <ChartCard title="Listings added" subtitle="Per month, last six months" data={stats.listingsByMonth} emptyText="No listings added in the last six months." isDark={isDark} />
            <ChartCard title="Users joined" subtitle="Per month, last six months" data={stats.usersByMonth} emptyText="No sign-ups in the last six months." isDark={isDark} />
          </div>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
            <ListCard title="Most viewed listings">
              {stats.topListings.length === 0 ? (
                <EmptyState title="No listings yet." className="py-6" />
              ) : (
                <ol className="divide-y divide-border">
                  {stats.topListings.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 py-3">
                      <span className="w-5 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                      <img
                        src={getPropertyImage(p)}
                        alt=""
                        loading="lazy"
                        onError={(e) => handleImageError(e, null, p)}
                        className="h-11 w-14 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{p.title || p.id}</p>
                        <p className="text-xs text-muted-foreground">{formatKsh(p.price)}</p>
                      </div>
                      <p className="text-sm tabular-nums text-foreground">
                        {p._views.toLocaleString()} <span className="text-xs text-muted-foreground">views</span>
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </ListCard>

            <ListCard title="Recent activity">
              {stats.recent.length === 0 ? (
                <EmptyState title="Nothing recorded yet." className="py-6" />
              ) : (
                <ul className="divide-y divide-border">
                  {stats.recent.map((e, i) => (
                    <li key={i} className="flex items-center gap-3 py-3">
                      {e.kind === 'user'
                        ? <Users className="h-4 w-4 shrink-0 text-primary" />
                        : <Home className="h-4 w-4 shrink-0 text-primary" />}
                      <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {e.kind === 'user' ? 'New user' : 'New listing'}: <span className="text-muted-foreground">{e.label}</span>
                      </p>
                      <p className="whitespace-nowrap text-xs text-muted-foreground">{formatWhen(e.at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </ListCard>
          </div>
        </>
      )}
    </>
  );
};

export default AnalyticsDashboard;
