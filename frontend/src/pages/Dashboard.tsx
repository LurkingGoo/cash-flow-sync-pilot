
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
  Plus,
  Wallet,
  Target,
  Activity,
  DollarSign,
  Calendar,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Overview from '@/components/dashboard/Overview';
import ExpenseTracker from '@/components/dashboard/ExpenseTracker';
import StockPortfolio from '@/components/dashboard/StockPortfolio';
import HelpModal from '@/components/HelpModal';
import NotificationModal from '@/components/NotificationModal';
import SettingsModal from '@/components/SettingsModal';
import { profileApi } from '@/lib/api';

interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  telegram_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: string;
  email?: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickStats, setQuickStats] = useState({
    totalBalance: 0,
    monthlyExpenses: 0,
    pendingTransactions: 0,
    portfolioValue: 0
  });
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

      // Fetch quick stats
      await fetchQuickStats(session.user.id);
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

  const fetchQuickStats = async (userId: string) => {
    try {
      // Get current month expenses
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: expenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .gte('transaction_date', `${currentMonth}-01`);

      // Get portfolio value
      const { data: holdings } = await supabase
        .from('holdings')
        .select('shares, current_price, average_price')
        .eq('user_id', userId);

      const monthlyExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const portfolioValue = holdings?.reduce((sum, holding) => 
        sum + (Number(holding.shares) * (Number(holding.current_price) || Number(holding.average_price))), 0) || 0;

      setQuickStats({
        totalBalance: portfolioValue - monthlyExpenses,
        monthlyExpenses,
        pendingTransactions: 0, // This would need a pending transactions table
        portfolioValue
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    CashFlow Sync
                  </h1>
                  <p className="text-sm text-slate-500">Professional Finance Suite</p>
                </div>
              </div>
              
              {/* Search */}
              <div className="hidden md:flex items-center space-x-2 bg-slate-100/60 rounded-xl px-4 py-2.5 min-w-[320px]">
                <Search className="h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search transactions, stocks, or categories..." 
                  className="border-0 bg-transparent focus:ring-0 text-sm flex-1 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-4 bg-slate-100/40 rounded-xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 p-1.5 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Balance</p>
                    <p className="text-sm font-semibold text-slate-900">
                      ${quickStats.totalBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">This Month</p>
                    <p className="text-sm font-semibold text-slate-900">
                      ${quickStats.monthlyExpenses.toLocaleString()}
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
              <div className="flex items-center space-x-3 bg-slate-100/60 rounded-xl px-3 py-2 hover:bg-slate-200/60 transition-colors duration-200">
                <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                  <AvatarImage src={profile?.avatar_url} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 text-sm font-semibold">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-slate-900">
                    {profile?.full_name || user?.email?.split('@')[0]}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions Bar */}
        <div className="mb-8 bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
              <div className="flex items-center space-x-3">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-slate-300 hover:bg-slate-50 rounded-xl"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Add Stock
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-slate-300 hover:bg-slate-50 rounded-xl"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Set Budget
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Balance</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${quickStats.totalBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {quickStats.totalBalance >= 0 ? '+' : '-'}2.5% from last month
                  </p>
                </div>
                <div className="bg-blue-600 p-3 rounded-xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Portfolio Value</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${quickStats.portfolioValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    +5.2% this month
                  </p>
                </div>
                <div className="bg-green-600 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-orange-900">
                    ${quickStats.monthlyExpenses.toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {quickStats.monthlyExpenses > 0 ? 'Within budget' : 'No expenses yet'}
                  </p>
                </div>
                <div className="bg-orange-600 p-3 rounded-xl">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Active Goals</p>
                  <p className="text-2xl font-bold text-purple-900">3</p>
                  <p className="text-xs text-purple-600 mt-1">
                    2 on track, 1 needs attention
                  </p>
                </div>
                <div className="bg-purple-600 p-3 rounded-xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/70 backdrop-blur-sm shadow-sm rounded-2xl p-2 border border-slate-200/50">
            <TabsTrigger 
              value="overview" 
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:bg-slate-50 py-3"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:bg-slate-50 py-3"
            >
              <CreditCard className="h-5 w-5" />
              <span className="font-semibold">Expenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stocks" 
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:bg-slate-50 py-3"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">Portfolio</span>
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
