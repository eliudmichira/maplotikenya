import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, MessageCircle, Phone, ExternalLink, Copy, Check, Search,
  RefreshCw, Play, MapPin, Calendar, Lock, Shield, Trash2, ArrowUpRight,
  Filter, Building2, Flame, AlertCircle, CheckCircle2, Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatGrid, EmptyState, SectionHeader, Toolbar } from '@/components/admin/primitives';

const DEFAULT_API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://maploti-lead-engine-689776477151.europe-west1.run.app/api';

const API_BASE = import.meta.env.VITE_LEADS_API_URL || DEFAULT_API;

export default function LeadsSection() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, rentCount: 0, buyCount: 0, videoToursCount: 0 });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [intentFilter, setIntentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Fetch leads from engine
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/leads`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reach Lead Engine`);
      const data = await res.json();
      setLeads(data.leads || []);
      setStats(data.stats || { total: 0, rentCount: 0, buyCount: 0, videoToursCount: 0 });
    } catch (err) {
      console.warn('[LeadsSection] Backend unreachable:', err.message);
      setError('Could not connect to the WhatsApp Lead Engine on http://localhost:3000. Ensure the OpenWA lead service is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Trigger on-demand history scan of the WhatsApp group
  const triggerScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(`${API_BASE}/leads/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 25 }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchLeads();
      }
    } catch (err) {
      console.error('[LeadsSection] Scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  // Update lead lifecycle status
  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`${API_BASE}/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  // Delete lead
  const deleteLead = async (id) => {
    if (!window.confirm('Delete this property lead?')) return;
    try {
      await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' });
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Copy pre-drafted pitch
  const copyPitch = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtering
  const filteredLeads = useMemo(() => {
    let result = [...leads];
    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter);
    }
    if (intentFilter !== 'all') {
      result = result.filter((l) => (l.analysis?.intent || 'rent').toLowerCase() === intentFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((l) => {
        const hay = [
          l.contact?.formattedPhone,
          l.contact?.phone,
          l.analysis?.location,
          l.analysis?.property_type,
          l.analysis?.budget,
          l.rawMessage,
          l.analysis?.summary,
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    return result;
  }, [leads, statusFilter, intentFilter, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="WhatsApp Property Leads Radar"
        description="Live buyer and tenant requests detected from WhatsApp property groups, automatically matched with video tours and listings everywhere."
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={triggerScan}
            disabled={scanning}
            className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning Messages...' : 'Scan Group History'}
          </Button>
          <Button size="sm" variant="outline" onClick={fetchLeads} disabled={loading}>
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Backend Offline Warning Banner */}
      {error && (
        <div className="rounded-lg border border-white/15 bg-white/10 p-4 text-sm text-white flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Lead Engine Offline</p>
            <p className="text-xs text-white/80 mt-1">{error}</p>
          </div>
          <Button size="sm" variant="outline" className="border-white/15 text-white hover:bg-white/10" onClick={fetchLeads}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <StatGrid
        loading={loading}
        items={[
          { label: 'Total Leads Found', value: stats.total || leads.length, note: 'AI-verified requests', icon: Sparkles },
          { label: 'Rental Inquiries', value: stats.rentCount || 0, note: 'Active tenants seeking homes', icon: Building2 },
          { label: 'Buying / Land', value: stats.buyCount || 0, note: 'Prospective buyers & plot seekers', icon: Flame },
          { label: 'Video Tours Matched', value: stats.videoToursCount || 0, note: 'YouTube & TikTok walkthroughs', icon: Video },
        ]}
      />

      {/* Controls & Search Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search location (e.g. Kilimani), phone, or budget..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tabs */}
            <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
              {['all', 'new', 'contacted', 'converted'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    statusFilter === st
                      ? 'bg-white text-black shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st === 'all' ? 'All' : st === 'new' ? '🟡 New' : st === 'contacted' ? '🔵 Contacted' : '🟢 Converted'}
                </button>
              ))}
            </div>

            {/* Intent Tabs */}
            <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
              {[
                { id: 'all', label: 'All Types' },
                { id: 'rent', label: 'Rent' },
                { id: 'buy', label: 'Buy / Land' },
              ].map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setIntentFilter(it.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    intentFilter === it.id
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Leads List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card>
          <EmptyState
            icon={Sparkles}
            title={search ? 'No leads match your search' : 'No property leads captured yet'}
            description={
              search
                ? 'Try searching a different location or keyword.'
                : 'Click "Scan Group History" above to discover property inquiries from your monitored WhatsApp groups.'
            }
            action={
              <Button size="sm" onClick={triggerScan} disabled={scanning} className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold">
                <RefreshCw className={`mr-2 h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
                Scan Group History
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => {
            const analysis = lead.analysis || {};
            const contact = lead.contact || {};
            const isLid = contact.isLid || (lead.sender && lead.sender.includes('@lid'));
            const matches = lead.searchResults || [];
            const clickToChatUrl = contact.clickToChatUrl || (contact.phone ? `https://wa.me/${contact.phone}` : null);
            const dateStr = lead.createdAt ? new Date(lead.createdAt).toLocaleString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'Recently';

            return (
              <Card key={lead.id} className="overflow-hidden border border-border/80 shadow-sm transition-all hover:border-white/15">
                <CardHeader className="p-4 md:p-5 border-b border-border/60 bg-muted/20">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                        isLid ? 'bg-muted text-muted-foreground' : 'bg-white/10 text-white'
                      }`}>
                        {isLid ? <Lock className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm md:text-base">
                            {contact.formattedPhone || (isLid ? 'Hidden by WhatsApp Privacy' : lead.sender)}
                          </span>
                          {isLid && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-muted/60">
                              Privacy LID
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          Group: {lead.chatId || 'Property Group'} · {dateStr}
                        </p>
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <select
                        value={lead.status || 'new'}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="new">🟡 New Lead</option>
                        <option value="contacted">🔵 Contacted</option>
                        <option value="converted">🟢 Converted / Deal</option>
                        <option value="archived">⚪ Archived</option>
                      </select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteLead(lead.id)}
                        title="Delete lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 md:p-5 space-y-4">
                  {/* Extracted Criteria Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={analysis.intent === 'buy' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'}>
                      {(analysis.intent || 'rent').toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="font-semibold uppercase text-xs">
                      🏠 {analysis.property_type || 'Property'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      📍 {analysis.location || 'Kenya'}
                    </Badge>
                    {analysis.budget && analysis.budget !== 'Flexible' && (
                      <Badge variant="outline" className="bg-white/10 text-zinc-300 dark:text-white border-white/15 text-xs">
                        💰 {analysis.budget}
                      </Badge>
                    )}
                    {analysis.bedrooms && (
                      <Badge variant="outline" className="text-xs">
                        🛏️ {analysis.bedrooms} BR
                      </Badge>
                    )}
                  </div>

                  {/* Quoted Client Message */}
                  <div className="rounded-lg bg-muted/40 p-3.5 border-l-4 border-white/30 text-sm text-foreground/90 italic leading-relaxed">
                    "{lead.rawMessage}"
                  </div>

                  {/* Matched Listings & Video Tours Everywhere */}
                  {matches.length > 0 && (
                    <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/80 dark:text-white flex items-center gap-1.5">
                          <Video className="h-3.5 w-3.5" />
                          Properties & Video Tours Found Everywhere ({matches.length})
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {matches.slice(0, 3).map((item, idx) => {
                          const isYoutube = (item.sourceBadge || '').includes('YouTube') || item.link.includes('youtube');
                          const isTiktok = (item.sourceBadge || '').includes('TikTok') || item.link.includes('tiktok');
                          return (
                            <a
                              key={idx}
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-col justify-between rounded-md border border-border/60 bg-background p-2.5 transition-colors hover:border-white/15 hover:bg-muted/30"
                            >
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  {isYoutube ? (
                                    <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-[10px] py-0 px-1.5">
                                      🎬 YouTube Tour
                                    </Badge>
                                  ) : isTiktok ? (
                                    <Badge className="bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30 text-[10px] py-0 px-1.5">
                                      📱 TikTok Video
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-blue-500 border-blue-500/30">
                                      🌐 Web Listing
                                    </Badge>
                                  )}
                                  {item.price && (
                                    <span className="ml-auto text-xs font-bold font-mono text-white/80 dark:text-white">
                                      {item.price}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-white">
                                  {item.title}
                                </p>
                              </div>
                              <span className="mt-2 inline-flex items-center text-[11px] text-muted-foreground group-hover:text-foreground">
                                Open tour <ArrowUpRight className="ml-0.5 h-3 w-3" />
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions & Pitch Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {clickToChatUrl ? (
                        <Button
                          size="sm"
                          asChild
                          className="bg-[#25D366] text-black font-bold hover:bg-[#20BA5A] transition-transform active:scale-95"
                        >
                          <a href={clickToChatUrl} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="mr-1.5 h-4 w-4" />
                            Message Client on WhatsApp
                          </a>
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-md">
                          <Lock className="h-3.5 w-3.5 text-white" />
                          <span>Phone is private LID. Reply directly in WhatsApp group chat.</span>
                        </div>
                      )}

                      {contact.phone && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`tel:${contact.phone}`}>
                            <Phone className="mr-1.5 h-3.5 w-3.5" />
                            Call
                          </a>
                        </Button>
                      )}

                      {lead.generatedReply && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyPitch(lead.id, lead.generatedReply)}
                          className="text-xs"
                        >
                          {copiedId === lead.id ? (
                            <>
                              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                              Copied Pitch!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                              Copy Pitch
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
