
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, BarChart3, CreditCard, TrendingUp } from 'lucide-react';
import Overview from '@/components/dashboard/Overview';
import ExpenseTracker from '@/components/dashboard/ExpenseTracker';
import StockPortfolio from '@/components/dashboard/StockPortfolio';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Finance Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your finances with ease</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">{user?.email}</p>
                      <p className="text-xs text-blue-600">User ID: {user?.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button 
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
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
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white shadow-sm rounded-lg p-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="flex items-center space-x-2 data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <CreditCard className="h-4 w-4" />
              <span>Expense Tracker</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stocks" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Stock Portfolio</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Overview />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseTracker />
          </TabsContent>

          <TabsContent value="stocks">
            <StockPortfolio />
          </TabsContent>
        </Tabs>
      </main>

      {/* Telegram Bot Instructions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
              🤖 Telegram Bot Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-blue-800">
                Add transactions on the go with our Telegram bot! Use your User ID: <code className="bg-blue-100 px-2 py-1 rounded text-sm">{user?.id}</code>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Getting Started:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Message the Telegram bot</li>
                    <li>Use <code>/link {user?.id}</code> to connect</li>
                    <li>Start adding transactions!</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Available Commands:</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li><code>/help</code> - Show all commands</li>
                    <li><code>/add_expense</code> - Add expense</li>
                    <li><code>/add_stock</code> - Add stock transaction</li>
                    <li><code>/balance</code> - Check summary</li>
                  </ul>
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
