
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  categories: { name: string; color: string };
  cards: { name: string };
}

interface TransactionTableProps {
  transactions: Transaction[];
  onTransactionDeleted: () => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onTransactionDeleted }) => {
  const { toast } = useToast();

  const handleDelete = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) {
        throw error;
      }

      toast({
        title: "Transaction deleted",
        description: "The transaction has been successfully deleted.",
      });

      onTransactionDeleted();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg bg-white/90 backdrop-blur-sm border-slate-200/60 hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-slate-900">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-600 font-medium">Date</TableHead>
                <TableHead className="text-slate-600 font-medium">Description</TableHead>
                <TableHead className="text-slate-600 font-medium">Category</TableHead>
                <TableHead className="text-slate-600 font-medium">Payment Method</TableHead>
                <TableHead className="text-right text-slate-600 font-medium">Amount</TableHead>
                <TableHead className="text-center text-slate-600 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.slice(0, 10).map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-slate-50/80 transition-colors duration-200 border-slate-100">
                    <TableCell className="font-medium text-slate-900">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-slate-700">{transaction.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: transaction.categories.color }}
                        />
                        <span className="text-sm text-slate-700">{transaction.categories.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{transaction.cards.name}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      -${Number(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No transactions found. Try adjusting your filters or add your first expense!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionTable;
