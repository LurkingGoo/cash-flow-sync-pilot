
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, User, BarChart3, CreditCard, TrendingUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Overview from '@/components/dashboard/Overview';
import ExpenseTracker from '@/components/dashboard/ExpenseTracker';
import StockPortfolio from '@/components/dashboard/StockPortfolio';
import HelpModal from '@/components/HelpModal';
import NotificationModal from '@/components/NotificationModal';
import SettingsModal from '@/components/SettingsModal';
import { profileApi } from '@/lib/api';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    setProfile(updatedProfile);
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-2.5 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">
                    Lurking Finance
                  </h1>
                  <p className="text-sm text-slate-500">Personal wealth management</p>
                </div>
              </div>
              
              {/* Search */}
              <div className="hidden md:flex items-center space-x-2 bg-slate-100/60 rounded-xl px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search transactions..." 
                  className="border-0 bg-transparent focus:ring-0 text-sm w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationModal />
              
              {/* Settings */}
              <SettingsModal profile={profile} onProfileUpdate={handleProfileUpdate} />

              {/* Help */}
              <HelpModal userEmail={user?.email} />
              
              {/* User Profile */}
              <div className="flex items-center space-x-3 bg-slate-100/60 rounded-xl px-3 py-2 hover:bg-slate-200/60 transition-colors duration-200">
                <div className="bg-slate-200 p-1.5 rounded-lg">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-slate-900">
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-slate-500">Member</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white shadow-sm rounded-xl p-1.5 border border-slate-200/50">
            <TabsTrigger 
              value="overview" 
              className="flex items-center space-x-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg transition-all duration-200 hover:bg-slate-50"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="flex items-center space-x-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg transition-all duration-200 hover:bg-slate-50"
            >
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Expenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stocks" 
              className="flex items-center space-x-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg transition-all duration-200 hover:bg-slate-50"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Portfolio</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <Overview />
          </TabsContent>

          <TabsContent value="expenses" className="mt-0">
            <ExpenseTracker />
          </TabsContent>

          <TabsContent value="stocks" className="mt-0">
            <StockPortfolio />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
