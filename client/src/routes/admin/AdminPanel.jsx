import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Users, Shield, BarChart3, FileText, Settings, UserCheck, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import WorkspaceShell from '../../components/workspace/WorkspaceShell';

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

const AdminPanel = () => {
  const { currentUser, getUserRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

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

  return (
    <WorkspaceShell root="Admin" navLabel="Manage" sections={SECTIONS} active={active} onSelect={setActive}>
      <Section />
    </WorkspaceShell>
  );
};

export default AdminPanel;
