import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { accountDashboardAPI, propertiesAPI } from '../../lib/firebaseAPI';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList
} from 'recharts';
import {
  Home,
  MessageCircle,
  Settings,
  Plus,
  Eye,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  Building2,
  Users as UsersIcon,
  MapPin,
  Star,
  Phone,
  Mail,
  Clock,
  Edit,
  Trash2,
  BarChart3,
  Activity,
  Loader2
} from 'lucide-react';
import { DashboardLoader } from '../../components/Preloader';

// Quiet stat tile: label, big tabular number, one line of context. No icon box.
const StatCard = ({ label, value, note, icon: Icon }) => {
  const { isDark } = useTheme();
  return (
    <div className={`p-4 md:p-5 rounded-2xl border ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{label}</p>
        {Icon && <Icon className={`w-4 h-4 ${isDark ? 'text-white/30' : 'text-gray-300'}`} />}
      </div>
      <p className={`mt-3 text-3xl md:text-4xl font-semibold tabular-nums leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {Number(value || 0).toLocaleString()}
      </p>
      {note && <p className={`mt-2 text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{note}</p>}
    </div>
  );
};

// Chart frame with title, optional legend and an honest empty state.
const ChartCard = ({ title, subtitle, legend, empty, emptyText, children }) => {
  const { isDark } = useTheme();
  return (
    <div className={`p-4 md:p-5 rounded-2xl border ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          {subtitle && <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{subtitle}</p>}
        </div>
        {legend && legend.length > 1 && (
          <ul className="flex items-center gap-4">
            {legend.map((l) => (
              <li key={l.label} className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                {l.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {empty ? (
        <p className={`text-sm py-10 text-center ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{emptyText}</p>
      ) : children}
    </div>
  );
};

const AgentDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, isVerifiedAgent } = useAuth();
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [agentStats, setAgentStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    totalViews: 0,
    totalInquiries: 0,
    totalBookings: 0
  });
  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Real analytics, derived from the agent's own listings, inquiries and bookings ──
  const toDate = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

  // Views per listing, top 6, for the "Views by listing" chart
  const viewsByListing = useMemo(() => (
    [...properties]
      .map((p) => ({ name: (p.title || 'Untitled').slice(0, 28), views: Number(p.views || p.viewsCount || 0) }))
      .filter((d) => d.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 6)
  ), [properties]);

  // Inquiries and viewing requests per month for the last six months
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

  // Get section from URL params or default to overview
  const sectionFromUrl = searchParams.get('section');

  useEffect(() => {
    if (sectionFromUrl) {
      setActiveSection(sectionFromUrl);
    }
  }, [sectionFromUrl]);

  // Update URL when section changes
  useEffect(() => {
    if (activeSection !== sectionFromUrl) {
      setSearchParams({ section: activeSection });
    }
  }, [activeSection, sectionFromUrl, setSearchParams]);

  // Load agent data from Firebase
  useEffect(() => {
    console.log('AgentDashboard: useEffect triggered, currentUser:', currentUser);

    const loadAgentData = async () => {
      console.log('AgentDashboard: loadAgentData called, currentUser:', currentUser);

      if (!currentUser?.id) {
        console.log('AgentDashboard: No currentUser.id, returning early');
        return;
      }

      console.log('AgentDashboard: Loading data for user:', currentUser.id);
      setIsLoading(true);
      try {
        // Parallelize data fetching to improve performance
        const [userProperties, agentInquiries, agentBookings] = await Promise.all([
          accountDashboardAPI.getUserProperties(currentUser.id).catch(err => {
            console.error('Error fetching properties:', err);
            return [];
          }),
          accountDashboardAPI.getAgentInquiries(currentUser.id).catch(err => {
            console.error('Error fetching inquiries:', err);
            return [];
          }),
          accountDashboardAPI.getAgentBookings(currentUser.id).catch(err => {
            console.error('Error fetching bookings:', err);
            return [];
          })
        ]);

        setProperties(userProperties);
        setInquiries(agentInquiries);
        setBookings(agentBookings || []);

        setAgentStats({
          totalProperties: userProperties.length,
          activeListings: userProperties.filter((p) => String(p.status || 'active').toLowerCase() === 'active').length,
          totalViews: userProperties.reduce((sum, p) => sum + Number(p.views || p.viewsCount || 0), 0),
          totalInquiries: agentInquiries.length,
          totalBookings: (agentBookings || []).length
        });
      } catch (error) {
        console.error('Error loading agent data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentData();
  }, [currentUser]);

  const sections = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      description: 'Dashboard summary and analytics'
    },
    {
      id: 'properties',
      label: 'My Properties',
      icon: Building2,
      description: 'Manage your listings'
    },
    {
      id: 'inquiries',
      label: 'Inquiries',
      icon: MessageCircle,
      description: 'Client messages and leads'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Performance metrics'
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Calendar,
      description: 'Viewing requests'
    }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'properties':
        return <PropertiesSection />;
      case 'inquiries':
        return <InquiriesSection />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'bookings':
        return <BookingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  // Overview Section Component
  const OverviewSection = () => (
    <div className="space-y-6">

      {/* Stats — real counts only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Active listings', value: agentStats.activeListings, note: `${agentStats.totalProperties} total`, icon: Building2 },
          { label: 'Views', value: agentStats.totalViews, note: 'across your listings', icon: Eye },
          { label: 'Inquiries', value: agentStats.totalInquiries, note: `${inquiries.filter((i) => (i.status || 'new') === 'new').length} new`, icon: MessageCircle },
          { label: 'Viewing requests', value: agentStats.totalBookings, note: `${bookings.filter((b) => (b.status || 'pending') === 'pending').length} pending`, icon: Calendar },
        ].map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200'} shadow-sm`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/properties/add')}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#111] hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add New Property</span>
          </button>

          <button
            onClick={() => setActiveSection('inquiries')}
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">View Inquiries</span>
          </button>

          <button
            onClick={() => setActiveSection('analytics')}
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Properties Section Component
  const PropertiesSection = () => (
    <div className="space-y-6">
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">My Properties</h2>
          <button
            onClick={() => navigate('/properties/add')}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#111] rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Properties Listed</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start listing your properties to reach potential clients
            </p>
            <button
              onClick={() => navigate('/properties/add')}
              className="px-6 py-3 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#111] rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Add Your First Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-4 overflow-hidden">
                  {property.images && property.images[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{property.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{property.location?.address || 'Location not specified'}</p>
                <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1">
                  <span className={`font-bold ${isDark ? 'text-[#fbbf24]' : 'text-gray-900'}`}>KES {property.price?.toLocaleString() || '0'}</span>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{property.bedrooms || 0} beds</span>
                    <span>•</span>
                    <span>{property.bathrooms || 0} baths</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/properties/add?edit=${property.id}`)}
                    className="flex-1 px-3 py-2 min-h-[40px] text-xs bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#111] rounded-lg font-medium hover:shadow-md transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/property/${property.id}`)}
                    className="flex-1 px-3 py-2 min-h-[40px] text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setPropertyToDelete(property)}
                    className="px-3 py-2 min-h-[40px] text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50"
                    title="Delete Property"
                  >
                    <Trash2 className="w-3.5 h-3.5 inline" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {propertyToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Property</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete &quot;{propertyToDelete.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!propertyToDelete?.id) return;
                  setDeleting(true);
                  try {
                    await propertiesAPI.delete(propertyToDelete.id);
                    setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));
                    setPropertyToDelete(null);
                  } catch (err) {
                    console.error('Error deleting property:', err);
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 min-h-[44px] bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Delete'}
              </button>
              <button
                onClick={() => setPropertyToDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 min-h-[44px] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Inquiries Section Component
  const InquiriesSection = () => (
    <div className="space-y-6">
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Inquiries</h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">{inquiries.length} total inquiries</span>
        </div>

        {inquiries.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Inquiries Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Client inquiries from your property listings will appear here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Start listing properties to receive inquiries from potential clients
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white break-words">
                      {inquiry.client?.name || inquiry.clientName || 'Anonymous Client'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                      {inquiry.client?.email || inquiry.clientEmail || 'No email provided'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full ${inquiry.status === 'new' ? 'bg-amber-100 text-amber-800' :
                        inquiry.status === 'active' ? 'bg-gray-100 text-gray-800' :
                          inquiry.status === 'responded' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                      }`}>
                      {inquiry.status || 'new'}
                    </span>
                    {inquiry.source && (
                      <span className="text-xs text-gray-500">
                        Via {inquiry.source}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {inquiry.lastMessage || inquiry.message || 'No message provided'}
                </p>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs text-gray-500 mb-3">
                  <span className="break-words">Property: {inquiry.property?.title || inquiry.propertyTitle || 'Unknown Property'}</span>
                  <span>{inquiry.updatedAt?.toDate?.()?.toLocaleDateString() || inquiry.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      if (inquiry.conversationId) {
                        // Navigate to messages page with the conversation
                        navigate(`/messages?conversation=${inquiry.conversationId}`);
                      }
                    }}
                    className="flex-1 px-3 py-2 min-h-[40px] text-xs bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#111] rounded-lg font-medium hover:shadow-md transition-all"
                  >
                    {inquiry.conversationId ? 'View Chat' : 'Reply'}
                  </button>
                  <button className="flex-1 px-3 py-2 min-h-[40px] text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium">
                    Mark Read
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Bookings Section Component
  const BookingsSection = () => (
    <div className="space-y-6">
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Viewing Requests</h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">{bookings.length} total requests</span>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Bookings Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Viewing requests from potential clients will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/15 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-[#f59e0b]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {booking.userName || 'Anonymous Client'}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{booking.viewingDate} at {booking.viewingTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                          <Home className="w-3.5 h-3.5" />
                          <span className="break-words">{booking.propertyTitle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:self-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'confirmed' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status || 'pending'}
                    </span>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="flex-1 min-w-[120px] px-3 py-2 min-h-[40px] text-xs bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#111] rounded-lg font-medium hover:shadow-md transition-all">
                    Confirm Viewing
                  </button>
                  <button className="flex-1 min-w-[120px] px-3 py-2 min-h-[40px] text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    Reschedule
                  </button>
                  <button className="px-3 py-2 min-h-[40px] text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Analytics Section — everything here is computed from real records
  const AnalyticsSection = () => {
    const ink = isDark ? '#a3a3a3' : '#6b6b6b';
    const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const tooltipStyle = {
      backgroundColor: isDark ? '#111111' : '#ffffff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
      borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      color: isDark ? '#f2f2f2' : '#111111',
      fontSize: 13,
    };

    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={`text-xl md:text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Analytics</h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Counted from your listings, inquiries and viewing requests. Nothing here is estimated.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ChartCard
            title="Views by listing"
            subtitle="Your six most viewed listings"
            empty={viewsByListing.length === 0}
            emptyText="No views recorded yet. A view is counted each time someone opens one of your listings."
          >
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

          <ChartCard
            title="Inquiries and viewing requests"
            subtitle="Last six months"
            legend={[{ label: 'Inquiries', color: '#fbbf24' }, { label: 'Viewing requests', color: isDark ? '#e5e5e5' : '#303030' }]}
            empty={!hasActivity}
            emptyText="No inquiries or viewing requests in the last six months."
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityByMonth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke={grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: ink, fontSize: 12 }} dy={6} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: ink, fontSize: 12 }} />
                <Tooltip cursor={{ fill: grid }} contentStyle={tooltipStyle} />
                <Bar dataKey="inquiries" name="Inquiries" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="bookings" name="Viewing requests" fill={isDark ? '#e5e5e5' : '#303030'} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <DashboardLoader text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-20 overflow-x-hidden ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Agent Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your properties and track your performance
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm md:text-base font-medium transition-all ${activeSection === section.id
                    ? 'bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#111] shadow-lg shadow-[#fbbf24]/20'
                    : `${isDark ? 'bg-[#111111] border border-white/10 text-gray-300 hover:border-[#fbbf24]/40 hover:text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#fbbf24]/60 hover:text-gray-900'}`
                  }`}
              >
                <section.icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
