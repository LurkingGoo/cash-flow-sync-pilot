
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertTriangle, Target, CheckCircle } from 'lucide-react';

interface BudgetCardProps {
  budget: number;
  totalExpenses: number;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budget, totalExpenses }) => {
  if (budget <= 0) return null;

  const getBudgetStatus = () => {
    const percentage = (totalExpenses / budget) * 100;
    
    if (percentage > 100) {
      return { status: 'over', color: 'text-red-600', icon: AlertTriangle, message: 'Over budget', bgColor: 'bg-red-500' };
    } else if (percentage > 80) {
      return { status: 'warning', color: 'text-amber-600', icon: Target, message: 'Near budget limit', bgColor: 'bg-amber-500' };
    } else {
      return { status: 'good', color: 'text-emerald-600', icon: CheckCircle, message: 'Within budget', bgColor: 'bg-emerald-500' };
    }
  };

  const budgetStatus = getBudgetStatus();
  const StatusIcon = budgetStatus.icon;

  return (
    <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:border-slate-300/60">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-100 p-2.5 rounded-xl">
              <DollarSign className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Monthly Budget</p>
              <p className="text-2xl font-bold text-slate-900">${budget.toFixed(2)}</p>
            </div>
          </div>
          <Badge 
            variant={budgetStatus.status === 'over' ? 'destructive' : budgetStatus.status === 'warning' ? 'default' : 'secondary'}
            className="flex items-center space-x-1"
          >
            <StatusIcon className="h-3 w-3" />
            <span>{budgetStatus.message}</span>
          </Badge>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-700 ${budgetStatus.bgColor}`}
            style={{ width: `${Math.min((totalExpenses / budget) * 100, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-slate-600 mt-3">
          <span className="font-medium">${totalExpenses.toFixed(2)} spent</span>
          <span className={`font-medium ${totalExpenses > budget ? 'text-red-600' : 'text-slate-600'}`}>
            ${Math.abs(budget - totalExpenses).toFixed(2)} {totalExpenses > budget ? 'over' : 'remaining'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetCard;
