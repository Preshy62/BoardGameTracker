import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginProps {
  isDemo?: boolean;
}

export default function Login({ isDemo = false }: LoginProps) {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  const { toast } = useToast();
  
  // Redirect if already logged in, but not if we're in demo mode
  // (demo mode automatic login is handled in the parent component)
  useEffect(() => {
    if (user && !isDemo) {
      setLocation("/");
    }
  }, [user, isDemo, setLocation]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    console.log('Login form submitted with data:', data);
    loginMutation.mutate(data, {
      onSuccess: (userData) => {
        console.log('Login successful. User data:', userData);
      },
      onError: (error) => {
        console.error('Login error:', error);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-sans">
            <span className="text-secondary">BIG BOYS</span> GAME
          </h1>
          {isDemo ? (
            <div>
              <p className="text-gray-600 mt-2">Creating your demo account</p>
              <div className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <span className="inline-block animate-pulse mr-1">⚡</span> Starting demo game...
              </div>
            </div>
          ) : (
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-secondary hover:bg-secondary-dark text-primary font-bold"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2" />
                  ) : null}
                  Sign In
                </Button>
                
                <div className="mt-4 relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300"></span>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold"
                  onClick={() => {
                    // Create and log in with a demo account
                    console.log('Demo login clicked');
                    loginMutation.mutate({
                      username: "demo",
                      password: "demo123"
                    }, {
                      onSuccess: (userData) => {
                        console.log('Demo login successful. User data:', userData);
                      },
                      onError: (error) => {
                        console.error('Demo login error:', error);
                      }
                    });
                  }}
                  disabled={loginMutation.isPending}
                >
                  Quick Demo Login
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
