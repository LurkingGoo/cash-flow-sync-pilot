
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollWheelSelect, ScrollWheelSelectContent, ScrollWheelSelectItem, ScrollWheelSelectTrigger, ScrollWheelSelectValue } from '@/components/ui/scroll-wheel-select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, CreditCard } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Card {
  id: string;
  name: string;
}

interface AddExpenseModalProps {
  categories: Category[];
  cards: Card[];
  onTransactionAdded: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ categories, cards, onTransactionAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    category_id: '',
    card_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
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

      setIsOpen(false);
      onTransactionAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl transform hover:scale-105">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-slate-200/60 shadow-xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-lg font-semibold">Add New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div>
            <Label htmlFor="amount" className="text-slate-700 font-medium">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="25.50"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
              className="bg-white/90 border-slate-200/60 hover:border-blue-300 focus:border-blue-400 rounded-xl transition-all duration-200"
              required
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-slate-700 font-medium">Description</Label>
            <Input
              id="description"
              placeholder="Coffee, lunch, etc."
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
              className="bg-white/90 border-slate-200/60 hover:border-blue-300 focus:border-blue-400 rounded-xl transition-all duration-200"
              required
            />
          </div>
          <div>
            <Label htmlFor="category" className="text-slate-700 font-medium">Category</Label>
            <ScrollWheelSelect 
              value={newTransaction.category_id} 
              onValueChange={(value) => setNewTransaction({...newTransaction, category_id: value})}
            >
              <ScrollWheelSelectTrigger className="w-full">
                <ScrollWheelSelectValue placeholder="Select category" />
              </ScrollWheelSelectTrigger>
              <ScrollWheelSelectContent>
                {categories.map(category => (
                  <ScrollWheelSelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-3 w-full">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="truncate font-medium">{category.name}</span>
                    </div>
                  </ScrollWheelSelectItem>
                ))}
              </ScrollWheelSelectContent>
            </ScrollWheelSelect>
          </div>
          <div>
            <Label htmlFor="card" className="text-slate-700 font-medium">Payment Method</Label>
            <ScrollWheelSelect 
              value={newTransaction.card_id} 
              onValueChange={(value) => setNewTransaction({...newTransaction, card_id: value})}
            >
              <ScrollWheelSelectTrigger className="w-full">
                <ScrollWheelSelectValue placeholder="Select payment method" />
              </ScrollWheelSelectTrigger>
              <ScrollWheelSelectContent>
                {cards.map(card => (
                  <ScrollWheelSelectItem key={card.id} value={card.id}>
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{card.name}</span>
                    </div>
                  </ScrollWheelSelectItem>
                ))}
              </ScrollWheelSelectContent>
            </ScrollWheelSelect>
          </div>
          <div>
            <Label htmlFor="date" className="text-slate-700 font-medium">Date</Label>
            <Input
              id="date"
              type="date"
              value={newTransaction.transaction_date}
              onChange={(e) => setNewTransaction({...newTransaction, transaction_date: e.target.value})}
              className="bg-white/90 border-slate-200/60 hover:border-blue-300 focus:border-blue-400 rounded-xl transition-all duration-200"
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;
