
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, CreditCard, Palette, Download, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  color: string;
  category_type: string;
}

interface Card {
  id: string;
  name: string;
  card_type: string;
  is_active: boolean;
}

const SettingsModal = () => {
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#6B7280', type: 'expense' });
  const [newCard, setNewCard] = useState({ name: '', type: 'debit' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || user.email || ''
        });
      }

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      setCategories(categoriesData || []);

      // Fetch cards
      const { data: cardsData } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      setCards(cardsData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategory.name.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('categories')
        .insert([{
          user_id: user.id,
          name: newCategory.name,
          color: newCategory.color,
          category_type: newCategory.type
        }]);

      if (error) throw error;

      setNewCategory({ name: '', color: '#6B7280', type: 'expense' });
      fetchUserData();
      toast({
        title: "Category added",
        description: "New category has been created successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      fetchUserData();
      toast({
        title: "Category deleted",
        description: "Category has been removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  const addCard = async () => {
    if (!newCard.name.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('cards')
        .insert([{
          user_id: user.id,
          name: newCard.name,
          card_type: newCard.type
        }]);

      if (error) throw error;

      setNewCard({ name: '', type: 'debit' });
      fetchUserData();
      toast({
        title: "Payment method added",
        description: "New payment method has been created successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive"
      });
    }
  };

  const toggleCard = async (cardId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ is_active: !isActive })
        .eq('id', cardId);

      if (error) throw error;

      fetchUserData();
      toast({
        title: isActive ? "Payment method disabled" : "Payment method enabled",
        description: "Payment method status updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment method",
        variant: "destructive"
      });
    }
  };

  const exportData = async (type: 'expenses' | 'stocks' | 'overview') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let data: any[] = [];
      let filename = '';

      if (type === 'expenses') {
        const { data: transactions } = await supabase
          .from('transactions')
          .select(`
            amount,
            description,
            transaction_date,
            categories(name),
            cards(name)
          `)
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false });

        data = transactions?.map(t => ({
          Date: t.transaction_date,
          Description: t.description,
          Amount: t.amount,
          Category: t.categories?.name,
          'Payment Method': t.cards?.name
        })) || [];
        filename = 'lurking-finance-expenses.csv';
      }

      // Convert to CSV
      if (data.length > 0) {
        const csv = [
          Object.keys(data[0]).join(','),
          ...data.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Data exported",
          description: `${type} data exported successfully.`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <Button onClick={updateProfile} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Expense Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  />
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                    className="w-12"
                  />
                  <Button onClick={addCategory}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {categories.filter(c => c.category_type === 'expense').map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span>{category.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Payment Methods</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Payment method name"
                    value={newCard.name}
                    onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                  />
                  <Select value={newCard.type} onValueChange={(value) => setNewCard({...newCard, type: value})}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Debit</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addCard}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {cards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <span className={card.is_active ? 'text-black' : 'text-gray-400'}>
                          {card.name} ({card.card_type})
                        </span>
                        {!card.is_active && <span className="text-xs text-red-500">(Disabled)</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCard(card.id, card.is_active)}
                      >
                        {card.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Export Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <Button onClick={() => exportData('expenses')} className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Expenses (CSV)
                  </Button>
                  <Button onClick={() => exportData('stocks')} className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Stock Transactions (CSV)
                  </Button>
                  <Button onClick={() => exportData('overview')} className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Overview Data (CSV)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
