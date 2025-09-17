'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Upload, Link, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (avatarUrl) {
        formData.append('avatarUrl', avatarUrl);
      }
      
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      
      // Refresh the page to get updated user data
      window.location.reload();
      
    } catch {
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: 'Please select an image file.',
          variant: 'destructive'
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive'
        });
        return;
      }
      
      setAvatarFile(file);
      setAvatarUrl(''); // Clear URL if file is selected
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <UserAvatar 
                user={{
                  username: user.displayName || 'User',
                  avatar: user.photoURL,
                  provider: user.provider,
                  steamProfile: user.steamProfile
                }} 
                size="xl" 
              />
            </div>
            <CardTitle>{user.displayName || 'User'}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
            {user.provider === 'steam' && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-4 h-4 bg-[#1b2838] rounded flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <span className="text-sm text-muted-foreground">Steam Account</span>
              </div>
            )}
          </CardHeader>
        </Card>
        
        {/* Profile Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Update your profile information and avatar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  disabled={loading}
                />
              </div>
              
              {/* Avatar Settings - Only for non-Steam users */}
              {user.provider !== 'steam' && (
                <div className="space-y-4">
                  <Label>Avatar</Label>
                  <Tabs defaultValue="initials" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="initials">
                        <User className="w-4 h-4 mr-2" />
                        Initials
                      </TabsTrigger>
                      <TabsTrigger value="upload">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </TabsTrigger>
                      <TabsTrigger value="url">
                        <Link className="w-4 h-4 mr-2" />
                        URL
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="initials" className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Your avatar will be generated from your display name initials with a unique color.
                      </p>
                    </TabsContent>
                    
                    <TabsContent value="upload" className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={loading}
                      />
                      <p className="text-sm text-muted-foreground">
                        Upload an image file (max 5MB). Supported formats: JPG, PNG, GIF, WebP.
                      </p>
                      {avatarFile && (
                        <p className="text-sm text-green-600">
                          Selected: {avatarFile.name}
                        </p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="url" className="space-y-2">
                      <Input
                        placeholder="https://example.com/avatar.jpg"
                        value={avatarUrl}
                        onChange={(e) => {
                          setAvatarUrl(e.target.value);
                          setAvatarFile(null); // Clear file if URL is entered
                        }}
                        disabled={loading}
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter a direct link to an image file.
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
              
              {/* Steam Avatar Notice */}
              {user.provider === 'steam' && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-[#1b2838] rounded flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>
                    <h4 className="font-medium">Steam Account</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your avatar is automatically synced from your Steam profile. To change it, update your Steam profile picture.
                  </p>
                </div>
              )}
              
              <Separator />
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}