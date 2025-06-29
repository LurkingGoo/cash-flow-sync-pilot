
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingDown, CreditCard } from 'lucide-react';

interface ExpenseSummaryCardProps {
  totalExpenses: number;
  transactionCount: number;
}

const ExpenseSummaryCard: React.FC<ExpenseSummaryCardProps> = ({ totalExpenses, transactionCount }) => {
  return (
    <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:border-slate-300/60">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">Monthly Expenses</p>
            <p className="text-3xl font-bold text-slate-900 mb-2">${totalExpenses.toFixed(2)}</p>
            <p className="text-sm text-slate-600 flex items-center space-x-1">
              <CreditCard className="h-3 w-3" />
              <span>{transactionCount} transactions</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <TrendingDown className="h-8 w-8 text-slate-600" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseSummaryCard;
