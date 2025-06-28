
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, BarChart3, CreditCard, TrendingUp, Settings, Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Overview from '@/components/dashboard/Overview';
import ExpenseTracker from '@/components/dashboard/ExpenseTracker';
import StockPortfolio from '@/components/dashboard/StockPortfolio';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
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
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Finance Dashboard</h1>
                  <p className="text-sm text-gray-500">Personal wealth management</p>
                </div>
              </div>
              
              {/* Search */}
              <div className="hidden md:flex items-center space-x-2 bg-gray-100/60 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search transactions..." 
                  className="border-0 bg-transparent focus:ring-0 text-sm w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
              
              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              
              {/* User Profile */}
              <div className="flex items-center space-x-3 bg-gray-100/60 rounded-lg px-3 py-2">
                <div className="bg-blue-100 p-1.5 rounded-lg">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">Premium</p>
                </div>
              </div>
              
              <Button 
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white shadow-sm rounded-xl p-1.5 border border-gray-200/50">
            <TabsTrigger 
              value="overview" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Expenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stocks" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
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

      {/* Telegram Bot Integration Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
              🤖 Telegram Bot Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/60 backdrop-blur rounded-lg p-4">
              <p className="text-blue-800 mb-3">
                Manage your finances on the go with our Telegram bot! Connect using your email:
              </p>
              <div className="bg-blue-100/80 rounded-lg p-3 font-mono text-sm text-blue-900">
                /link {user?.email}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/60 backdrop-blur rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  🚀 Quick Commands:
                </h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex justify-between">
                    <code className="bg-blue-100/80 px-2 py-1 rounded text-xs">/add_expense</code>
                    <span>Add expense</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="bg-blue-100/80 px-2 py-1 rounded text-xs">/add_stock</code>
                    <span>Add stock trade</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="bg-blue-100/80 px-2 py-1 rounded text-xs">/set_budget</code>
                    <span>Set budget</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="bg-blue-100/80 px-2 py-1 rounded text-xs">/balance</code>
                    <span>Check summary</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">💡 Example Usage:</h4>
                <div className="space-y-2 text-sm text-blue-700 font-mono">
                  <div className="bg-blue-100/80 p-2 rounded text-xs">
                    /add_expense 25.50 Coffee "Food & Dining" "Main Card"
                  </div>
                  <div className="bg-blue-100/80 p-2 rounded text-xs">
                    /add_stock AAPL 10 150.25 buy
                  </div>
                  <div className="bg-blue-100/80 p-2 rounded text-xs">
                    /set_budget "Food & Dining" 500 2024-06
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
