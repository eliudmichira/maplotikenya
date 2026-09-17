import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import analyticsService from '../../../lib/analytics';
import { getTotalViews } from '../../../lib/propertyViews';
import { getTotalPageViews } from '../../../lib/pageViews';
import { getPropertyImage, handleImageError } from '../../../utils/imageUtils';
import { DashboardLoader } from '../../../components/Preloader';
import { useTheme } from '../../../context/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { Users, Home, Eye, Activity } from 'lucide-react';

// Every number on this screen is counted from Firestore. Nothing is estimated,
// so anything that cannot be measured yet (sessions, bounce rate, retention)
// is simply not shown.

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
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

const formatKsh = (n) => `Ksh ${Number(n || 0).toLocaleString()}`;
const formatWhen = (d) => (d ? d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'date unknown');

const AnalyticsDashboard = () => {
  const { isDark } = useTheme();
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [totals, setTotals] = useState({ propertyViews: 0, pageViews: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
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
      } catch (error) {
        console.error('AnalyticsDashboard failed to load stats:', error);
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

  const ink = isDark ? '#a3a3a3' : '#6b6b6b';
  const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const tooltipStyle = {
    backgroundColor: isDark ? '#111111' : '#ffffff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 10,
    color: isDark ? '#f2f2f2' : '#111111',
    fontSize: 13,
  };
  const card = `rounded-2xl border ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200'}`;
  const muted = isDark ? 'text-white/50' : 'text-gray-500';
  const faint = isDark ? 'text-white/35' : 'text-gray-400';
  const strong = isDark ? 'text-white' : 'text-gray-900';

  const Stat = ({ label, value, note, icon: Icon }) => (
    <div className={`${card} p-4 md:p-5`}>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${muted}`}>{label}</p>
        {Icon && <Icon className={`w-4 h-4 ${faint}`} />}
      </div>
      <p className={`mt-3 text-3xl md:text-4xl font-semibold tabular-nums leading-none ${strong}`}>{Number(value || 0).toLocaleString()}</p>
      {note && <p className={`mt-2 text-xs ${faint}`}>{note}</p>}
    </div>
  );

  const ChartCard = ({ title, subtitle, data, empty, emptyText }) => (
    <div className={`${card} p-4 md:p-5`}>
      <h3 className={`text-sm font-semibold ${strong}`}>{title}</h3>
      <p className={`text-xs mt-0.5 mb-4 ${faint}`}>{subtitle}</p>
      {empty ? (
        <p className={`text-sm py-10 text-center ${faint}`}>{emptyText}</p>
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
    </div>
  );

  if (loading) return <DashboardLoader text="Loading analytics" />;

  const rangeLabel = { '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days', '1y': 'last year' }[timeRange];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={`text-xl md:text-2xl font-semibold ${strong}`}>Analytics</h2>
          <p className={`text-sm mt-1 ${muted}`}>Counted from your Firestore data. Nothing here is estimated.</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className={`min-h-[44px] px-3 rounded-xl text-sm border ${isDark ? 'bg-[#111111] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* All-time totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat label="Users" value={stats.totalUsers} note={`${stats.newUsers} joined in the ${rangeLabel}`} icon={Users} />
        <Stat label="Listings" value={stats.totalListings} note={`${stats.newListings} added in the ${rangeLabel}`} icon={Home} />
        <Stat label="Listing views" value={stats.listingViews} note="opens of a listing page, all time" icon={Eye} />
        <Stat label="Page views" value={stats.pageViews} note="tracked site pages, all time" icon={Activity} />
      </div>

      {/* Listing state */}
      <div className={`${card} p-4 md:p-5`}>
        <h3 className={`text-sm font-semibold mb-3 ${strong}`}>Listing status</h3>
        <dl className="grid grid-cols-3 gap-4">
          {[
            ['Active', stats.activeListings],
            ['Pending review', stats.pendingListings],
            ['Featured', stats.featuredListings],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className={`text-xs ${muted}`}>{label}</dt>
              <dd className={`text-2xl font-semibold tabular-nums ${strong}`}>{value.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Growth, from real createdAt timestamps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ChartCard title="Listings added" subtitle="Per month, last six months" data={stats.listingsByMonth} empty={!stats.listingsByMonth.some((b) => b.count)} emptyText="No listings added in the last six months." />
        <ChartCard title="Users joined" subtitle="Per month, last six months" data={stats.usersByMonth} empty={!stats.usersByMonth.some((b) => b.count)} emptyText="No sign-ups in the last six months." />
      </div>

      {/* Top listings and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className={`${card} p-4 md:p-5`}>
          <h3 className={`text-sm font-semibold mb-3 ${strong}`}>Most viewed listings</h3>
          {stats.topListings.length === 0 ? (
            <p className={`text-sm py-6 text-center ${faint}`}>No listings yet.</p>
          ) : (
            <ol className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
              {stats.topListings.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <span className={`w-5 text-xs tabular-nums ${faint}`}>{i + 1}</span>
                  <img
                    src={getPropertyImage(p)}
                    alt=""
                    loading="lazy"
                    onError={(e) => handleImageError(e, null, p)}
                    className="w-14 h-11 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${strong}`}>{p.title || p.id}</p>
                    <p className={`text-xs ${muted}`}>{formatKsh(p.price)}</p>
                  </div>
                  <p className={`text-sm tabular-nums ${strong}`}>{p._views.toLocaleString()} <span className={`text-xs ${faint}`}>views</span></p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className={`${card} p-4 md:p-5`}>
          <h3 className={`text-sm font-semibold mb-3 ${strong}`}>Recent activity</h3>
          {stats.recent.length === 0 ? (
            <p className={`text-sm py-6 text-center ${faint}`}>Nothing recorded yet.</p>
          ) : (
            <ul className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
              {stats.recent.map((e, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  {e.kind === 'user'
                    ? <Users className="w-4 h-4 text-[#fbbf24] flex-shrink-0" />
                    : <Home className="w-4 h-4 text-[#fbbf24] flex-shrink-0" />}
                  <p className={`text-sm truncate flex-1 ${strong}`}>
                    {e.kind === 'user' ? 'New user' : 'New listing'}: <span className={muted}>{e.label}</span>
                  </p>
                  <p className={`text-xs whitespace-nowrap ${faint}`}>{formatWhen(e.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
