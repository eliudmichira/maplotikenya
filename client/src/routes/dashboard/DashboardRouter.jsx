import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MOBILE_UI_ENABLED } from '../../config/features';
import { useAuth } from '../../context/AuthContext';
import UserDashboard from './UserDashboard';
import AgentDashboard from './AgentDashboard';
import MobileProfileScreen from '../../mobile/pages/MobileProfileScreen';
import MobileAgentProfile from '../../mobile/pages/MobileAgentProfile';
import MobileLayoutWrapper from '../../mobile/components/MobileLayoutWrapper';
import { DashboardLoader } from '../../components/Preloader';
import { Loader2 } from 'lucide-react';
import logoPadded from '../../assets/logo_padded.png';

const DashboardRouter = () => {
  const { currentUser, getUserRole, isVerifiedAgent, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [isRoleDetermining, setIsRoleDetermining] = useState(true);
  const [isMobile, setIsMobile] = useState(MOBILE_UI_ENABLED && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(MOBILE_UI_ENABLED && window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const determineUserRole = async () => {
      // If auth is still loading, don't determine role yet
      if (authLoading) return;

      if (!currentUser) {
        setIsRoleDetermining(false);
        return;
      }

      try {
        // Get user role
        const role = getUserRole ? getUserRole() : 'user';
        setUserRole(role);
      } catch (error) {
        console.error('Error determining user role:', error);
        setUserRole('user');
      } finally {
        setIsRoleDetermining(false);
      }
    };

    determineUserRole();
  }, [getUserRole, isVerifiedAgent, currentUser, authLoading]);

  // Show loading while determining role or waiting for auth
  if (authLoading || isRoleDetermining) {
    if (isMobile) {
      // Mobile-friendly loader: centered spinner with logo
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-black">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="w-20 h-20 rounded-full border-2 border-[#fbbf24]/20 border-t-[#000000] animate-spin" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-3 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden shadow-inner">
              <img src={logoPadded} alt="MaplotiKenya" className="w-10 h-10 object-contain" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
            Loading your profile...
          </p>
        </div>
      );
    }
    return <DashboardLoader text="Loading dashboard..." />;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/desktop/login" replace />;
  }

  // Route based on user role
  switch (userRole) {
    case 'admin':
      // Redirect to admin panel
      return <Navigate to="/admin" replace />;

    case 'agent':
      // Check if user is a verified agent
      if (isVerifiedAgent) {
        if (isMobile) {
          return <MobileAgentProfile />;
        }
        return <AgentDashboard />;
      } else {
        // Verification still pending: show a quiet holding page.
        return (
          <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-[#0A0A0A]">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#111111]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fbbf24]/15">
                <Loader2 className="h-6 w-6 animate-spin text-[#f59e0b]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verification pending</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
                We are reviewing your agent details. Your dashboard opens as soon as an admin approves the request.
              </p>
              <a href="/" className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-[#fbbf24] px-5 text-sm font-semibold text-[#111]">Back to the site</a>
            </div>
          </div>
        );
      }

    case 'user':
    default:
      // Show regular user dashboard
      if (isMobile) {
        return (
          <MobileLayoutWrapper title="Dashboard" subtitle="Manage your account">
            <MobileProfileScreen />
          </MobileLayoutWrapper>
        );
      }
      return <UserDashboard />;
  }
};

export default DashboardRouter;
