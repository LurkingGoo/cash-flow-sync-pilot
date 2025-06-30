
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, PieChart as PieChartIcon, Target } from 'lucide-react';

interface DashboardData {
  totalExpenses: number;
  totalStockValue: number;
  monthlyExpenses: Array<{ month: string; amount: number }>;
  categoryBreakdown: Array<{ name: string; value: number; color: string }>;
  budgetStatus: Array<{ category: string; spent: number; budget: number; percentage: number }>;
}

const Overview = () => {
  const [data, setData] = useState<DashboardData>({
    totalExpenses: 0,
    totalStockValue: 0,
    monthlyExpenses: [],
    categoryBreakdown: [],
    budgetStatus: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Fetch expenses for current year
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          amount,
          transaction_date,
          categories!inner(name, color)
        `)
        .eq('user_id', user.id)
        .gte('transaction_date', `${currentYear}-01-01`);

      // Fetch stock holdings
      const { data: holdings } = await supabase
        .from('holdings')
        .select('shares, average_price, current_price')
        .eq('user_id', user.id);

      // Fetch budgets for current month
      const { data: budgets } = await supabase
        .from('budgets')
        .select(`
          amount,
          categories!inner(name, color)
        `)
        .eq('user_id', user.id)
        .eq('month_year', currentMonth);

      // Process data
      const totalExpenses = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalStockValue = holdings?.reduce((sum, h) => 
        sum + (Number(h.shares) * (Number(h.current_price) || Number(h.average_price))), 0) || 0;

      // Monthly expenses
      const monthlyMap = new Map();
      transactions?.forEach(t => {
        const date = new Date(t.transaction_date);
        const month = date.toLocaleString('default', { month: 'short' });
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(t.amount));
      });
      const monthlyExpenses = Array.from(monthlyMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months.indexOf(a.month) - months.indexOf(b.month);
        });

      // Category breakdown
      const categoryMap = new Map();
      transactions?.forEach(t => {
        const category = t.categories.name;
        const existing = categoryMap.get(category) || { 
          name: category, 
          value: 0, 
          color: t.categories.color 
        };
        existing.value += Number(t.amount);
        categoryMap.set(category, existing);
      });
      const categoryBreakdown = Array.from(categoryMap.values());

      // Budget status (mock data for now since we need to calculate spent vs budget)
      const budgetStatus = budgets?.map(budget => {
        const categorySpent = categoryMap.get(budget.categories.name)?.value || 0;
        const budgetAmount = Number(budget.amount);
        return {
          category: budget.categories.name,
          spent: categorySpent,
          budget: budgetAmount,
          percentage: budgetAmount > 0 ? (categorySpent / budgetAmount) * 100 : 0
        };
      }) || [];

      setData({
        totalExpenses,
        totalStockValue,
        monthlyExpenses,
        categoryBreakdown,
        budgetStatus
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  const netWorth = data.totalStockValue - data.totalExpenses;
  const CHART_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Net Worth</p>
                <p className="text-2xl font-bold text-blue-900">${netWorth.toFixed(2)}</p>
                <p className="text-xs text-blue-600">Total portfolio value</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-900">${data.totalExpenses.toFixed(2)}</p>
                <p className="text-xs text-red-600">This year</p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Stock Portfolio</p>
                <p className="text-2xl font-bold text-green-900">${data.totalStockValue.toFixed(2)}</p>
                <p className="text-xs text-green-600">Current value</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Monthly Avg</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${data.monthlyExpenses.length > 0 ? 
                    (data.totalExpenses / data.monthlyExpenses.length).toFixed(2) : 
                    '0.00'
                  }
                </p>
                <p className="text-xs text-purple-600">Expense average</p>
              </div>
              <PieChartIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Expenses Trend */}
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Expenses Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyExpenses} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Expenses']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Expense Categories</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status */}
      {data.budgetStatus.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Budget Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.budgetStatus.map((budget, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{budget.category}</span>
                    <span className="text-sm text-gray-600">
                      ${budget.spent.toFixed(2)} / ${budget.budget.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        budget.percentage > 100 ? 'bg-red-500' : 
                        budget.percentage > 80 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{budget.percentage.toFixed(1)}% used</span>
                    {budget.percentage > 100 && (
                      <span className="text-red-600 font-medium">
                        ${(budget.spent - budget.budget).toFixed(2)} over budget
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">This Month</h3>
            <p className="text-2xl font-bold text-blue-600">
              ${data.monthlyExpenses.length > 0 ? 
                data.monthlyExpenses[data.monthlyExpenses.length - 1]?.amount.toFixed(2) || '0.00' : 
                '0.00'
              }
            </p>
            <p className="text-sm text-gray-500">Current month expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Category</h3>
            <p className="text-2xl font-bold text-green-600">
              {data.categoryBreakdown.length > 0 ? 
                data.categoryBreakdown.reduce((prev, current) => 
                  (prev.value > current.value) ? prev : current
                ).name : 
                'N/A'
              }
            </p>
            <p className="text-sm text-gray-500">Highest spending category</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Health</h3>
            <div className="flex items-center justify-center">
              {netWorth >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500 mr-2" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500 mr-2" />
              )}
              <span className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netWorth >= 0 ? 'Positive' : 'Negative'}
              </span>
            </div>
            <p className="text-sm text-gray-500">Net worth status</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
