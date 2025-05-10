import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { resetPasswordMutation } = useAuth();
  const [status, setStatus] = useState<"input" | "success" | "error">("input");
  const [token, setToken] = useState<string>("");

  // Set up form
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Extract token on component mount
  useState(() => {
    const pathToken = window.location.pathname.split("/reset-password/")[1];
    if (!pathToken) {
      setStatus("error");
    } else {
      setToken(pathToken);
    }
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    resetPasswordMutation.mutate({
      token,
      password: data.password
    }, {
      onSuccess: () => {
        setStatus("success");
      },
      onError: () => {
        setStatus("error");
      }
    });
  };

  if (status === "success") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Password Reset</CardTitle>
          <CardDescription className="text-center">
            Your password has been updated successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <p className="text-center text-lg font-medium">
            Your password has been reset successfully.
          </p>
          <p className="text-center text-muted-foreground mt-2">
            You can now log in with your new password.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => setLocation("/auth")}
            className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
          >
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Password Reset Failed</CardTitle>
          <CardDescription className="text-center">
            We couldn't process your password reset request
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <XCircle className="h-16 w-16 text-destructive mb-4" />
          <p className="text-center text-lg font-medium">
            Invalid or expired password reset link.
          </p>
          <p className="text-center text-muted-foreground mt-2">
            The link may have expired or is invalid. Please request a new password reset link.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => setLocation("/auth")}
            className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
          >
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Reset Your Password</CardTitle>
        <CardDescription className="text-center">
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter new password" {...field} />
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
                    <Input type="password" placeholder="Confirm new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-secondary hover:bg-secondary-dark text-primary font-bold"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Reset Password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}