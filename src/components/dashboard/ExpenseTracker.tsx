import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollWheelSelect, ScrollWheelSelectContent, ScrollWheelSelectItem, ScrollWheelSelectTrigger, ScrollWheelSelectValue } from '@/components/ui/scroll-wheel-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Filter, Search, Calendar, CreditCard, TrendingDown, Target, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  categories: { name: string; color: string };
  cards: { name: string };
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Card {
  id: string;
  name: string;
}

const ExpenseTracker = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budget, setBudget] = useState<number>(0);
  const [hoveredCategory, setHoveredCategory] = useState<any>(null);
  const { toast } = useToast();
  const pieChartRef = useRef<HTMLDivElement>(null);

  // Form state
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    category_id: '',
    card_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedMonth, selectedCategory, searchTerm]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [transactionsData, categoriesData, cardsData] = await Promise.all([
        supabase
          .from('transactions')
          .select(`
            id,
            amount,
            description,
            transaction_date,
            categories!inner(name, color),
            cards!inner(name)
          `)
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false }),
        
        supabase
          .from('categories')
          .select('id, name, color')
          .eq('user_id', user.id)
          .eq('category_type', 'expense'),
        
        supabase
          .from('cards')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('is_active', true)
      ]);

      setTransactions(transactionsData.data || []);
      setCategories(categoriesData.data || []);
      setCards(cardsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-');
      filtered = filtered.filter(t => {
        const date = new Date(t.transaction_date);
        return date.getFullYear().toString() === year && 
               (date.getMonth() + 1).toString().padStart(2, '0') === month;
      });
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.categories.name === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          amount: parseFloat(newTransaction.amount),
          description: newTransaction.description,
          category_id: newTransaction.category_id,
          card_id: newTransaction.card_id,
          transaction_date: newTransaction.transaction_date
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction added successfully!"
      });

      setNewTransaction({
        amount: '',
        description: '',
        category_id: '',
        card_id: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });

      setIsAddingTransaction(false);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive"
      });
    }
  };

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentDate = new Date();
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      // Check if budget exists for current month
      const { data: existingBudget } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .single();

      if (existingBudget) {
        // Update existing budget
        await supabase
          .from('budgets')
          .update({ amount: parseFloat(budgetAmount) })
          .eq('id', existingBudget.id);
      } else {
        // Create new budget
        await supabase
          .from('budgets')
          .insert([{
            user_id: user.id,
            amount: parseFloat(budgetAmount),
            month_year: monthYear,
            category_id: categories[0]?.id // Default to first category
          }]);
      }

      setBudget(parseFloat(budgetAmount));
      setBudgetAmount('');
      setIsSettingBudget(false);
      
      toast({
        title: "Success",
        description: "Budget set successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set budget",
        variant: "destructive"
      });
    }
  };

  const fetchBudget = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentDate = new Date();
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      const { data } = await supabase
        .from('budgets')
        .select('amount')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .single();

      if (data) {
        setBudget(data.amount);
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, []);

  const getCategoryData = () => {
    const categoryMap = new Map();
    filteredTransactions.forEach(t => {
      const category = t.categories.name;
      const existing = categoryMap.get(category) || { 
        name: category, 
        value: 0, 
        color: t.categories.color,
        count: 0
      };
      existing.value += Number(t.amount);
      existing.count += 1;
      categoryMap.set(category, existing);
    });
    return Array.from(categoryMap.values());
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl p-4 shadow-xl">
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <p className="font-semibold text-slate-900">{data.name}</p>
          </div>
          <p className="text-slate-600">Amount: <span className="font-semibold text-slate-900">${data.value.toFixed(2)}</span></p>
          <p className="text-slate-600">Transactions: <span className="font-semibold text-slate-900">{data.count}</span></p>
          <p className="text-slate-600">
            Percentage: <span className="font-semibold text-slate-900">
              {((data.value / totalExpenses) * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getBudgetStatus = () => {
    if (!budget) return null;
    const percentage = (totalExpenses / budget) * 100;
    
    if (percentage > 100) {
      return { status: 'over', color: 'text-red-600', icon: AlertTriangle, message: 'Over budget' };
    } else if (percentage > 80) {
      return { status: 'warning', color: 'text-yellow-600', icon: Target, message: 'Near budget limit' };
    } else {
      return { status: 'good', color: 'text-green-600', icon: CheckCircle, message: 'Within budget' };
    }
  };

  const getMonthlyData = () => {
    const monthlyMap = new Map();
    filteredTransactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(t.amount));
    });
    
    const sortedEntries = Array.from(monthlyMap.entries()).sort((a, b) => {
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateA.getTime() - dateB.getTime();
    });
    
    return sortedEntries.map(([month, amount]) => ({ month, amount }));
  };

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '2024-01', label: 'January 2024' },
    { value: '2024-02', label: 'February 2024' },
    { value: '2024-03', label: 'March 2024' },
    { value: '2024-04', label: 'April 2024' },
    { value: '2024-05', label: 'May 2024' },
    { value: '2024-06', label: 'June 2024' },
    { value: '2024-07', label: 'July 2024' },
    { value: '2024-08', label: 'August 2024' },
    { value: '2024-09', label: 'September 2024' },
    { value: '2024-10', label: 'October 2024' },
    { value: '2024-11', label: 'November 2024' },
    { value: '2024-12', label: 'December 2024' }
  ];

  const CategoryScrollSelect = ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => (
    <ScrollWheelSelect value={value} onValueChange={onValueChange}>
      <ScrollWheelSelectTrigger className="w-full">
        <ScrollWheelSelectValue placeholder="Select category" />
      </ScrollWheelSelectTrigger>
      <ScrollWheelSelectContent>
        {categories.map(category => (
          <ScrollWheelSelectItem key={category.id} value={category.id}>
            <div className="flex items-center space-x-2 w-full">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: category.color }}
              ></div>
              <span className="truncate">{category.name}</span>
            </div>
          </ScrollWheelSelectItem>
        ))}
      </ScrollWheelSelectContent>
    </ScrollWheelSelect>
  );

  const PaymentScrollSelect = ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => (
    <ScrollWheelSelect value={value} onValueChange={onValueChange}>
      <ScrollWheelSelectTrigger className="w-full">
        <ScrollWheelSelectValue placeholder="Select payment method" />
      </ScrollWheelSelectTrigger>
      <ScrollWheelSelectContent>
        {cards.map(card => (
          <ScrollWheelSelectItem key={card.id} value={card.id}>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-3 w-3" />
              <span>{card.name}</span>
            </div>
          </ScrollWheelSelectItem>
        ))}
      </ScrollWheelSelectContent>
    </ScrollWheelSelect>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const totalExpenses = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const categoryData = getCategoryData();
  const monthlyData = getMonthlyData();
  const budgetStatus = getBudgetStatus();

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Expense Tracker</h2>
          <div className="flex items-center space-x-4">
            <p className="text-slate-600">
              Total Expenses: <span className="font-semibold text-slate-800">${totalExpenses.toFixed(2)}</span>
            </p>
            {budget > 0 && budgetStatus && (
              <div className="flex items-center space-x-2">
                <budgetStatus.icon className={`h-4 w-4 ${budgetStatus.color}`} />
                <span className={`text-sm font-medium ${budgetStatus.color}`}>
                  ${totalExpenses.toFixed(2)} of ${budget.toFixed(2)} ({((totalExpenses / budget) * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Dialog open={isSettingBudget} onOpenChange={setIsSettingBudget}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm rounded-xl transition-all duration-200 hover:shadow-md">
                <Target className="w-4 h-4 mr-2" />
                Set Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Set Monthly Budget</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSetBudget} className="space-y-4">
                <div>
                  <Label htmlFor="budget">Budget Amount</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Set Budget</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
            <DialogTrigger asChild>
              <Button className="bg-slate-800 hover:bg-slate-700 shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl transform hover:scale-105">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="25.50"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Coffee, lunch, etc."
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <CategoryScrollSelect 
                    value={newTransaction.category_id} 
                    onValueChange={(value) => setNewTransaction({...newTransaction, category_id: value})}
                  />
                </div>
                <div>
                  <Label htmlFor="card">Payment Method</Label>
                  <PaymentScrollSelect 
                    value={newTransaction.card_id} 
                    onValueChange={(value) => setNewTransaction({...newTransaction, card_id: value})}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newTransaction.transaction_date}
                    onChange={(e) => setNewTransaction({...newTransaction, transaction_date: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Add Transaction</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Budget Progress Card */}
      {budget > 0 && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-200 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Monthly Budget</p>
                  <p className="text-xl font-bold text-slate-900">${budget.toFixed(2)}</p>
                </div>
              </div>
              {budgetStatus && (
                <Badge variant={budgetStatus.status === 'over' ? 'destructive' : budgetStatus.status === 'warning' ? 'default' : 'secondary'}>
                  {budgetStatus.message}
                </Badge>
              )}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  budgetStatus?.status === 'over' ? 'bg-red-500' : 
                  budgetStatus?.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((totalExpenses / budget) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-slate-600 mt-2">
              <span>${totalExpenses.toFixed(2)} spent</span>
              <span>${(budget - totalExpenses).toFixed(2)} remaining</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Monthly Expenses</p>
              <p className="text-3xl font-bold text-slate-900">${totalExpenses.toFixed(2)}</p>
              <p className="text-sm text-slate-600 mt-1">{filteredTransactions.length} transactions</p>
            </div>
            <div className="flex items-center space-x-4">
              <TrendingDown className="h-12 w-12 text-slate-600" />
              <CreditCard className="h-8 w-8 text-slate-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-500" />
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
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-60"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-900 flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <span>Expenses by Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="w-full min-h-[400px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    onMouseEnter={(data) => setHoveredCategory(data)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || '#64748b'} 
                        className="cursor-pointer transition-all duration-200 hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Category Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryData.map((category, index) => (
                <HoverCard key={index}>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-all duration-200 transform hover:scale-105">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium text-slate-700 truncate">{category.name}</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64 bg-white/95 backdrop-blur-xl border-slate-200">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-900">{category.name}</h4>
                      <p className="text-sm text-slate-600">Amount: ${category.value.toFixed(2)}</p>
                      <p className="text-sm text-slate-600">Transactions: {category.count}</p>
                      <p className="text-sm text-slate-600">
                        Percentage: {((category.value / totalExpenses) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-900">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="w-full" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="amount" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.slice(0, 10).map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: transaction.categories.color }}
                          ></div>
                          <span className="text-sm">{transaction.categories.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{transaction.cards.name}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        -${Number(transaction.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No transactions found. Try adjusting your filters or add your first expense!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseTracker;
