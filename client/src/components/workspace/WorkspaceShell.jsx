import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Sun, Moon, ChevronRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../Logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';

// One shell for every signed-in workspace: admin, agent and user dashboards
// are three navigation configurations of this layout. Desktop gets a rail,
// phones get a slide-out sheet, and the content column is fixed-width.
//
//   sections: [{ id, label, icon }]        in-page sections (?section=id)
//   links:    [{ label, icon, to }]        router links shown under the sections
//   active / onSelect                      current section and setter
//   root:     breadcrumb root ("Admin", "Agent", "My account")
//   actions:  node rendered at the right of the top bar

function NavItem({ icon: Icon, label, isActive, onClick, to }) {
  const className = cn(
    'group flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm transition-colors',
    isActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
  );
  const inner = (
    <>
      <span className={cn('-ml-3 h-4 w-0.5 rounded-r-full', isActive ? 'bg-primary' : 'bg-transparent')} />
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </>
  );
  if (to) return <Link to={to} className={className}>{inner}</Link>;
  return (
    <button type="button" onClick={onClick} aria-current={isActive ? 'page' : undefined} className={className}>
      {inner}
    </button>
  );
}

function NavList({ sections, links, active, onSelect, navLabel }) {
  return (
    <>
      {navLabel && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{navLabel}</p>}
      <nav className="flex flex-col gap-0.5">
        {sections.map((s) => (
          <NavItem key={s.id} icon={s.icon} label={s.label} isActive={active === s.id} onClick={() => onSelect(s.id)} />
        ))}
      </nav>
      {links?.length > 0 && (
        <>
          <Separator className="my-3" />
          <nav className="flex flex-col gap-0.5">
            {links.map((l) => <NavItem key={l.to} icon={l.icon} label={l.label} to={l.to} />)}
          </nav>
        </>
      )}
    </>
  );
}

export default function WorkspaceShell({ root, navLabel = 'Workspace', sections, links, active, onSelect, actions, children }) {
  const { currentUser, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = sections.find((s) => s.id === active) || sections[0];
  const select = (id) => { onSelect(id); setMobileOpen(false); };
  const initials = (currentUser?.name || currentUser?.email || 'M').trim().charAt(0).toUpperCase();
  const avatar = currentUser?.avatar || currentUser?.photoUrl || currentUser?.photoURL || '';

  const handleSignOut = async () => {
    try { await signOut?.(); } finally { navigate('/'); }
  };

  const userBlock = (
    <div className="p-3">
      <div className="flex items-center gap-3 rounded-md px-2 py-2">
        {avatar ? (
          <img src={avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials}</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{currentUser?.name || currentUser?.displayName || 'Account'}</p>
          <p className="truncate text-xs text-muted-foreground">{currentUser?.email}</p>
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
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('min-h-screen bg-background text-foreground', isDark ? 'dark' : '')}>
        <div className="flex min-h-screen">
          {/* Desktop rail */}
          <aside className="hidden border-r border-border bg-card lg:flex lg:w-60 lg:shrink-0 lg:flex-col">
            <div className="flex h-14 items-center px-4">
              <Link to="/" className="flex items-center" aria-label="Back to the site">
                <Logo variant="ultra" greenStyle="premium" glow="off" pulse="off" isDark={isDark} className="text-lg" />
              </Link>
            </div>
            <Separator />
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavList sections={sections} links={links} active={active} onSelect={select} navLabel={navLabel} />
            </div>
            <Separator />
            {userBlock}
          </aside>

          {/* Mobile sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex h-14 items-center px-4">
                <Logo variant="ultra" greenStyle="premium" glow="off" pulse="off" isDark={isDark} className="text-lg" />
              </div>
              <Separator />
              <div className="px-3 py-4">
                <NavList sections={sections} links={links} active={active} onSelect={select} navLabel={navLabel} />
              </div>
              <Separator />
              {userBlock}
            </SheetContent>
          </Sheet>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
                <Menu />
              </Button>
              <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
                <span className="hidden sm:inline">{root}</span>
                <ChevronRight className="hidden h-3.5 w-3.5 sm:inline" />
                <span className="truncate font-medium text-foreground">{current?.label}</span>
              </nav>
              <div className="ml-auto flex items-center gap-2">
                {actions}
                <Button variant="outline" size="sm" asChild>
                  <Link to="/"><ExternalLink />View site</Link>
                </Button>
              </div>
            </header>

            <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
