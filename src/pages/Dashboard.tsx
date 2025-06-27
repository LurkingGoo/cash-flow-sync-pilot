
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CalendarDays, TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  categories: { name: string; color: string };
  cards: { name: string };
}

interface StockTransaction {
  id: string;
  symbol: string;
  shares: number;
  price_per_share: number;
  total_amount: number;
  transaction_type: string;
  transaction_date: string;
}

interface Holding {
  symbol: string;
  shares: number;
  average_price: number;
  total_cost: number;
}

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch transactions with filtering
      let transactionQuery = supabase
        .from('transactions')
        .select(`
          id,
          amount,
          description,
          transaction_date,
          categories!inner(name, color),
          cards!inner(name)
        `)
        .eq('user_id', user.id);

      if (selectedMonth !== 'all') {
        const startDate = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`;
        const endDate = selectedMonth === '12' 
          ? `${parseInt(selectedYear) + 1}-01-01`
          : `${selectedYear}-${(parseInt(selectedMonth) + 1).toString().padStart(2, '0')}-01`;
        
        transactionQuery = transactionQuery
          .gte('transaction_date', startDate)
          .lt('transaction_date', endDate);
      } else {
        transactionQuery = transactionQuery
          .gte('transaction_date', `${selectedYear}-01-01`)
          .lt('transaction_date', `${parseInt(selectedYear) + 1}-01-01`);
      }

      const { data: transactionsData } = await transactionQuery.order('transaction_date', { ascending: false });

      // Fetch stock transactions
      let stockQuery = supabase
        .from('stock_transactions')
        .select('*')
        .eq('user_id', user.id);

      if (selectedMonth !== 'all') {
        const startDate = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`;
        const endDate = selectedMonth === '12' 
          ? `${parseInt(selectedYear) + 1}-01-01`
          : `${selectedYear}-${(parseInt(selectedMonth) + 1).toString().padStart(2, '0')}-01`;
        
        stockQuery = stockQuery
          .gte('transaction_date', startDate)
          .lt('transaction_date', endDate);
      } else {
        stockQuery = stockQuery
          .gte('transaction_date', `${selectedYear}-01-01`)
          .lt('transaction_date', `${parseInt(selectedYear) + 1}-01-01`);
      }

      const { data: stockTransactionsData } = await stockQuery.order('transaction_date', { ascending: false });

      // Fetch holdings
      const { data: holdingsData } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id)
        .gt('shares', 0);

      setTransactions(transactionsData || []);
      setStockTransactions(stockTransactionsData || []);
      setHoldings(holdingsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const totalExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalStockValue = holdings.reduce((sum, h) => sum + (Number(h.shares) * Number(h.average_price)), 0);
    const stockTransactionsTotal = stockTransactions.reduce((sum, t) => {
      return sum + (t.transaction_type === 'buy' ? Number(t.total_amount) : -Number(t.total_amount));
    }, 0);

    return {
      totalExpenses,
      totalStockValue,
      stockTransactionsTotal,
      netWorth: totalStockValue - totalExpenses
    };
  };

  const getCategoryData = () => {
    const categoryMap = new Map();
    transactions.forEach(t => {
      const category = t.categories.name;
      const existing = categoryMap.get(category) || { name: category, value: 0, color: t.categories.color };
      existing.value += Number(t.amount);
      categoryMap.set(category, existing);
    });
    return Array.from(categoryMap.values());
  };

  const getMonthlyData = () => {
    const monthlyMap = new Map();
    transactions.forEach(t => {
      const month = new Date(t.transaction_date).toLocaleString('default', { month: 'short' });
      const existing = monthlyMap.get(month) || { month, expenses: 0 };
      existing.expenses += Number(t.amount);
      monthlyMap.set(month, existing);
    });

    stockTransactions.forEach(t => {
      const month = new Date(t.transaction_date).toLocaleString('default', { month: 'short' });
      const existing = monthlyMap.get(month) || { month, expenses: 0, stocks: 0 };
      existing.stocks = (existing.stocks || 0) + Number(t.total_amount);
      monthlyMap.set(month, existing);
    });

    return Array.from(monthlyMap.values()).sort((a, b) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });
  };

  const summary = calculateSummary();
  const categoryData = getCategoryData();
  const monthlyData = getMonthlyData();

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = ['2024', '2023', '2022', '2021'];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        <div className="flex gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${summary.totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Portfolio</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.totalStockValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Investments</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${summary.stockTransactionsTotal.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${summary.netWorth.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, '']} />
                <Legend />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                <Bar dataKey="stocks" fill="#10b981" name="Stock Investments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="stocks">Stock Transactions</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-gray-500">
                        {transaction.categories.name} • {transaction.cards.name} • {new Date(transaction.transaction_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-red-600">
                      -${Number(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stockTransactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{transaction.symbol}</div>
                      <div className="text-sm text-gray-500">
                        {transaction.shares} shares @ ${Number(transaction.price_per_share).toFixed(2)} • {new Date(transaction.transaction_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${transaction.transaction_type === 'buy' ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.transaction_type === 'buy' ? '-' : '+'}${Number(transaction.total_amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holdings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {holdings.map((holding, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{holding.symbol}</div>
                      <div className="text-sm text-gray-500">
                        {Number(holding.shares).toFixed(2)} shares @ ${Number(holding.average_price).toFixed(2)} avg
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      ${Number(holding.total_cost).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
