
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, AlertTriangle } from 'lucide-react';

interface OverviewData {
  totalExpenses: number;
  totalStockValue: number;
  monthlyExpenses: Array<{ month: string; amount: number }>;
  categoryExpenses: Array<{ name: string; value: number; color: string }>;
  budgetAlerts: Array<{ category: string; spent: number; budget: number }>;
  monthlyGainLoss: number;
}

const Overview = () => {
  const [data, setData] = useState<OverviewData>({
    totalExpenses: 0,
    totalStockValue: 0,
    monthlyExpenses: [],
    categoryExpenses: [],
    budgetAlerts: [],
    monthlyGainLoss: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current month expenses
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          amount,
          transaction_date,
          categories!inner(name, color)
        `)
        .eq('user_id', user.id)
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0]);

      // Get holdings
      const { data: holdings } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id)
        .gt('shares', 0);

      // Get last 6 months of expenses
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: monthlyData } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('user_id', user.id)
        .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0]);

      // Process data
      const totalExpenses = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalStockValue = holdings?.reduce((sum, h) => sum + (Number(h.shares) * Number(h.average_price)), 0) || 0;

      // Category expenses
      const categoryMap = new Map();
      transactions?.forEach(t => {
        const category = t.categories.name;
        const existing = categoryMap.get(category) || { name: category, value: 0, color: t.categories.color };
        existing.value += Number(t.amount);
        categoryMap.set(category, existing);
      });

      // Monthly expenses
      const monthlyMap = new Map();
      monthlyData?.forEach(t => {
        const month = new Date(t.transaction_date).toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(t.amount));
      });

      const monthlyExpenses = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
        month,
        amount
      })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      setData({
        totalExpenses,
        totalStockValue,
        monthlyExpenses,
        categoryExpenses: Array.from(categoryMap.values()),
        budgetAlerts: [], // TODO: Implement budget alerts
        monthlyGainLoss: totalExpenses > 0 ? ((totalExpenses - (monthlyExpenses[monthlyExpenses.length - 2]?.amount || 0)) / (monthlyExpenses[monthlyExpenses.length - 2]?.amount || 1)) * 100 : 0
      });
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const netWorth = data.totalStockValue - data.totalExpenses;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Net Worth</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netWorth.toFixed(2)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {netWorth >= 0 ? 'Positive' : 'Negative'} balance
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${data.totalExpenses.toFixed(2)}
            </div>
            <p className={`text-xs mt-1 ${data.monthlyGainLoss > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {data.monthlyGainLoss > 0 ? '+' : ''}{data.monthlyGainLoss.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Stock Portfolio</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.totalStockValue.toFixed(2)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              Total holdings value
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Budget Status</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${Math.max(0, 2000 - data.totalExpenses).toFixed(2)}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Budget remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categoryExpenses}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.categoryExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Expenses']} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alerts */}
      {data.budgetAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-orange-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.budgetAlerts.map((alert, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-orange-200">
                  <span className="font-medium text-orange-900">{alert.category}</span>
                  <span className="text-orange-600">
                    ${alert.spent.toFixed(2)} / ${alert.budget.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Overview;
