import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Settings, UserCog, Globe, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CurrencyPreference from '@/components/settings/CurrencyPreference';
import CurrencyConverter from '@/components/wallet/CurrencyConverter';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { getQueryFn } from '@/lib/queryClient';

const SettingsPage = () => {
  const { toast } = useToast();

  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: getQueryFn()
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Handle the case where user data couldn't be loaded
    toast({
      title: 'Error',
      description: 'Could not load user settings. Please try again.',
      variant: 'destructive'
    });
    
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p>Failed to load settings</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
        icon={<Settings className="h-6 w-6" />}
      />

      <Tabs defaultValue="account" className="mt-6">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Currency</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <span>Language</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Profile information card would go here */}
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium mb-4">Profile Information</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Username:</span> {user.username}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {user.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Account Status:</span>{' '}
                  {user.isActive ? 'Active' : 'Inactive'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email Verified:</span>{' '}
                  {user.emailVerified ? 'Yes' : 'No'}
                </p>
              </div>
              <Button className="mt-4" variant="outline" size="sm">
                Edit Profile
              </Button>
            </div>

            {/* Security settings card would go here */}
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium mb-4">Security</h3>
              <p className="text-sm mb-4">
                Manage your password and account security settings
              </p>
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="currency" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Currency Preference */}
            <CurrencyPreference user={user} />
            
            {/* Currency Converter */}
            <CurrencyConverter />
          </div>
        </TabsContent>

        <TabsContent value="language" className="space-y-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Language Settings</h3>
            <p className="text-sm mb-4 text-muted-foreground">
              Language settings will be available in a future update.
            </p>
            <Button variant="outline" disabled>
              Change Language
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;