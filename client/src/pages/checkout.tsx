import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeftCircle, CreditCard, CheckCircle, XCircle, Loader2 } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
}

const CheckoutForm = ({ clientSecret, amount }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setPaymentStatus('processing');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/wallet',
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      setPaymentStatus('error');
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setPaymentStatus('success');
      toast({
        title: "Payment Successful",
        description: `${formatCurrency(amount)} has been added to your wallet`,
      });
      // Navigate back to wallet after 2 seconds
      setTimeout(() => {
        navigate('/wallet');
      }, 2000);
    }
  };

  const handleCancel = () => {
    navigate('/wallet');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentStatus === 'idle' && (
        <>
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <p className="text-blue-800 text-sm">You're about to deposit {formatCurrency(amount)} into your game wallet.</p>
          </div>
          
          <PaymentElement />
          
          <div className="flex gap-4 justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              className="flex items-center"
            >
              <ArrowLeftCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={!stripe || !elements}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pay {formatCurrency(amount)}
            </Button>
          </div>
        </>
      )}
      
      {paymentStatus === 'processing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin w-12 h-12 text-primary mb-4" />
          <h3 className="text-lg font-medium mb-2">Processing your payment...</h3>
          <p className="text-gray-500 text-center">Please don't close this window</p>
        </div>
      )}
      
      {paymentStatus === 'success' && (
        <div className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-12 h-12 text-success mb-4" />
          <h3 className="text-lg font-medium mb-2">Payment Successful!</h3>
          <p className="text-gray-500 text-center mb-6">{formatCurrency(amount)} has been added to your wallet</p>
          <Button onClick={() => navigate('/wallet')} className="bg-primary">
            Return to Wallet
          </Button>
        </div>
      )}
      
      {paymentStatus === 'error' && (
        <div className="flex flex-col items-center justify-center py-12">
          <XCircle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Payment Failed</h3>
          <p className="text-gray-500 text-center mb-2">{errorMessage}</p>
          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setPaymentStatus('idle');
                setErrorMessage(null);
              }}
              className="bg-primary"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};

interface CheckoutProps {
  amount?: string;
}

export default function Checkout({ amount }: CheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [location, navigate] = useLocation();
  
  // Fetch current user
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  useEffect(() => {
    if (!amount || isNaN(parseFloat(amount))) {
      setError("Invalid payment amount");
      setIsLoading(false);
      return;
    }
    
    const numAmount = parseFloat(amount);
    setPaymentAmount(numAmount);
    
    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { amount: numAmount })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Could not create payment intent");
        setIsLoading(false);
      });
  }, [amount]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={user} />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={user} />
        <div className="flex-grow container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Payment Error</CardTitle>
              <CardDescription>There was a problem with your payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <XCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-gray-700 mb-6">{error}</p>
                <Button onClick={() => navigate('/wallet')}>
                  Return to Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Funds</CardTitle>
              <CardDescription>
                Add money to your game wallet using Stripe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm clientSecret={clientSecret} amount={paymentAmount} />
                </Elements>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
