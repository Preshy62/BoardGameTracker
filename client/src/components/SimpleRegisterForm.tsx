import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function SimpleRegisterForm() {
  const { registerMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    // Simple registration with only required fields
    const registrationData = {
      username: data.username,
      email: data.email,
      password: data.password,
      countryCode: "NG", // Default to Nigeria
      preferredCurrency: "NGN", // Default to Naira
      language: "en", // Default to English
      avatarInitials: data.username.substring(0, 2).toUpperCase(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Add required timeZone field
    };
    
    console.log("Submitting registration:", registrationData);
    
    registerMutation.mutate(registrationData, {
      onSuccess: () => {
        setRegisteredEmail(data.email);
        setRegistrationSuccess(true);
        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account.",
        });
      },
      onError: (error: Error) => {
        console.error("Registration error:", error);
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  if (registrationSuccess) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-3 mt-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Registration successful!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    A verification email has been sent to <strong>{registeredEmail}</strong>. Please check your email and click the verification link to activate your account.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 mt-4">
              <Button 
                type="button"
                onClick={() => navigate('/auth?tab=login')}
                className="w-full bg-secondary hover:bg-secondary/90 text-primary font-bold flex items-center justify-center"
              >
                Go to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                <Input placeholder="Enter your username" {...field} />
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
                <Input placeholder="Enter your email" {...field} />
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
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormDescription className="text-xs text-gray-500 mt-2">
          By registering, you'll get default settings with Nigerian Naira (₦) as currency and English language.
          You can change these preferences in your account settings after registration.
        </FormDescription>
        
        <Button 
          type="submit" 
          className="w-full mt-6"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          ) : null}
          Create Account
        </Button>
      </form>
    </Form>
  );
}