import { useState, useEffect } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { usePaystack } from '@/hooks/use-paystack';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface PaystackButtonProps extends ButtonProps {
  amount: number;
  email: string;
  metadata?: any;
  onSuccess?: (reference: string) => void;
  onCancel?: () => void;
  customReference?: string;
}

export function PaystackButton({
  amount,
  email,
  metadata = {},
  onSuccess,
  onCancel,
  customReference,
  children,
  ...props
}: PaystackButtonProps) {
  const [reference, setReference] = useState('');
  const { initializePayment, isInitialized, isLoading } = usePaystack();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate a reference when component mounts
  useEffect(() => {
    if (customReference) {
      setReference(customReference);
    } else {
      setReference(`BBG-${Date.now()}-${Math.floor(Math.random() * 1000000)}`);
    }
  }, [customReference]);

  const handlePayment = () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please update your profile with an email address to make a payment.',
        variant: 'destructive',
      });
      return;
    }

    // Convert amount to kobo (smallest currency unit in Nigeria)
    const amountInKobo = Math.round(amount * 100);

    initializePayment({
      email,
      amount: amountInKobo,
      ref: reference,
      currency: 'NGN',
      metadata: {
        ...metadata,
        custom_fields: [
          {
            display_name: 'Platform',
            variable_name: 'platform',
            value: 'Big Boys Game',
          },
        ],
      },
      callback: (response) => {
        if (response.status === 'success') {
          toast({
            title: 'Payment Successful',
            description: `Your payment of ₦${amount.toLocaleString()} was successful.`,
          });

          // Refresh user data and transactions
          queryClient.invalidateQueries({ queryKey: ['/api/user'] });
          queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
          
          if (onSuccess) {
            onSuccess(response.reference);
          }
        } else {
          toast({
            title: 'Payment Failed',
            description: response.message || 'Your payment was not successful.',
            variant: 'destructive',
          });
        }
      },
      onClose: () => {
        if (onCancel) {
          onCancel();
        }
      },
    });
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={!isInitialized || isLoading || !email}
      {...props}
    >
      {isLoading ? (
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      {children}
    </Button>
  );
}