
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface StockTransaction {
  id: string;
  symbol: string;
  shares: number;
  price_per_share: number;
  total_amount: number;
  transaction_type: string;
  transaction_date: string;
  notes?: string;
}

interface Holding {
  id: string;
  symbol: string;
  shares: number;
  average_price: number;
  total_cost: number;
  current_price?: number;
}

const StockPortfolio = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const { toast } = useToast();

  // Form state
  const [newTransaction, setNewTransaction] = useState({
    symbol: '',
    shares: '',
    price_per_share: '',
    transaction_type: 'buy',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [holdingsData, transactionsData] = await Promise.all([
        supabase
          .from('holdings')
          .select('*')
          .eq('user_id', user.id)
          .order('symbol'),
        
        supabase
          .from('stock_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })
      ]);

      setHoldings(holdingsData.data || []);
      setTransactions(transactionsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create stock category
      let { data: stockCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('category_type', 'stock')
        .limit(1)
        .single();

      if (!stockCategory) {
        const { data: newCategory } = await supabase
          .from('categories')
          .insert({
            user_id: user.id,
            name: 'Stocks',
            category_type: 'stock',
            color: '#10B981'
          })
          .select()
          .single();
        stockCategory = newCategory;
      }

      const shares = parseFloat(newTransaction.shares);
      const pricePerShare = parseFloat(newTransaction.price_per_share);

      const { error } = await supabase
        .from('stock_transactions')
        .insert([{
          user_id: user.id,
          symbol: newTransaction.symbol.toUpperCase(),
          shares: shares,
          price_per_share: pricePerShare,
          total_amount: shares * pricePerShare,
          transaction_type: newTransaction.transaction_type,
          transaction_date: newTransaction.transaction_date,
          notes: newTransaction.notes,
          category_id: stockCategory.id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Stock transaction added: ${newTransaction.transaction_type.toUpperCase()} ${shares} shares of ${newTransaction.symbol.toUpperCase()}`
      });

      setNewTransaction({
        symbol: '',
        shares: '',
        price_per_share: '',
        transaction_type: 'buy',
        transaction_date: new Date().toISOString().split('T')[0],
        notes: ''
      });

      setIsAddingTransaction(false);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add stock transaction",
        variant: "destructive"
      });
    }
  };

  const getPortfolioValue = () => {
    return holdings.reduce((total, holding) => {
      const currentPrice = holding.current_price || holding.average_price;
      return total + (holding.shares * currentPrice);
    }, 0);
  };

  const getTotalCost = () => {
    return holdings.reduce((total, holding) => total + holding.total_cost, 0);
  };

  const getGainLoss = () => {
    const portfolioValue = getPortfolioValue();
    const totalCost = getTotalCost();
    return portfolioValue - totalCost;
  };

  const getGainLossPercentage = () => {
    const totalCost = getTotalCost();
    if (totalCost === 0) return 0;
    return (getGainLoss() / totalCost) * 100;
  };

  const getHoldingsChartData = () => {
    return holdings.map(holding => ({
      symbol: holding.symbol,
      value: holding.shares * (holding.current_price || holding.average_price),
      shares: holding.shares
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const portfolioValue = getPortfolioValue();
  const totalCost = getTotalCost();
  const gainLoss = getGainLoss();
  const gainLossPercentage = getGainLossPercentage();
  const holdingsChartData = getHoldingsChartData();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock Portfolio</h2>
          <p className="text-gray-600">Track your investment performance</p>
        </div>
        
        <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Stock Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <Label htmlFor="symbol">Stock Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., AAPL, GOOGL, TSLA"
                  value={newTransaction.symbol}
                  onChange={(e) => setNewTransaction({...newTransaction, symbol: e.target.value.toUpperCase()})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shares">Shares</Label>
                  <Input
                    id="shares"
                    type="number"
                    step="0.01"
                    placeholder="10"
                    value={newTransaction.shares}
                    onChange={(e) => setNewTransaction({...newTransaction, shares: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price per Share</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="150.25"
                    value={newTransaction.price_per_share}
                    onChange={(e) => setNewTransaction({...newTransaction, price_per_share: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="type">Transaction Type</Label>
                <Select value={newTransaction.transaction_type} onValueChange={(value) => setNewTransaction({...newTransaction, transaction_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Transaction Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.transaction_date}
                  onChange={(e) => setNewTransaction({...newTransaction, transaction_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Optional notes about this transaction"
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full">Add Transaction</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Portfolio Value</p>
                <p className="text-2xl font-bold text-blue-900">${portfolioValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Cost</p>
                <p className="text-2xl font-bold text-green-900">${totalCost.toFixed(2)}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${gainLoss >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} shadow-lg`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Gain/Loss</p>
                <p className={`text-2xl font-bold ${gainLoss >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                  ${Math.abs(gainLoss).toFixed(2)}
                </p>
              </div>
              {gainLoss >= 0 ? (
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${gainLoss >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} shadow-lg`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Return %</p>
                <p className={`text-2xl font-bold ${gainLoss >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                  {gainLoss >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
                </p>
              </div>
              {gainLoss >= 0 ? (
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={holdingsChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ symbol, percent }) => `${symbol} ${(percent * 100).toFixed(0)}%`}
                  >
                    {holdingsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Value']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Holdings Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {holdings.length > 0 ? (
                holdings.map((holding) => {
                  const currentValue = holding.shares * (holding.current_price || holding.average_price);
                  const gainLoss = currentValue - holding.total_cost;
                  const gainLossPercent = holding.total_cost > 0 ? (gainLoss / holding.total_cost) * 100 : 0;
                  
                  return (
                    <div key={holding.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{holding.symbol}</p>
                        <p className="text-sm text-gray-600">{holding.shares} shares @ ${holding.average_price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${currentValue.toFixed(2)}</p>
                        <p className={`text-sm ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} ({gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No holdings yet. Add your first stock transaction!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
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
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? (
                  transactions.slice(0, 10).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.symbol}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.transaction_type === 'buy' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.transaction_type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.shares}</TableCell>
                      <TableCell>${transaction.price_per_share.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">
                        ${transaction.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {transaction.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No transactions yet. Add your first stock transaction!
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

export default StockPortfolio;
