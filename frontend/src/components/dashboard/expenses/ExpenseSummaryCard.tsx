
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingDown, CreditCard } from 'lucide-react';

interface ExpenseSummaryCardProps {
  totalExpenses: number;
  transactionCount: number;
}

const ExpenseSummaryCard: React.FC<ExpenseSummaryCardProps> = ({ totalExpenses, transactionCount }) => {
  return (
    <Card className="bg-gradient-to-br from-white/95 to-slate-50/95 backdrop-blur-sm border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:border-blue-200/60 rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">Monthly Expenses</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              ${totalExpenses.toFixed(2)}
            </p>
            <p className="text-sm text-slate-600 flex items-center space-x-1">
              <CreditCard className="h-3 w-3 text-blue-500" />
              <span>{transactionCount} transactions</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-100/50 shadow-sm">
              <TrendingDown className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseSummaryCard;
