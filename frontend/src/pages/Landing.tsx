
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Shield, 
  Smartphone, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Users,
  Globe
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      title: "Smart Expense Tracking",
      description: "Automatically categorize and track your expenses with AI-powered insights"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: "Portfolio Management",
      description: "Monitor your investments and track market performance in real-time"
    },
    {
      icon: <Smartphone className="h-8 w-8 text-purple-600" />,
      title: "Telegram Integration",
      description: "Log transactions and get updates directly through Telegram bot"
    },
    {
      icon: <Shield className="h-8 w-8 text-orange-600" />,
      title: "Secure & Private",
      description: "Bank-level security with end-to-end encryption for your financial data"
    }
  ];

  const stats = [
    { number: "10K+", label: "Active Users" },
    { number: "$2.5M+", label: "Tracked Expenses" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">CashFlow Sync</h1>
                <p className="text-sm text-slate-500">Professional Finance Suite</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="text-slate-600 hover:text-slate-900"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
              Take Control of Your
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Financial Future</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Professional-grade expense tracking, portfolio management, and financial insights 
              all integrated with Telegram for seamless money management on the go.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <Button 
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl px-8 py-3 text-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-3 text-lg"
              >
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-8 text-sm text-slate-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span>10,000+ Happy Users</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Manage Your Finances
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From expense tracking to portfolio management, we've got all the tools 
              you need to take control of your financial life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-slate-50">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl text-slate-900">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Financial Life?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who are already taking control of their finances.
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl px-8 py-3 text-lg font-semibold"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold">CashFlow Sync</div>
                <div className="text-sm text-slate-400">Professional Finance Suite</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <span>© 2025 CashFlow Sync. All rights reserved.</span>
              <Globe className="h-4 w-4" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
