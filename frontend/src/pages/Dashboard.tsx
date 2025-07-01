import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  User, 
  BarChart3, 
  CreditCard, 
  TrendingUp, 
  Search, 
  Bell,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Overview from '@/components/dashboard/Overview';
import ExpenseTracker from '@/components/dashboard/ExpenseTracker';
import StockPortfolio from '@/components/dashboard/StockPortfolio';
import HelpModal from '@/components/HelpModal';
import NotificationModal from '@/components/NotificationModal';
import SettingsModal from '@/components/SettingsModal';
import { profileApi } from '@/lib/api';
import { FinancialProvider, useFinancialData } from '@/contexts/FinancialContext';

interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  telegram_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: string;
  email?: string;
}

interface DashboardContentProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const DashboardContent = ({ selectedMonth, setSelectedMonth }: DashboardContentProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { data: financialData, refreshData } = useFinancialData();

  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      
      // Fetch user profile
      const profileData = await profileApi.get(session.user.id);
      setProfile(profileData);
      
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Refresh data when switching tabs to ensure latest information
  useEffect(() => {
    if (activeTab && user) {
      refreshData();
    }
  }, [activeTab, refreshData, user]);

  // Refresh data when selectedMonth changes
  useEffect(() => {
    if (user && selectedMonth) {
      refreshData(selectedMonth);
    }
  }, [selectedMonth, refreshData, user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleProfileUpdate = async (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    
    try {
      const refreshedProfile = await profileApi.get(updatedProfile.id);
      setProfile(refreshedProfile);
    } catch (error) {
      console.error('Error refetching profile:', error);
    }
  };

  const handleRefreshData = async () => {
    await refreshData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30 shadow-sm" id="main-header">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-slate-800 to-slate-600 p-2.5 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Lurking Finance
                  </h1>
                  <p className="text-sm text-slate-500">Personal Wealth Management</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-4 bg-slate-100/40 rounded-xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">This Month</p>
                    <p className="text-sm font-semibold text-slate-900">
                      ${financialData.monthlyExpenses.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="bg-emerald-100 p-1.5 rounded-lg">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Budget</p>
                    <p className="text-sm font-semibold text-slate-900">
                      ${financialData.monthlyBudget.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="bg-purple-100 p-1.5 rounded-lg">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Portfolio</p>
                    <p className="text-sm font-semibold text-slate-900">
                      ${financialData.portfolioValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <NotificationModal />
              
              {/* Settings */}
              {profile && (
                <SettingsModal profile={profile} onProfileUpdate={handleProfileUpdate} />
              )}

              {/* Help */}
              <HelpModal userEmail={user?.email} />
              
              {/* User Profile */}
              <div 
                key={`${profile?.full_name}-${profile?.username}-${profile?.avatar_url}-${profile?.id}`} 
                className="flex items-center space-x-3 bg-slate-100/60 rounded-xl px-3 py-2 hover:bg-slate-200/60 transition-colors duration-200"
              >
                <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                  <AvatarImage src={profile?.avatar_url} alt="Profile" className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 text-sm font-semibold">
                    {(profile?.full_name || profile?.username || user?.email)?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-slate-900">
                    {profile?.full_name || profile?.username || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-slate-500">
                    {profile?.telegram_id ? 'Telegram Connected' : 'Member'}
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          {/* Navigation Tabs - More seamless design */}
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-lg shadow-lg rounded-2xl p-1.5 border border-slate-200/40 max-w-lg mx-auto overflow-hidden">
              <TabsTrigger 
                value="overview" 
                className="flex items-center justify-center space-x-2 relative overflow-hidden rounded-xl py-3 px-4 text-slate-600 font-medium text-sm transition-all duration-500 ease-out hover:text-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 opacity-0 transition-opacity duration-500 ease-out group-data-[state=active]:opacity-100 rounded-xl"></div>
                <div className="absolute inset-0 bg-slate-100/50 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-data-[state=active]:opacity-0 rounded-xl"></div>
                <BarChart3 className="h-4 w-4 relative z-10 transition-transform duration-300 group-data-[state=active]:scale-110" />
                <span className="relative z-10 font-semibold">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="expenses" 
                className="flex items-center justify-center space-x-2 relative overflow-hidden rounded-xl py-3 px-4 text-slate-600 font-medium text-sm transition-all duration-500 ease-out hover:text-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 opacity-0 transition-opacity duration-500 ease-out group-data-[state=active]:opacity-100 rounded-xl"></div>
                <div className="absolute inset-0 bg-slate-100/50 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-data-[state=active]:opacity-0 rounded-xl"></div>
                <CreditCard className="h-4 w-4 relative z-10 transition-transform duration-300 group-data-[state=active]:scale-110" />
                <span className="relative z-10 font-semibold">Expenses</span>
              </TabsTrigger>
              <TabsTrigger 
                value="stocks" 
                className="flex items-center justify-center space-x-2 relative overflow-hidden rounded-xl py-3 px-4 text-slate-600 font-medium text-sm transition-all duration-500 ease-out hover:text-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 opacity-0 transition-opacity duration-500 ease-out group-data-[state=active]:opacity-100 rounded-xl"></div>
                <div className="absolute inset-0 bg-slate-100/50 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-data-[state=active]:opacity-0 rounded-xl"></div>
                <TrendingUp className="h-4 w-4 relative z-10 transition-transform duration-300 group-data-[state=active]:scale-110" />
                <span className="relative z-10 font-semibold">Portfolio</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content with proper spacing and smooth transitions */}
          <div className="min-h-[600px]">
            <TabsContent 
              value="overview" 
              className="mt-0 focus:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95 data-[state=active]:duration-300"
            >
              <Overview selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
            </TabsContent>

            <TabsContent 
              value="expenses" 
              className="mt-0 focus:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95 data-[state=active]:duration-300"
            >
              <ExpenseTracker />
            </TabsContent>

            <TabsContent 
              value="stocks" 
              className="mt-0 focus:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:zoom-in-95 data-[state=active]:duration-300"
            >
              <StockPortfolio />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

// Main Dashboard component that provides the financial context
const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }
        setUser(session.user);
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <FinancialProvider userId={user.id} selectedMonth={selectedMonth}>
      <DashboardContent 
        selectedMonth={selectedMonth} 
        setSelectedMonth={setSelectedMonth} 
      />
    </FinancialProvider>
  );
};

export default Dashboard;
