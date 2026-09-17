import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/admin/primitives';

// Site settings live in Firestore at admin/settings under the `general` map.
// Only the fields below are edited here; saving merges so any other keys
// already stored on the document are left untouched.
const SETTINGS_REF = () => doc(db, 'admin', 'settings');

const EMPTY = {
  siteName: '',
  siteDescription: '',
  siteUrl: '',
  contactEmail: '',
  contactPhone: '',
};

const pick = (data) => Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data?.[k] ?? '']));
const same = (a, b) => Object.keys(EMPTY).every((k) => (a[k] ?? '') === (b[k] ?? ''));

const FIELDS = {
  identity: [
    { key: 'siteName', label: 'Site name', hint: 'Shown in the browser tab and in emails sent from the site.' },
    { key: 'siteUrl', label: 'Site URL', type: 'url', placeholder: 'https://', hint: 'The public address of the site.' },
    { key: 'siteDescription', label: 'Description', multiline: true, hint: 'One or two sentences describing the site.' },
  ],
  contact: [
    { key: 'contactEmail', label: 'Contact email', type: 'email', hint: 'Where enquiries from the site are sent.' },
    { key: 'contactPhone', label: 'Contact phone', type: 'tel', placeholder: '+254', hint: 'Public phone number for the site.' },
  ],
};

const SettingsPanel = () => {
  const [saved, setSaved] = useState(EMPTY);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(SETTINGS_REF());
        const general = pick(snap.exists() ? snap.data().general : null);
        setSaved(general);
        setForm(general);
      } catch (e) {
        setError('Could not load settings. ' + (e.message || ''));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!justSaved) return undefined;
    const t = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(t);
  }, [justSaved]);

  const dirty = !same(form, saved);

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setJustSaved(false);
  };

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setError('');
    try {
      await setDoc(SETTINGS_REF(), { general: form }, { merge: true });
      setSaved(form);
      setJustSaved(true);
    } catch (e) {
      setError('Save failed. ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const renderRows = (fields) => fields.map((f, i) => (
    <React.Fragment key={f.key}>
      {i > 0 && <Separator />}
      <div className="grid gap-2 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,220px)_1fr] md:gap-6">
        <div>
          <Label htmlFor={`setting-${f.key}`}>{f.label}</Label>
          {f.hint && <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>}
        </div>
        {f.multiline ? (
          <Textarea id={`setting-${f.key}`} rows={3} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder} disabled={saving} />
        ) : (
          <Input id={`setting-${f.key}`} type={f.type || 'text'} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder} disabled={saving} />
        )}
      </div>
    </React.Fragment>
  ));

  const renderSkeleton = (count) => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="grid gap-2 md:grid-cols-[minmax(0,220px)_1fr] md:gap-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader title="Settings" description="Site identity and contact details, stored in Firestore.">
        {justSaved && !dirty && <span className="text-xs text-muted-foreground">Saved</span>}
        <Button onClick={save} disabled={loading || saving || !dirty}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </PageHeader>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Site identity</CardTitle>
          <CardDescription>How the site presents itself to visitors.</CardDescription>
        </CardHeader>
        <CardContent>{loading ? renderSkeleton(FIELDS.identity.length) : renderRows(FIELDS.identity)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
          <CardDescription>How visitors can reach the team behind the site.</CardDescription>
        </CardHeader>
        <CardContent>{loading ? renderSkeleton(FIELDS.contact.length) : renderRows(FIELDS.contact)}</CardContent>
      </Card>
    </>
  );
};

export default SettingsPanel;
