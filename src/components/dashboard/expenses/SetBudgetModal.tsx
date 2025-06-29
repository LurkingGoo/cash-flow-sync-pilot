
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Target } from 'lucide-react';

interface SetBudgetModalProps {
  currentBudget: number;
  onBudgetSet: (budget: number) => void;
}

const SetBudgetModal: React.FC<SetBudgetModalProps> = ({ currentBudget, onBudgetSet }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(currentBudget.toString());
  const { toast } = useToast();

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentDate = new Date();
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      const { data: existingBudget } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .single();

      if (existingBudget) {
        await supabase
          .from('budgets')
          .update({ amount: parseFloat(budgetAmount) })
          .eq('id', existingBudget.id);
      } else {
        await supabase
          .from('budgets')
          .insert([{
            user_id: user.id,
            amount: parseFloat(budgetAmount),
            month_year: monthYear
          }]);
      }

      onBudgetSet(parseFloat(budgetAmount));
      setBudgetAmount('');
      setIsOpen(false);
      
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm rounded-xl transition-all duration-200 hover:shadow-md">
          <Target className="w-4 h-4 mr-2" />
          Set Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Set Monthly Budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSetBudget} className="space-y-4">
          <div>
            <Label htmlFor="budget" className="text-slate-700">Budget Amount</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              placeholder="1000.00"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              className="bg-white border-slate-200 hover:border-slate-300 focus:border-slate-400"
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-700 transition-all duration-200"
          >
            {loading ? 'Setting...' : 'Set Budget'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SetBudgetModal;
