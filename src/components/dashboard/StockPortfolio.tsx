
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Holding {
  symbol: string;
  shares: number;
  average_price: number;
  total_cost: number;
}

interface StockTransaction {
  id: string;
  symbol: string;
  shares: number;
  price_per_share: number;
  total_amount: number;
  transaction_type: string;
  transaction_date: string;
}

const StockPortfolio = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const { toast } = useToast();

  // Form state
  const [newTransaction, setNewTransaction] = useState({
    symbol: '',
    shares: '',
    price_per_share: '',
    transaction_type: 'buy',
    transaction_date: new Date().toISOString().split('T')[0]
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
          .gt('shares', 0),
        
        supabase
          .from('stock_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })
      ]);

      setHoldings(holdingsData.data || []);
      setStockTransactions(transactionsData.data || []);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalAmount = parseFloat(newTransaction.shares) * parseFloat(newTransaction.price_per_share);

      const { error } = await supabase
        .from('stock_transactions')
        .insert([{
          user_id: user.id,
          symbol: newTransaction.symbol.toUpperCase(),
          shares: parseFloat(newTransaction.shares),
          price_per_share: parseFloat(newTransaction.price_per_share),
          total_amount: totalAmount,
          transaction_type: newTransaction.transaction_type,
          transaction_date: newTransaction.transaction_date
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stock transaction added successfully!"
      });

      setNewTransaction({
        symbol: '',
        shares: '',
        price_per_share: '',
        transaction_type: 'buy',
        transaction_date: new Date().toISOString().split('T')[0]
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

  const calculatePortfolioValue = () => {
    return holdings.reduce((sum, holding) => sum + (Number(holding.shares) * Number(holding.average_price)), 0);
  };

  const calculateTotalGainLoss = () => {
    // This would typically require current market prices
    // For now, we'll use a placeholder calculation
    return Math.random() * 1000 - 500; // Random gain/loss for demo
  };

  const getHoldingsData = () => {
    return holdings.map(holding => ({
      name: holding.symbol,
      value: Number(holding.shares) * Number(holding.average_price),
      shares: Number(holding.shares)
    }));
  };

  const getPerformanceData = () => {
    // Mock performance data - in real app, this would come from market data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      value: Math.random() * 10000 + 5000
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const portfolioValue = calculatePortfolioValue();
  const totalGainLoss = calculateTotalGainLoss();
  const holdingsData = getHoldingsData();
  const performanceData = getPerformanceData();

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Stock Portfolio</h2>
          <p className="text-gray-600">Portfolio Value: ${portfolioValue.toFixed(2)}</p>
        </div>
        
        <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
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
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={newTransaction.symbol}
                  onChange={(e) => setNewTransaction({...newTransaction, symbol: e.target.value})}
                  placeholder="e.g., AAPL"
                  required
                />
              </div>
              <div>
                <Label htmlFor="shares">Shares</Label>
                <Input
                  id="shares"
                  type="number"
                  step="0.01"
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
                  value={newTransaction.price_per_share}
                  onChange={(e) => setNewTransaction({...newTransaction, price_per_share: e.target.value})}
                  required
                />
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

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${portfolioValue.toFixed(2)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              Total holdings value
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${totalGainLoss >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'} shadow-sm`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${totalGainLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              Total Gain/Loss
            </CardTitle>
            {totalGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)}
            </div>
            <p className={`text-xs mt-1 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? 'Profit' : 'Loss'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Holdings</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {holdings.length}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Different stocks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={holdingsData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {holdingsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Value']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Value']} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Current Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{holding.symbol}</TableCell>
                  <TableCell className="text-right">{Number(holding.shares).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${Number(holding.average_price).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${Number(holding.total_cost).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    ${(Number(holding.shares) * Number(holding.average_price)).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockTransactions.slice(0, 10).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{transaction.symbol}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.transaction_type === 'buy' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.transaction_type.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{Number(transaction.shares).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${Number(transaction.price_per_share).toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-semibold ${
                    transaction.transaction_type === 'buy' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.transaction_type === 'buy' ? '-' : '+'}${Number(transaction.total_amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockPortfolio;
