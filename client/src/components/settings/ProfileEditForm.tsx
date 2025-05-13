import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

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
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileEditFormProps {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

const ProfileEditForm = ({ user, onCancel, onSuccess }: ProfileEditFormProps) => {
  const { toast } = useToast();
  
  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      avatarInitials: user.avatarInitials || user.username.substring(0, 2).toUpperCase(),
      emailNotifications: user.emailNotifications || false,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      try {
        const response = await apiRequest('PATCH', '/api/user/profile', values);
        
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
    updateProfileMutation.mutate(values);
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