import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  ref: string;
  currency?: string;
  callback?: (response: PaystackResponse) => void;
  onClose?: () => void;
  metadata?: any;
}

interface PaystackResponse {
  reference: string;
  trans: string;
  status: string;
  message: string;
  transaction: string;
  trxref: string;
}

export function usePaystack() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load Paystack script
  useEffect(() => {
    if (isInitialized) return;

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      setIsInitialized(true);
    };
    script.onerror = () => {
      toast({
        title: 'Payment Error',
        description: 'Failed to load payment processor. Please try again.',
        variant: 'destructive',
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [isInitialized, toast]);

  const initializePayment = (config: Omit<PaystackConfig, 'key'>) => {
    if (!isInitialized) {
      toast({
        title: 'Payment Error',
        description: 'Payment system is still initializing. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!window.PaystackPop) {
      toast({
        title: 'Payment Error',
        description: 'Payment service is unavailable. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      toast({
        title: 'Configuration Error',
        description: 'Payment gateway is not properly configured.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const paystack = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        ...config,
        callback: (response) => {
          setIsLoading(false);
          config.callback?.(response);
        },
        onClose: () => {
          setIsLoading(false);
          toast({
            title: 'Payment Cancelled',
            description: 'You have cancelled the payment process.',
            variant: 'default',
          });
          config.onClose?.();
        },
      });

      paystack.openIframe();
    } catch (error) {
      setIsLoading(false);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'An error occurred while initializing payment.',
        variant: 'destructive',
      });
    }
  };

  return { initializePayment, isInitialized, isLoading };
}