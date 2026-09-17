import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { blogPosts as defaultPosts } from '../../../data/blogPosts';
import { normaliseBlogDoc, slugify, parseBodyText } from '../../../lib/blogUtils';
import { BookOpen, Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, Toolbar, EmptyState, Pagination, statusVariant, formatDate } from '@/components/admin/primitives';

const PAGE_SIZE = 25;

const emptyForm = () => ({
  slug: '',
  title: '',
  excerpt: '',
  category: 'General',
  date: new Date().toISOString().slice(0, 10),
  readTime: '5 min read',
  bodyText: '',
  published: true,
});

const BlogManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  // create / edit
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // delete / import
  const [deleting, setDeleting] = useState(null); // post
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const snap = await getDocs(collection(db, 'blogPosts'));
      const list = snap.docs
        .map((d) => normaliseBlogDoc(d.id, d.data()))
        .filter(Boolean)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setPosts(list);
    } catch (e) {
      setError('Could not load blog posts. ' + (e.message || ''));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const stats = useMemo(() => ({
    published: posts.filter((p) => p.published !== false).length,
    draft: posts.filter((p) => p.published === false).length,
  }), [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (status === 'published' && p.published === false) return false;
      if (status === 'draft' && p.published !== false) return false;
      if (!q) return true;
      return [p.title, p.slug, p.category, p.excerpt].some((v) => String(v).toLowerCase().includes(q));
    });
  }, [posts, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, status]);

  // ── editor ──
  const openCreate = () => {
    setEditingSlug(null);
    setForm(emptyForm());
    setFormError('');
    setEditorOpen(true);
  };

  const openEdit = (post) => {
    setEditingSlug(post.slug);
    setForm({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      date: post.date,
      readTime: post.readTime,
      bodyText: (post.body || []).join('\n\n'),
      published: post.published !== false,
    });
    setFormError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingSlug(null);
    setForm(emptyForm());
    setFormError('');
  };

  const setField = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const slug = editingSlug || slugify(form.slug || form.title);
    if (!slug) {
      setFormError('Add a title or slug so the post has a URL.');
      return;
    }
    const body = parseBodyText(form.bodyText);
    if (body.length === 0) {
      setFormError('Add at least one paragraph in the body (separate paragraphs with a blank line).');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await setDoc(
        doc(db, 'blogPosts', slug),
        {
          slug,
          title: form.title.trim(),
          excerpt: form.excerpt.trim(),
          category: form.category.trim() || 'General',
          date: form.date,
          readTime: form.readTime.trim() || '5 min read',
          body,
          published: form.published,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await loadPosts();
      closeEditor();
    } catch (err) {
      setFormError(err.message || 'Save failed. Check Firestore rules and network.');
    } finally {
      setSaving(false);
    }
  };

  // ── publish / unpublish ──
  const setPublished = async (post, published) => {
    setBusy(true);
    setError('');
    setPosts((prev) => prev.map((p) => (p.slug === post.slug ? { ...p, published } : p)));
    try {
      await setDoc(doc(db, 'blogPosts', post.slug), { published, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      setPosts((prev) => prev.map((p) => (p.slug === post.slug ? { ...p, published: post.published } : p)));
      setError(`Could not ${published ? 'publish' : 'unpublish'} "${post.title}". ${err.message || ''}`);
    } finally {
      setBusy(false);
    }
  };

  // ── delete ──
  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setError('');
    try {
      await deleteDoc(doc(db, 'blogPosts', deleting.slug));
      setPosts((prev) => prev.filter((p) => p.slug !== deleting.slug));
    } catch (err) {
      setError('Delete failed. ' + (err.message || ''));
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  // ── import bundled samples ──
  const confirmImport = async () => {
    setBusy(true);
    setError('');
    try {
      const batch = writeBatch(db);
      for (const p of defaultPosts) {
        batch.set(
          doc(db, 'blogPosts', p.slug),
          {
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt,
            category: p.category,
            date: p.date,
            readTime: p.readTime,
            body: p.body,
            published: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      await batch.commit();
      await loadPosts();
    } catch (err) {
      setError('Import failed. ' + (err.message || ''));
    } finally {
      setBusy(false);
      setImportOpen(false);
    }
  };

  const isPublished = (p) => p.published !== false;

  return (
    <>
      <PageHeader
        title="Blog"
        description={(
          <>
            Articles shown on{' '}
            <a href="/desktop/blog" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline underline-offset-2">
              /desktop/blog <ExternalLink className="h-3 w-3" />
            </a>
            . {stats.published} published, {stats.draft} draft.
          </>
        )}
      >
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} disabled={busy || defaultPosts.length === 0}><Download />Import samples</Button>
        <Button size="sm" onClick={openCreate}><Plus />New post</Button>
      </PageHeader>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-hidden">
        <div className="p-3 md:p-4">
          <Toolbar>
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, slug or category" className="pl-8" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All posts</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">{filtered.length.toLocaleString()} result{filtered.length === 1 ? '' : 's'}</span>
          </Toolbar>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={posts.length === 0 ? 'No posts yet' : 'No posts match'}
            description={posts.length === 0
              ? 'Until a post is saved here, the public blog shows the bundled sample articles as a fallback.'
              : 'Try clearing the search or the status filter.'}
            action={posts.length === 0 ? <Button size="sm" onClick={openCreate}><Plus />New post</Button> : null}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Post</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-12 pr-3 text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((p) => (
                  <TableRow key={p.slug}>
                    <TableCell className="pl-4">
                      <button type="button" onClick={() => openEdit(p)} className="block min-w-0 max-w-[420px] text-left">
                        <span className="block truncate text-sm font-medium text-foreground">{p.title}</span>
                        <span className="block truncate font-mono text-xs text-muted-foreground">{p.slug}</span>
                      </button>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{p.category}</TableCell>
                    <TableCell><Badge variant={statusVariant(isPublished(p) ? 'published' : 'draft')}>{isPublished(p) ? 'Published' : 'Draft'}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell whitespace-nowrap text-muted-foreground">{formatDate(p.date)}</TableCell>
                    <TableCell className="pr-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Row actions"><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(p)}><Pencil />Edit</DropdownMenuItem>
                          {isPublished(p)
                            ? <DropdownMenuItem disabled={busy} onSelect={() => setPublished(p, false)}><EyeOff />Unpublish</DropdownMenuItem>
                            : <DropdownMenuItem disabled={busy} onSelect={() => setPublished(p, true)}><Eye />Publish</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleting(p)}><Trash2 />Delete…</DropdownMenuItem>
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

      {/* Create / edit */}
      <Dialog open={editorOpen} onOpenChange={(o) => !o && closeEditor()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingSlug ? 'Edit post' : 'New post'}</DialogTitle>
              <DialogDescription>{editingSlug ? 'Changes go live as soon as you save.' : 'Paragraphs in the body are separated by a blank line.'}</DialogDescription>
            </DialogHeader>

            {formError && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}

            <div className="space-y-1.5">
              <Label htmlFor="blog-slug">{editingSlug ? 'Slug' : 'URL slug (optional)'}</Label>
              <Input
                id="blog-slug"
                value={form.slug}
                readOnly={!!editingSlug}
                onChange={(e) => setField('slug')(e.target.value)}
                placeholder="auto from title if empty"
                className={editingSlug ? 'bg-muted font-mono text-sm text-muted-foreground' : ''}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="blog-title">Title</Label>
              <Input id="blog-title" required value={form.title} onChange={(e) => setField('title')(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea id="blog-excerpt" required rows={2} value={form.excerpt} onChange={(e) => setField('excerpt')(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="blog-category">Category</Label>
                <Input id="blog-category" value={form.category} onChange={(e) => setField('category')(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="blog-date">Date</Label>
                <Input id="blog-date" type="date" value={form.date} onChange={(e) => setField('date')(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="blog-readtime">Read time</Label>
                <Input id="blog-readtime" value={form.readTime} onChange={(e) => setField('readTime')(e.target.value)} placeholder="5 min read" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="blog-body">Body</Label>
              <Textarea id="blog-body" required rows={12} value={form.bodyText} onChange={(e) => setField('bodyText')(e.target.value)} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Separate paragraphs with a blank line.</p>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="blog-published" checked={form.published} onCheckedChange={setField('published')} />
              <Label htmlFor="blog-published">Published (visible on the public blog)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditor}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : null}{editingSlug ? 'Save changes' : 'Create post'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes the post from Firestore permanently. It cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={busy} onClick={(e) => { e.preventDefault(); confirmDelete(); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import samples */}
      <AlertDialog open={importOpen} onOpenChange={(o) => !o && !busy && setImportOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import {defaultPosts.length} sample post{defaultPosts.length === 1 ? '' : 's'}?</AlertDialogTitle>
            <AlertDialogDescription>The bundled sample articles are written to Firestore as published posts. Existing posts with the same slug are overwritten.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); confirmImport(); }}>{busy ? <Loader2 className="animate-spin" /> : null}Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BlogManagement;
