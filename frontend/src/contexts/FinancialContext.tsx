import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FinancialData {
  totalBalance: number;
  monthlyExpenses: number;
  monthlyBudget: number;
  portfolioValue: number;
  totalCost: number;
  netWorth: number;
  loading: boolean;
}

interface FinancialContextType {
  data: FinancialData;
  refreshData: (selectedMonth?: string) => Promise<void>;
  updateData: (partial: Partial<FinancialData>) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinancialData = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialProvider');
  }
  return context;
};

interface FinancialProviderProps {
  children: React.ReactNode;
  userId: string;
  selectedMonth?: string;
}

export const FinancialProvider: React.FC<FinancialProviderProps> = ({ children, userId, selectedMonth }) => {
  const [data, setData] = useState<FinancialData>({
    totalBalance: 0,
    monthlyExpenses: 0,
    monthlyBudget: 0,
    portfolioValue: 0,
    totalCost: 0,
    netWorth: 0,
    loading: true,
  });

  const fetchFinancialData = useCallback(async (filterMonth?: string) => {
    if (!userId) return;

    setData(prev => ({ ...prev, loading: true }));

    try {
      // Use provided month or selectedMonth or current month
      const monthToUse = filterMonth || selectedMonth || new Date().toISOString().slice(0, 7);
      
      let expensesQuery = supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId);

      // Apply month filter if not "all"
      if (monthToUse !== 'all') {
        // Calculate the correct end date for the month
        const year = parseInt(monthToUse.split('-')[0]);
        const month = parseInt(monthToUse.split('-')[1]);
        const lastDay = new Date(year, month, 0).getDate(); // Get last day of the month
        
        expensesQuery = expensesQuery
          .gte('transaction_date', `${monthToUse}-01`)
          .lte('transaction_date', `${monthToUse}-${lastDay.toString().padStart(2, '0')}`);
      }

      const { data: expenses } = await expensesQuery;

      // Get all-time expenses for net worth calculation
      const { data: allExpenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId);

      // Get portfolio data
      const { data: holdings } = await supabase
        .from('holdings')
        .select('shares, current_price, average_price, total_cost')
        .eq('user_id', userId);

      // Get budget data for the current month (only if not "all")
      let budgetData = null;
      if (monthToUse !== 'all') {
        try {
          const { data, error } = await supabase
            .from('budgets')
            .select('amount')
            .eq('user_id', userId)
            .eq('month_year', monthToUse)
            .maybeSingle(); // Use maybeSingle to avoid errors when no budget exists
          
          if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Budget query error:', error);
          } else {
            budgetData = data;
          }
        } catch (error) {
          console.error('Error fetching budget:', error);
          // Continue without budget data
        }
      }

      // Calculate values
      const monthlyExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const totalExpenses = allExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const monthlyBudget = budgetData?.amount || 0;
      
      const portfolioValue = holdings?.reduce((sum, holding) => 
        sum + (Number(holding.shares) * (Number(holding.current_price) || Number(holding.average_price))), 0) || 0;
      
      const totalCost = holdings?.reduce((sum, holding) => sum + Number(holding.total_cost), 0) || 0;
      
      // Net worth = Portfolio value - Total lifetime expenses
      const netWorth = portfolioValue - totalExpenses;

      setData({
        totalBalance: portfolioValue - monthlyExpenses, // Current balance (portfolio - monthly expenses)
        monthlyExpenses,
        monthlyBudget,
        portfolioValue,
        totalCost,
        netWorth,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [userId, selectedMonth]);

  const updateData = useCallback((partial: Partial<FinancialData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const refreshData = useCallback(async (filterMonth?: string) => {
    await fetchFinancialData(filterMonth);
  }, [fetchFinancialData]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const transactionsSubscription = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshData();
        }
      )
      .subscribe();

    const holdingsSubscription = supabase
      .channel('holdings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'holdings',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshData();
        }
      )
      .subscribe();

    const stockTransactionsSubscription = supabase
      .channel('stock_transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshData();
        }
      )
      .subscribe();

    const budgetsSubscription = supabase
      .channel('budgets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsSubscription);
      supabase.removeChannel(holdingsSubscription);
      supabase.removeChannel(stockTransactionsSubscription);
      supabase.removeChannel(budgetsSubscription);
    };
  }, [userId, refreshData]);

  return (
    <FinancialContext.Provider value={{ data, refreshData, updateData }}>
      {children}
    </FinancialContext.Provider>
  );
};
