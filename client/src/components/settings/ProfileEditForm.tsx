import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countries, currencies, getPrimaryCurrencyForCountry } from '@/lib/countryData';

// User type definition that matches our components
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

// Profile edit form schema
const profileFormSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  avatarInitials: z.string().max(2, { message: "Avatar initials must be max 2 characters" }).optional(),
  emailNotifications: z.boolean().optional(),
  countryCode: z.string().min(2, { message: "Please select a country" }),
  preferredCurrency: z.string().min(3).max(3).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileEditFormProps {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

const ProfileEditForm = ({ user, onCancel, onSuccess }: ProfileEditFormProps) => {
  const { toast } = useToast();
  const [showCurrencyUpdatePrompt, setShowCurrencyUpdatePrompt] = useState(false);
  
  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      avatarInitials: user.avatarInitials || user.username.substring(0, 2).toUpperCase(),
      emailNotifications: user.emailNotifications || false,
      countryCode: user.countryCode || 'NG', // Default to Nigeria if not set
    },
  });

  // Watch country changes to handle currency updates
  const countryCode = form.watch('countryCode');
  
  useEffect(() => {
    const previousCountry = user.countryCode;
    // If country changed and user had the local currency as preferred
    if (previousCountry && countryCode !== previousCountry) {
      const previousCurrency = getPrimaryCurrencyForCountry(previousCountry);
      const newCurrency = getPrimaryCurrencyForCountry(countryCode);
      
      // If their preferred currency was their local one, offer to update it
      if (user.preferredCurrency === previousCurrency) {
        setShowCurrencyUpdatePrompt(true);
      }
    }
  }, [countryCode, user.countryCode, user.preferredCurrency]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues & { updateCurrency?: boolean }) => {
      try {
        // Create a new object with all the values
        const dataToSend: Record<string, any> = { ...values };
        
        // If the currency update was approved or the country changed, update the currency
        if (values.updateCurrency) {
          dataToSend.preferredCurrency = getPrimaryCurrencyForCountry(values.countryCode);
          console.log('Updating currency to match country:', dataToSend.preferredCurrency);
        }
        
        // Remove the temporary updateCurrency field as it's not part of the API
        delete dataToSend.updateCurrency;
        
        console.log('Sending profile update:', dataToSend);
        
        const response = await apiRequest('PATCH', '/api/user/profile', dataToSend);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || 
            `Failed to update profile: ${response.status} ${response.statusText}`
          );
        }
        
        return response.json();
      } catch (error) {
        console.error('Profile update error:', error);
        throw error instanceof Error 
          ? error 
          : new Error('Failed to update profile. Please try again later.');
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
        variant: 'default',
      });
      
      // Invalidate user data to refresh it
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      // Call the success callback
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: ProfileFormValues) => {
    try {
      console.log('Form values to submit:', values);
      
      // If currency update prompt is shown and country changed
      if (showCurrencyUpdatePrompt) {
        const countryName = countries.find(c => c.code === values.countryCode)?.name || values.countryCode;
        const currencyCode = getPrimaryCurrencyForCountry(values.countryCode);
        const currencyName = currencies.find(c => c.code === currencyCode)?.name || currencyCode;
        
        const confirmed = window.confirm(
          `Would you like to update your preferred currency to ${currencyName} (${currencyCode}) to match your new country (${countryName})?`
        );
        
        // Submit with the updateCurrency flag
        updateProfileMutation.mutate({
          ...values,
          updateCurrency: confirmed
        });
        
        // Reset the prompt
        setShowCurrencyUpdatePrompt(false);
      } else {
        updateProfileMutation.mutate(values);
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: 'Submission Error',
        description: 'There was a problem submitting the form. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your email" type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="avatarInitials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar Initials (2 characters max)</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter avatar initials" 
                  maxLength={2}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Your country helps us personalize currency options
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="emailNotifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Email Notifications</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications about game updates and transactions
                </p>
              </div>
            </FormItem>
          )}
        />
        
        <div className="flex gap-2 justify-end pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={updateProfileMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProfileEditForm;