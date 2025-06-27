
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Finance Tracker</h1>
          <p className="text-xl text-gray-600 mb-8">Manage your finances with ease</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome to Your Finance Dashboard</CardTitle>
            <CardDescription>
              Track expenses, manage stock portfolio, and get insights via Telegram bot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Track daily expenses with categories</li>
                <li>• Manage stock transactions and portfolio</li>
                <li>• Monthly filtering and analytics</li>
                <li>• Telegram bot integration</li>
                <li>• Visual charts and summaries</li>
              </ul>
            </div>
            <Button onClick={handleSignIn} className="w-full">
              Get Started
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>🤖 Use our Telegram bot to add transactions on the go!</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
