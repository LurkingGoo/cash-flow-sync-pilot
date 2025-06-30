
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import BudgetCard from './expenses/BudgetCard';
import ExpenseSummaryCard from './expenses/ExpenseSummaryCard';
import ExpenseFilters from './expenses/ExpenseFilters';
import InteractivePieChart from './expenses/InteractivePieChart';
import MonthlyTrendChart from './expenses/MonthlyTrendChart';
import TransactionTable from './expenses/TransactionTable';
import AddExpenseModal from './expenses/AddExpenseModal';
import SetBudgetModal from './expenses/SetBudgetModal';

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
  // Get current month as default
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<number>(0);

  useEffect(() => {
    fetchData();
    fetchBudget();
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

  const handleTransactionDeleted = async () => {
    // Refresh all data after deletion to update all sums and totals
    await fetchData();
    await fetchBudget();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  const totalExpenses = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const categoryData = getCategoryData();
  const monthlyData = getMonthlyData();

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Expense Tracker</h2>
          <p className="text-slate-600">
            Total Expenses: <span className="font-semibold text-slate-800">${totalExpenses.toFixed(2)}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <SetBudgetModal 
            currentBudget={budget}
            onBudgetSet={setBudget}
          />
          <AddExpenseModal 
            categories={categories}
            cards={cards}
            onTransactionAdded={fetchData}
          />
        </div>
      </div>

      {/* Budget and Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseSummaryCard 
          totalExpenses={totalExpenses}
          transactionCount={filteredTransactions.length}
        />
        <BudgetCard 
          budget={budget}
          totalExpenses={totalExpenses}
        />
      </div>

      {/* Filters */}
      <ExpenseFilters 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categories={categories}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractivePieChart 
          categoryData={categoryData}
          totalExpenses={totalExpenses}
        />
        <MonthlyTrendChart monthlyData={monthlyData} />
      </div>

      {/* Transactions Table */}
      <TransactionTable 
        transactions={filteredTransactions} 
        onTransactionDeleted={handleTransactionDeleted}
      />
    </div>
  );
};

export default ExpenseTracker;
