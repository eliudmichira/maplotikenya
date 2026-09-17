import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { usersAPI, storageAPI } from '../../../lib/firebaseAPI';
import { Camera, Loader2, BadgeCheck, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PageHeader, formatDate } from '@/components/admin/primitives';

// Profile for both agents and home-seekers. Everything here writes to the
// user's own Firestore document (users/{uid}) or, for agents, their agent
// profile (agents/{uid}). Nothing is stored in localStorage.

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function Field({ id, label, hint, children }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Notice({ tone = 'muted', children }) {
  if (!children) return null;
  const cls = tone === 'error' ? 'text-destructive' : tone === 'success' ? 'text-success' : 'text-muted-foreground';
  return <p className={`text-sm ${cls}`}>{children}</p>;
}

export default function ProfileSection({ role = 'user' }) {
  const { currentUser, updateProfile, isVerifiedAgent, verificationStatus } = useAuth();
  const uid = currentUser?.id;
  const fileRef = useRef(null);

  // ── account ──
  const [form, setForm] = useState({ name: '', phone: '', location: '', bio: '' });
  const [saved, setSaved] = useState(form);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ tone: 'muted', text: '' });

  useEffect(() => {
    if (!currentUser) return;
    const next = {
      name: currentUser.name || currentUser.displayName || '',
      phone: currentUser.phone || currentUser.phoneNumber || '',
      location: currentUser.location || currentUser.city || '',
      bio: currentUser.bio || '',
    };
    setForm(next);
    setSaved(next);
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const saveAccount = async () => {
    if (!uid || !dirty) return;
    setSaving(true);
    setMsg({ tone: 'muted', text: '' });
    try {
      const data = { name: form.name.trim(), phone: form.phone.trim(), location: form.location.trim(), bio: form.bio.trim() };
      await usersAPI.updateProfile(uid, data);
      await updateProfile?.(data);
      setSaved(form);
      setMsg({ tone: 'success', text: 'Profile saved.' });
    } catch (e) {
      setMsg({ tone: 'error', text: `Could not save. ${e.message || ''}` });
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uid) return;
    if (!file.type.startsWith('image/')) { setMsg({ tone: 'error', text: 'Please choose an image file.' }); return; }
    if (file.size > MAX_AVATAR_BYTES) { setMsg({ tone: 'error', text: 'Photos must be under 5 MB.' }); return; }
    setUploading(true);
    setMsg({ tone: 'muted', text: '' });
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const url = await storageAPI.uploadImage(file, `users/${uid}/avatar-${Date.now()}.${ext}`);
      await usersAPI.updateProfile(uid, { avatar: url, photoUrl: url });
      await updateProfile?.({ avatar: url, photoUrl: url });
      setMsg({ tone: 'success', text: 'Photo updated.' });
    } catch (err) {
      setMsg({ tone: 'error', text: err.message || 'Could not upload that photo.' });
    } finally {
      setUploading(false);
    }
  };

  // ── agent profile ──
  const isAgent = role === 'agent';
  const [agent, setAgent] = useState(null);
  const [agentForm, setAgentForm] = useState({ company: '', licenseNumber: '', phoneNumber: '', bio: '' });
  const [agentSaved, setAgentSaved] = useState(agentForm);
  const [agentSaving, setAgentSaving] = useState(false);
  const [agentMsg, setAgentMsg] = useState({ tone: 'muted', text: '' });

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getDoc(doc(db, 'agents', uid)).then((snap) => {
      if (cancelled) return;
      const data = snap.exists() ? snap.data() : null;
      setAgent(data);
      const next = {
        company: data?.company || '',
        licenseNumber: data?.licenseNumber || data?.license || '',
        phoneNumber: data?.phoneNumber || data?.phone || '',
        bio: data?.bio || '',
      };
      setAgentForm(next);
      setAgentSaved(next);
    }).catch(() => setAgent(null));
    return () => { cancelled = true; };
  }, [uid]);

  const agentDirty = JSON.stringify(agentForm) !== JSON.stringify(agentSaved);
  const setA = (k) => (e) => setAgentForm((f) => ({ ...f, [k]: e.target.value }));

  const saveAgent = async () => {
    if (!uid || !agentDirty) return;
    setAgentSaving(true);
    setAgentMsg({ tone: 'muted', text: '' });
    try {
      const data = {
        company: agentForm.company.trim(),
        licenseNumber: agentForm.licenseNumber.trim(),
        phoneNumber: agentForm.phoneNumber.trim(),
        bio: agentForm.bio.trim(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'agents', uid), data, { merge: true });
      setAgentSaved(agentForm);
      setAgentMsg({ tone: 'success', text: 'Agent details saved.' });
    } catch (e) {
      setAgentMsg({ tone: 'error', text: `Could not save. ${e.message || ''}` });
    } finally {
      setAgentSaving(false);
    }
  };

  const verified = !!(agent?.verified || isVerifiedAgent);
  const pending = !verified && (agent?.verificationRequested === true || verificationStatus === 'pending');

  // ── security ──
  const providers = (auth.currentUser?.providerData || []).map((p) => p.providerId);
  const hasPassword = providers.includes('password');
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ tone: 'muted', text: '' });

  const changePassword = async () => {
    setPwMsg({ tone: 'muted', text: '' });
    if (pw.next.length < 8) { setPwMsg({ tone: 'error', text: 'Use at least 8 characters.' }); return; }
    if (pw.next !== pw.confirm) { setPwMsg({ tone: 'error', text: 'The two passwords do not match.' }); return; }
    setPwSaving(true);
    try {
      await updatePassword(auth.currentUser, pw.next);
      setPw({ next: '', confirm: '' });
      setPwMsg({ tone: 'success', text: 'Password changed.' });
    } catch (e) {
      setPwMsg({
        tone: 'error',
        text: e.code === 'auth/requires-recent-login'
          ? 'For safety, sign out and sign in again before changing your password.'
          : (e.message || 'Could not change the password.'),
      });
    } finally {
      setPwSaving(false);
    }
  };

  const initials = (form.name || currentUser?.email || 'M').trim().charAt(0).toUpperCase();
  const avatar = currentUser?.avatar || currentUser?.photoUrl || currentUser?.photoURL || '';

  return (
    <>
      <PageHeader title="Profile" description="How you appear to other people on MaplotiKenya.">
        <Button size="sm" onClick={saveAccount} disabled={!dirty || saving}>
          {saving && <Loader2 className="animate-spin" />}
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </PageHeader>

      {/* Account */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm">Account</CardTitle>
          <CardDescription className="text-xs">Your name and contact details are shown on your listings and messages.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 pt-0 md:grid-cols-[auto_1fr] md:gap-8">
          <div className="flex flex-col items-center gap-3 md:w-40">
            <div className="relative">
              {avatar ? (
                <img src={avatar} alt="" className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">{initials}</div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Change photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-muted disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
            </div>
            <p className="text-center text-xs text-muted-foreground">JPG or PNG, under 5 MB</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Full name"><Input id="name" value={form.name} onChange={set('name')} placeholder="Your name" /></Field>
            <Field id="email" label="Email" hint="Sign-in email cannot be changed here."><Input id="email" value={currentUser?.email || ''} disabled /></Field>
            <Field id="phone" label="Phone"><Input id="phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+254 7xx xxx xxx" /></Field>
            <Field id="location" label="Location"><Input id="location" value={form.location} onChange={set('location')} placeholder="e.g. Kilimani, Nairobi" /></Field>
            <div className="sm:col-span-2">
              <Field id="bio" label="About you" hint={`${form.bio.length}/300`}>
                <Textarea id="bio" rows={3} maxLength={300} value={form.bio} onChange={set('bio')} placeholder="A sentence or two about what you are looking for or what you do." />
              </Field>
            </div>
          </div>
        </CardContent>
        {msg.text && <CardFooter className="p-5 pt-0"><Notice tone={msg.tone}>{msg.text}</Notice></CardFooter>}
      </Card>

      {/* Agent */}
      {isAgent || agent ? (
        <Card>
          <CardHeader className="p-5 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm">Agent details</CardTitle>
                <CardDescription className="text-xs">Shown on your listings so people know who they are dealing with.</CardDescription>
              </div>
              {verified ? (
                <Badge variant="success"><BadgeCheck className="mr-1 h-3.5 w-3.5" />Verified{agent?.verifiedAt ? ` · ${formatDate(agent.verifiedAt)}` : ''}</Badge>
              ) : pending ? (
                <Badge variant="warning"><Clock className="mr-1 h-3.5 w-3.5" />Pending review</Badge>
              ) : (
                <Badge variant="muted">Not verified</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 pt-0 sm:grid-cols-2">
            <Field id="company" label="Agency or company"><Input id="company" value={agentForm.company} onChange={setA('company')} placeholder="e.g. Maploti Realty" /></Field>
            <Field id="licence" label="Licence or ID number"><Input id="licence" value={agentForm.licenseNumber} onChange={setA('licenseNumber')} /></Field>
            <Field id="agentPhone" label="Business phone"><Input id="agentPhone" type="tel" value={agentForm.phoneNumber} onChange={setA('phoneNumber')} placeholder="+254 7xx xxx xxx" /></Field>
            <div className="sm:col-span-2">
              <Field id="agentBio" label="About your work" hint={`${agentForm.bio.length}/500`}>
                <Textarea id="agentBio" rows={3} maxLength={500} value={agentForm.bio} onChange={setA('bio')} placeholder="Areas you cover, the kind of homes you list, how long you have been doing this." />
              </Field>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 p-5 pt-0">
            <Notice tone={agentMsg.tone}>{agentMsg.text}</Notice>
            <Button size="sm" variant="outline" onClick={saveAgent} disabled={!agentDirty || agentSaving} className="ml-auto">
              {agentSaving && <Loader2 className="animate-spin" />}
              Save agent details
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Do you list homes?</p>
                <p className="text-xs text-muted-foreground">Apply for a verified agent badge to publish listings and receive inquiries.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild><Link to="/agent-verification">Become an agent</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* Security */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm">Security</CardTitle>
          <CardDescription className="text-xs">
            {hasPassword ? 'Change the password you sign in with.' : `You sign in with ${providers.includes('google.com') ? 'Google' : 'a linked account'}, so there is no password to change here.`}
          </CardDescription>
        </CardHeader>
        {hasPassword && (
          <>
            <CardContent className="grid gap-4 p-5 pt-0 sm:grid-cols-2">
              <Field id="pw1" label="New password"><Input id="pw1" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} /></Field>
              <Field id="pw2" label="Confirm new password"><Input id="pw2" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} /></Field>
            </CardContent>
            <Separator />
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 p-5">
              <Notice tone={pwMsg.tone}>{pwMsg.text}</Notice>
              <Button size="sm" variant="outline" onClick={changePassword} disabled={pwSaving || !pw.next} className="ml-auto">
                {pwSaving && <Loader2 className="animate-spin" />}
                Change password
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </>
  );
}
