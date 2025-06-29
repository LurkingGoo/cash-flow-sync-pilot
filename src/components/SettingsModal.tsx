import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, User, Lock, Palette, CreditCard, Upload, Trash2, Plus, Download, Tag } from 'lucide-react';

interface SettingsModalProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

interface Category {
  id: string;
  name: string;
  color: string;
  category_type: string;
}

interface PaymentCard {
  id: string;
  name: string;
  card_type: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ profile, onProfileUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3b82f6', type: 'expense' });
  const [newCard, setNewCard] = useState({ name: '', type: 'debit' });
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    avatar_url: profile?.avatar_url || ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchCards();
    }
  }, [isOpen]);

  useEffect(() => {
    setProfileData({
      full_name: profile?.full_name || '',
      username: profile?.username || '',
      avatar_url: profile?.avatar_url || ''
    });
  }, [profile]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          username: profileData.username,
          avatar_url: profileData.avatar_url
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      onProfileUpdate(data);
      toast({
        title: "Success",
        description: "Profile updated successfully!"
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Success",
        description: "Password updated successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 300x300)
        const maxSize = 300;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // 60% quality
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB before compression)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 2MB",
          variant: "destructive"
        });
        return;
      }

      try {
        const compressedImage = await compressImage(file);
        setProfileData({
          ...profileData,
          avatar_url: compressedImage
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process image",
          variant: "destructive"
        });
      }
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('categories')
        .insert([{
          user_id: user.id,
          name: newCategory.name.trim(),
          color: newCategory.color,
          category_type: newCategory.type
        }]);

      if (error) throw error;

      setNewCategory({ name: '', color: '#3b82f6', type: 'expense' });
      fetchCategories();
      toast({
        title: "Success",
        description: "Category added successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      fetchCategories();
      toast({
        title: "Success",
        description: "Category deleted successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  const handleAddCard = async () => {
    if (!newCard.name.trim()) {
      toast({
        title: "Error",
        description: "Payment method name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('cards')
        .insert([{
          user_id: user.id,
          name: newCard.name.trim(),
          card_type: newCard.type
        }]);

      if (error) throw error;

      setNewCard({ name: '', type: 'debit' });
      fetchCards();
      toast({
        title: "Success",
        description: "Payment method added successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      fetchCards();
      toast({
        title: "Success",
        description: "Payment method deleted successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete payment method",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async (type: 'expenses' | 'stocks' | 'overview') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let data;
      let filename;

      switch (type) {
        case 'expenses':
          const { data: expenseData } = await supabase
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
          
          data = expenseData;
          filename = 'expenses.csv';
          break;
        
        case 'stocks':
          const { data: stockData } = await supabase
            .from('stock_transactions')
            .select(`
              symbol,
              shares,
              price_per_share,
              total_amount,
              transaction_type,
              transaction_date
            `)
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: false });
          
          data = stockData;
          filename = 'stocks.csv';
          break;
        
        default:
          toast({
            title: "Info",
            description: "Export feature coming soon!"
          });
          return;
      }

      if (data && data.length > 0) {
        const csv = convertToCSV(data);
        downloadCSV(csv, filename);
        toast({
          title: "Success",
          description: "Data exported successfully!"
        });
      } else {
        toast({
          title: "Info",
          description: "No data to export"
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

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'object' && value !== null 
          ? JSON.stringify(value).replace(/"/g, '""')
          : `"${String(value).replace(/"/g, '""')}"`
      ).join(',')
    ).join('\n');
    
    return headers + '\n' + rows;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-slate-600 hover:text-slate-700 hover:bg-slate-100/80 rounded-xl transition-all duration-300 transform hover:scale-105"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-slate-200/60 shadow-xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Settings</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100/80 rounded-xl backdrop-blur-sm">
            <TabsTrigger value="profile" className="rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Lock className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Palette className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-slate-200/60 rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20 shadow-lg border-2 border-slate-200/60">
                      <AvatarImage src={profileData.avatar_url} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 text-lg font-semibold">
                        {profileData.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all duration-200 border border-blue-200/60">
                          <Upload className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">Upload Photo</span>
                        </div>
                      </Label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {profileData.avatar_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setProfileData({ ...profileData, avatar_url: '' })}
                          className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name" className="text-slate-700 font-medium">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        className="rounded-xl border-slate-200/60 hover:border-blue-300 focus:border-blue-400 bg-white/90 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username" className="text-slate-700 font-medium">Username</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                        placeholder="@username"
                        className="rounded-xl border-slate-200/60 hover:border-blue-300 focus:border-blue-400 bg-white/90 transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-slate-200/60 rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="new_password" className="text-slate-700 font-medium">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="rounded-xl border-slate-200/60 hover:border-blue-300 focus:border-blue-400 bg-white/90 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm_password" className="text-slate-700 font-medium">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-xl border-slate-200/60 hover:border-blue-300 focus:border-blue-400 bg-white/90 transition-all duration-200"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            {/* Categories Management */}
            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-slate-200/60 rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2 text-slate-900">
                  <Tag className="h-5 w-5 text-blue-600" />
                  <span>Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="flex-1 border-slate-200/60 hover:border-blue-300 focus:border-blue-400 bg-white/90 rounded-xl transition-all duration-200"
                  />
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-12 h-12 rounded-xl border border-slate-200/60 cursor-pointer"
                  />
                  <select
                    value={newCategory.type}
                    onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                    className="px-3 py-2 border border-slate-200/60 rounded-xl bg-white/90 transition-all duration-200 hover:border-blue-300 focus:border-blue-400"
                  >
                    <option value="expense">Expense</option>
                    <option value="stock">Stock</option>
                  </select>
                  <Button onClick={handleAddCategory} size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded-xl border-slate-200/60 bg-white/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm text-slate-700 font-medium">{category.name}</span>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">{category.category_type}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Management */}
            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-slate-200/60 rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2 text-slate-900">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Payment Methods</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Payment method name"
                    value={newCard.name}
                    onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                    className="flex-1 border-slate-200/60 hover:border-blue-300 focus:border-blue-400 bg-white/90 rounded-xl transition-all duration-200"
                  />
                  <select
                    value={newCard.type}
                    onChange={(e) => setNewCard({ ...newCard, type: e.target.value })}
                    className="px-3 py-2 border border-slate-200/60 rounded-xl bg-white/90 transition-all duration-200 hover:border-blue-300 focus:border-blue-400"
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                    <option value="cash">Cash</option>
                  </select>
                  <Button onClick={handleAddCard} size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {cards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between p-3 border rounded-xl border-slate-200/60 bg-white/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-700 font-medium">{card.name}</span>
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">{card.card_type}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Data */}
            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-slate-200/60 rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Export Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Export your financial data for external analysis or backup.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportData('expenses')}
                    className="flex-col space-y-2 h-20 rounded-xl hover:shadow-md transition-all duration-300 transform hover:scale-105 border-slate-200/60 hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-slate-600">Export</span>
                    <span className="font-semibold text-slate-900">Expenses</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportData('stocks')}
                    className="flex-col space-y-2 h-20 rounded-xl hover:shadow-md transition-all duration-300 transform hover:scale-105 border-slate-200/60 hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-slate-600">Export</span>
                    <span className="font-semibold text-slate-900">Stocks</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportData('overview')}
                    className="flex-col space-y-2 h-20 rounded-xl hover:shadow-md transition-all duration-300 transform hover:scale-105 border-slate-200/60 hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-slate-600">Export</span>
                    <span className="font-semibold text-slate-900">Overview</span>
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
