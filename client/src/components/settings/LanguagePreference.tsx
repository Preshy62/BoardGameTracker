import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Languages } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Language details type
interface LanguageDetails {
  code: string;
  name: string;
  nativeName: string;
}

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

const LanguagePreference = ({ user }: { user: User }) => {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    user?.language || 'en'
  );

  // Mock languages data (in a real app, this would come from an API)
  const languages: LanguageDetails[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  ];

  // Simulating a loading state for future API integration
  const [isLoading, setIsLoading] = useState(false);

  // This would be replaced with an actual API mutation in the future
  const updateLanguageMutation = useMutation({
    mutationFn: async (language: string) => {
      try {
        // Simulating an API call
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real implementation, this would be:
        // const response = await apiRequest('PATCH', '/api/user/preferences', {
        //   language: language
        // });
        
        // if (!response.ok) {
        //   const errorData = await response.json().catch(() => ({}));
        //   throw new Error(
        //     errorData.message || 
        //     `Failed to update language preference: ${response.status} ${response.statusText}`
        //   );
        // }
        
        // return response.json();
        
        // For now, just return a mock success
        return { success: true };
      } catch (error) {
        console.error('Language preference update error:', error);
        throw error instanceof Error 
          ? error 
          : new Error('Failed to update language preference. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Language Updated',
        description: 'Your language preference has been updated',
        variant: 'default'
      });
      
      // In a real implementation, we would invalidate user data
      // queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Handle language change
  const handleSaveLanguage = () => {
    const currentLanguage = user?.language || 'en';
    
    if (selectedLanguage === currentLanguage) {
      toast({
        title: 'No Changes',
        description: 'The selected language is already your preferred language',
        variant: 'default'
      });
      return;
    }

    // This will be enabled in a future update
    // updateLanguageMutation.mutate(selectedLanguage);
    
    // For now, inform the user this is coming soon
    toast({
      title: 'Coming Soon',
      description: 'Language preferences will be available in a future update.',
      variant: 'default'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Language Preference
        </CardTitle>
        <CardDescription>
          Choose your preferred language for the application interface
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">Preferred Language</Label>
            <Select
              value={selectedLanguage}
              onValueChange={setSelectedLanguage}
              disabled={isLoading}
            >
              <SelectTrigger id="preferredLanguage">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading languages...</span>
                  </div>
                ) : languages.length === 0 ? (
                  <div className="p-2 text-muted-foreground">
                    No languages available
                  </div>
                ) : (
                  languages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name} ({language.nativeName})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Only show help text when user is actually changing their preference */}
          {(user?.language && selectedLanguage !== user.language) && (
            <p className="text-sm text-muted-foreground">
              Changing your preferred language will affect the interface language throughout the application.
            </p>
          )}
          
          {/* Show guidance for new users who haven't set a preference yet */}
          {!user?.language && (
            <p className="text-sm text-muted-foreground">
              Set your preferred language to customize the interface language throughout the application.
            </p>
          )}
          
          <p className="text-sm text-yellow-500 font-medium">
            Note: Language preferences will be available in a future update.
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSaveLanguage}
          disabled={true} // Disabled for now, will be enabled in future
          className="w-full"
        >
          {updateLanguageMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : user?.language ? (
            'Update Language'
          ) : (
            'Set Language'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LanguagePreference;