import React, { ReactNode, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Settings, UserCog, Globe, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CurrencyPreference from '@/components/settings/CurrencyPreference';
import LanguagePreference from '@/components/settings/LanguagePreference';
import CurrencyConverter from '@/components/wallet/CurrencyConverter';
import ProfileEditForm from '@/components/settings/ProfileEditForm';
import { Button } from '@/components/ui/button';
import { getQueryFn } from '@/lib/queryClient';

// User type definition based on what our API returns
interface User {
  id: number;
  username: string;
  email: string;
  walletBalance: number;
  preferredCurrency?: string;
  countryCode?: string;
  avatarInitials?: string;
  emailVerified: boolean | null;
  isActive: boolean;
  isAdmin: boolean;
  language?: string | null;
  createdAt?: Date | string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  emailNotifications?: boolean;
}

// Page Header component since we don't want to pull in the common component yet
interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>
    </div>
  );
}

const SettingsPage = () => {
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Fetch user data
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: "returnNull" })
  });
  
  console.log('SettingsPage: User data:', user);

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
            {/* Profile information card */}
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium mb-4">Profile Information</h3>
              
              {isEditingProfile ? (
                <ProfileEditForm 
                  user={user} 
                  onCancel={() => setIsEditingProfile(false)} 
                  onSuccess={() => setIsEditingProfile(false)}
                />
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Username:</span> {user?.username || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {user?.email || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Account Status:</span>{' '}
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email Verified:</span>{' '}
                      {user?.emailVerified ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <Button 
                    className="mt-4" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Edit Profile
                  </Button>
                </>
              )}
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
            <CurrencyConverter user={user} />
          </div>
        </TabsContent>

        <TabsContent value="language" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Language Preference */}
            <LanguagePreference user={user} />
            
            {/* Additional language-related section could go here */}
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium mb-4">Language Support Information</h3>
              <p className="text-sm mb-4 text-muted-foreground">
                We're working on adding more languages to our platform. Your preferred language setting 
                will be applied to all text throughout the application once this feature is fully implemented.
              </p>
              <p className="text-sm text-muted-foreground">
                If you'd like to help with translations or have suggestions for languages to add,
                please contact our support team.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;