import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Check, X, Search, UserCheck, Loader2, MoreHorizontal, Eye } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { agentVerificationAPI } from '../../../lib/firebaseAPI';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { PageHeader, StatGrid, Toolbar, EmptyState, formatDate } from '@/components/admin/primitives';

// Agent profiles live at agents/{uid}. An agent asks for verification from
// their dashboard (verificationRequested: true); an admin approves or
// declines here, which only flips `verified` on that document.

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'verified', label: 'Verified' },
  { id: 'unverified', label: 'Unverified' },
];

const requestedAt = (a) => a.verificationRequestedAt || a.createdAt;

function agentState(a) {
  if (a.verified === true) return { label: 'Verified', variant: 'success' };
  if (a.verificationRequested === true) return { label: 'Pending', variant: 'warning' };
  return { label: 'Unverified', variant: 'muted' };
}

const AgentVerification = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending');
  const [busyId, setBusyId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [declineNote, setDeclineNote] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const snap = await getDocs(query(collection(db, 'agents'), orderBy('createdAt', 'desc')));
      setAgents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error loading agents:', e);
      setError(e?.message || 'Could not load agents.');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const groups = useMemo(() => ({
    pending: agents.filter((a) => a.verificationRequested === true && a.verified !== true),
    verified: agents.filter((a) => a.verified === true),
    unverified: agents.filter((a) => a.verified !== true),
  }), [agents]);

  const rows = useMemo(() => {
    const base = groups[tab] || [];
    const s = search.trim().toLowerCase();
    if (!s) return base;
    return base.filter((a) =>
      [a.name, a.email, a.company, a.phoneNumber].some((v) => String(v || '').toLowerCase().includes(s))
    );
  }, [groups, tab, search]);

  const setVerified = async (agent, verified, note = '') => {
    try {
      setBusyId(agent.id);
      setError('');
      await agentVerificationAPI.updateVerificationStatus(agent.id, verified, note);
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, verified, adminNotes: note } : a)));
      setViewing(null);
      setDeclining(null);
      setDeclineNote('');
    } catch (e) {
      setError(e?.message || 'Could not update this agent.');
    } finally {
      setBusyId(null);
    }
  };

  const openDecline = (agent) => {
    setDeclineNote(agent.adminNotes || '');
    setDeclining(agent);
  };

  return (
    <>
      <PageHeader title="Agent verification" description="Approve agents who asked to be verified. Verified agents get a badge on their listings." />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <StatGrid
        loading={loading}
        columns={3}
        items={[
          { label: 'Awaiting review', value: groups.pending.length, note: 'Requests not yet decided' },
          { label: 'Verified', value: groups.verified.length, note: 'Agents with the badge' },
          { label: 'All agents', value: agents.length, note: 'Profiles in the agents collection' },
        ]}
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                  <span className="ml-1.5 tabular-nums text-muted-foreground">{groups[t.id].length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Toolbar>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, company"
                className="w-64 pl-8"
                aria-label="Search agents"
              />
            </div>
          </Toolbar>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title={search ? 'No agents match your search' : tab === 'pending' ? 'No requests waiting' : tab === 'verified' ? 'No verified agents yet' : 'No unverified agents'}
            description={tab === 'pending' && !search ? 'When an agent asks for verification from their dashboard it will show up here.' : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden sm:table-cell">Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[1%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => {
                const state = agentState(a);
                const busy = busyId === a.id;
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                          {String(a.name || a.email || '?').trim().charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{a.name || 'Unnamed agent'}</p>
                          <p className="truncate text-xs text-muted-foreground">{a.email || '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">{a.company || '—'}</TableCell>
                    <TableCell className="hidden text-sm tabular-nums lg:table-cell">{a.phoneNumber || '—'}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{formatDate(requestedAt(a))}</TableCell>
                    <TableCell><Badge variant={state.variant}>{state.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.verified !== true && (
                          <Button size="sm" onClick={() => setVerified(a, true)} disabled={busy} className="hidden sm:inline-flex">
                            {busy ? <Loader2 className="animate-spin" /> : <Check />}
                            Approve
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="More actions" disabled={busy}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setViewing(a)}><Eye />View details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {a.verified !== true && (
                              <DropdownMenuItem onSelect={() => setVerified(a, true)}><Check />Approve</DropdownMenuItem>
                            )}
                            {a.verified === true ? (
                              <DropdownMenuItem onSelect={() => openDecline(a)} className="text-destructive focus:text-destructive"><X />Remove verification</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onSelect={() => openDecline(a)} className="text-destructive focus:text-destructive"><X />Decline</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.name || 'Unnamed agent'}</DialogTitle>
                <DialogDescription>{viewing.email}</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd><Badge variant={agentState(viewing).variant}>{agentState(viewing).label}</Badge></dd>
                <dt className="text-muted-foreground">Company</dt>
                <dd>{viewing.company || '—'}</dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="tabular-nums">{viewing.phoneNumber || '—'}</dd>
                <dt className="text-muted-foreground">Licence</dt>
                <dd>{viewing.licenseNumber || viewing.license || '—'}</dd>
                <dt className="text-muted-foreground">Experience</dt>
                <dd>{viewing.experience ? `${viewing.experience} years` : '—'}</dd>
                <dt className="text-muted-foreground">Requested</dt>
                <dd>{formatDate(requestedAt(viewing))}</dd>
                <dt className="text-muted-foreground">Verified on</dt>
                <dd>{formatDate(viewing.verifiedAt)}</dd>
                {viewing.bio && (
                  <>
                    <dt className="text-muted-foreground">About</dt>
                    <dd className="whitespace-pre-wrap">{viewing.bio}</dd>
                  </>
                )}
                {viewing.adminNotes && (
                  <>
                    <dt className="text-muted-foreground">Admin note</dt>
                    <dd className="whitespace-pre-wrap">{viewing.adminNotes}</dd>
                  </>
                )}
              </dl>
              <DialogFooter>
                <Button variant="outline" onClick={() => openDecline(viewing)} disabled={busyId === viewing.id}>
                  <X />{viewing.verified ? 'Remove verification' : 'Decline'}
                </Button>
                {viewing.verified !== true && (
                  <Button onClick={() => setVerified(viewing, true)} disabled={busyId === viewing.id}>
                    {busyId === viewing.id ? <Loader2 className="animate-spin" /> : <Check />}
                    Approve
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Decline dialog with an optional note */}
      <Dialog open={!!declining} onOpenChange={(o) => !o && setDeclining(null)}>
        <DialogContent>
          {declining && (
            <>
              <DialogHeader>
                <DialogTitle>{declining.verified ? 'Remove verification' : 'Decline request'}</DialogTitle>
                <DialogDescription>
                  {declining.name || declining.email} will {declining.verified ? 'lose the verified badge' : 'stay unverified'}. You can leave a note for the record.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="decline-note">Note (optional)</Label>
                <Textarea id="decline-note" rows={3} value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} placeholder="Missing licence number, wrong company details…" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeclining(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => setVerified(declining, false, declineNote.trim())} disabled={busyId === declining.id}>
                  {busyId === declining.id ? <Loader2 className="animate-spin" /> : <X />}
                  {declining.verified ? 'Remove' : 'Decline'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgentVerification;
