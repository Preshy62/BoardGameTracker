import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaystackButton } from '@/components/payment';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function TestPaystack() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if the Paystack public key is available in the environment
    if (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      setPublicKey(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY);
    }
  }, []);

  return (
    <div className="container mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Paystack Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p>Paystack Public Key Status:</p>
            <pre className="p-2 bg-secondary rounded text-sm">
              {publicKey ? publicKey.slice(0, 10) + '...' : 'Not found'}
            </pre>
          </div>

          {user && (
            <div>
              <p>User Details:</p>
              <pre className="p-2 bg-secondary rounded text-sm">
                ID: {user.id}<br />
                Email: {user.email || 'No email set'}
              </pre>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Button
              onClick={() => {
                toast({
                  title: 'Test Toast',
                  description: 'This is a test toast notification'
                });
              }}
            >
              Test Toast Notification
            </Button>

            {user?.email ? (
              <PaystackButton
                amount={100}
                email={user.email}
                metadata={{ userId: user.id, type: 'test' }}
                onSuccess={(reference) => {
                  toast({
                    title: 'Payment Success',
                    description: `Reference: ${reference}`
                  });
                }}
              >
                Make Test Payment (₦100)
              </PaystackButton>
            ) : (
              <p>You need to be logged in with an email address to test Paystack</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}