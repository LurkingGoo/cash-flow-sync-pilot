
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, CreditCard, PieChart } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/dashboard');
    }
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-2xl">
              <BarChart3 className="h-12 w-12 text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Lurking Finance
              </h1>
              <p className="text-lg text-slate-600 mt-2">Advanced personal wealth management</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800">Portfolio Tracking</h3>
              <p className="text-sm text-slate-600 mt-2">Monitor your investments and stock performance</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <CreditCard className="h-8 w-8 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800">Expense Management</h3>
              <p className="text-sm text-slate-600 mt-2">Track daily expenses with smart categorization</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <PieChart className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800">Analytics & Insights</h3>
              <p className="text-sm text-slate-600 mt-2">Visualize your financial data with charts</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-slate-800">Ready to get started?</CardTitle>
            <CardDescription className="text-lg text-slate-600">
              Take control of your finances with our comprehensive dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800">✨ Features:</h4>
                <ul className="text-slate-600 space-y-1">
                  <li>• Real-time expense tracking</li>
                  <li>• Stock portfolio management</li>
                  <li>• Monthly budget planning</li>
                  <li>• Interactive data visualization</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800">🤖 Telegram Integration:</h4>
                <ul className="text-slate-600 space-y-1">
                  <li>• Quick expense entry via bot</li>
                  <li>• Stock transaction logging</li>
                  <li>• Budget notifications</li>
                  <li>• Account balance summaries</li>
                </ul>
              </div>
            </div>
            <Button onClick={handleSignIn} className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg">
              Start Managing Your Finances
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-slate-500">
            🚀 Connect with our Telegram bot for on-the-go financial management
          </p>
          <p className="text-xs text-slate-400 mt-2">© 2024 Lucas Koh. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
