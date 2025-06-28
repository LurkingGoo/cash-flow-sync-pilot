
import React, { useState } from 'react';
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
import { Settings, User, Lock, Palette, CreditCard, Upload, Trash2, Plus } from 'lucide-react';

interface SettingsModalProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ profile, onProfileUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    avatar_url: profile?.avatar_url || ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a data URL for the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData({
          ...profileData,
          avatar_url: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200 transform hover:scale-105"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 rounded-xl">
            <TabsTrigger value="profile" className="rounded-lg">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg">
              <Lock className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg">
              <Palette className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg">Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileData.avatar_url} />
                      <AvatarFallback className="bg-slate-200 text-slate-600 text-lg">
                        {profileData.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">Upload Photo</span>
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
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                        placeholder="@username"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg">Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Categories & Payment Methods</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Manage your expense categories and payment methods for better organization.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col space-y-2 rounded-xl hover:shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Category</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col space-y-2 rounded-xl hover:shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Add Payment Method</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg">Export Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Export your financial data for external analysis or backup.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-col space-y-2 h-20 rounded-xl hover:shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <span className="text-xs">Export</span>
                    <span className="font-semibold">Expenses</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-col space-y-2 h-20 rounded-xl hover:shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <span className="text-xs">Export</span>
                    <span className="font-semibold">Stocks</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-col space-y-2 h-20 rounded-xl hover:shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <span className="text-xs">Export</span>
                    <span className="font-semibold">Overview</span>
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
