import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Users, Shield, BarChart3, FileText, Settings, UserCheck, BookOpen,
  Menu, ExternalLink, LogOut, Sun, Moon, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';

// Admin sections
import UserManagement from './sections/UserManagement';
import PropertyModeration from './sections/PropertyModeration';
import AnalyticsDashboard from './sections/AnalyticsDashboard';
import AgentVerification from './sections/AgentVerification';
import ContentManagement from './sections/ContentManagement';
import BlogManagement from './sections/BlogManagement';
import SettingsPanel from './sections/SettingsPanel';

const SECTIONS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3, component: AnalyticsDashboard },
  { id: 'moderation', label: 'Listings', icon: Shield, component: PropertyModeration },
  { id: 'users', label: 'Users', icon: Users, component: UserManagement },
  { id: 'verification', label: 'Agent verification', icon: UserCheck, component: AgentVerification },
  { id: 'content', label: 'Featured content', icon: FileText, component: ContentManagement },
  { id: 'blog', label: 'Blog', icon: BookOpen, component: BlogManagement },
  { id: 'settings', label: 'Settings', icon: Settings, component: SettingsPanel },
];

// Sidebar navigation list, shared by the desktop rail and the mobile sheet.
function NavList({ active, onSelect }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors',
              isActive
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <span className={cn('h-4 w-0.5 -ml-3 rounded-r-full', isActive ? 'bg-primary' : 'bg-transparent')} />
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const AdminPanel = () => {
  const { currentUser, getUserRole, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sectionFromUrl = searchParams.get('section');
  const [active, setActive] = useState(SECTIONS.some((s) => s.id === sectionFromUrl) ? sectionFromUrl : 'analytics');

  useEffect(() => {
    if (active !== sectionFromUrl) setSearchParams({ section: active }, { replace: true });
  }, [active, sectionFromUrl, setSearchParams]);

  const role = getUserRole ? getUserRole() : 'user';
  if (!currentUser || role !== 'admin') {
    return <Navigate to="/desktop/login" replace />;
  }

  const current = SECTIONS.find((s) => s.id === active) || SECTIONS[0];
  const Section = current.component;
  const select = (id) => { setActive(id); setMobileOpen(false); };
  const initials = (currentUser.name || currentUser.email || 'A').trim().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try { await signOut?.(); } finally { navigate('/'); }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('min-h-screen bg-background text-foreground', isDark ? 'dark' : '')}>
        <div className="flex min-h-screen">
          {/* Desktop rail */}
          <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col border-r border-border bg-card">
            <div className="flex h-14 items-center px-4">
              <Link to="/" className="flex items-center" aria-label="Back to the site">
                <Logo variant="ultra" greenStyle="premium" glow="off" pulse="off" isDark={isDark} className="text-lg" />
              </Link>
            </div>
            <Separator />
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Manage</p>
              <NavList active={active} onSelect={select} />
            </div>
            <Separator />
            <div className="p-3">
              <div className="flex items-center gap-3 rounded-md px-2 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{currentUser.name || 'Admin'}</p>
                  <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <Button variant="ghost" size="sm" className="flex-1 justify-start" onClick={toggleTheme}>
                  {isDark ? <Sun /> : <Moon />}
                  {isDark ? 'Light mode' : 'Dark mode'}
                </Button>
                <Button variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut}>
                  <LogOut />
                </Button>
              </div>
            </div>
          </aside>

          {/* Mobile sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Admin menu</SheetTitle>
              <div className="flex h-14 items-center px-4">
                <Logo variant="ultra" greenStyle="premium" glow="off" pulse="off" isDark={isDark} className="text-lg" />
              </div>
              <Separator />
              <div className="px-3 py-4">
                <NavList active={active} onSelect={select} />
              </div>
              <Separator />
              <div className="flex items-center gap-1 p-3">
                <Button variant="ghost" size="sm" className="flex-1 justify-start" onClick={toggleTheme}>
                  {isDark ? <Sun /> : <Moon />}
                  {isDark ? 'Light mode' : 'Dark mode'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut />Sign out</Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Top bar */}
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
                <Menu />
              </Button>
              <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
                <span>Admin</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="truncate font-medium text-foreground">{current.label}</span>
              </nav>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/"><ExternalLink />View site</Link>
                </Button>
              </div>
            </header>

            <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-6xl space-y-6">
                <Section />
              </div>
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AdminPanel;
