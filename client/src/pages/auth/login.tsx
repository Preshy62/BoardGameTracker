import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
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
import { AlertTriangle, Check, Loader2, Mail } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Additional schema for verification and password reset
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface LoginProps {
  isDemo?: boolean;
}

export default function Login({ isDemo = false }: LoginProps) {
  const { loginMutation, resendVerificationMutation, forgotPasswordMutation } = useAuth();
  const [emailVerificationOpen, setEmailVerificationOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [lastAttemptedEmail, setLastAttemptedEmail] = useState("");
  const [lastAttemptedUsername, setLastAttemptedUsername] = useState("");
  const [loginErrorType, setLoginErrorType] = useState<"verification" | "credentials" | null>(null);

  // For login form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // For email verification form
  const emailVerificationForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // For forgot password form
  const forgotPasswordForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setLastAttemptedUsername(data.username);
    
    // Original login mutation wrapped to catch 403 verification errors
    loginMutation.mutate(data, {
      onError: (error: any) => {
        // Check if this is a verification error (HTTP 403)
        if (error.message && error.message.includes("Email not verified")) {
          setLoginErrorType("verification");
          // Get email from error or use username as fallback
          if (lastAttemptedEmail) {
            emailVerificationForm.setValue("email", lastAttemptedEmail);
          }
          setEmailVerificationOpen(true);
        } else {
          setLoginErrorType("credentials");
        }
      }
    });
  };
  
  const handleResendVerification = (data: EmailFormValues) => {
    setLastAttemptedEmail(data.email);
    resendVerificationMutation.mutate({ email: data.email }, {
      onSuccess: () => {
        setEmailVerificationOpen(false);
      }
    });
  };
  
  const handleForgotPassword = (data: EmailFormValues) => {
    forgotPasswordMutation.mutate({ email: data.email }, {
      onSuccess: () => {
        setForgotPasswordOpen(false);
      }
    });
  };

  const handleDemoLogin = () => {
    loginMutation.mutate({
      username: "demo",
      password: "demo123"
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isDemo && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Demo Mode Active</h3>
                  <p className="text-sm text-green-700">
                    Creating your demo account with ₦200,000 play money
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {loginErrorType === "verification" && (
            <Alert className="mb-6 border-amber-500 bg-amber-50 text-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-800" />
              <AlertTitle>Email verification required</AlertTitle>
              <AlertDescription>
                Your email needs to be verified before you can log in. 
                <Button 
                  variant="link" 
                  className="text-amber-800 p-0 h-auto font-semibold ml-1"
                  onClick={() => setEmailVerificationOpen(true)}
                >
                  Resend verification email
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {loginErrorType === "credentials" && (
            <Alert className="mb-6 border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication failed</AlertTitle>
              <AlertDescription>
                Invalid username or password. Please try again.
              </AlertDescription>
            </Alert>
          )}
          
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                variant="outline"
                className="w-full mt-4 border-green-500 text-green-600 hover:bg-green-50"
                onClick={handleDemoLogin}
                disabled={loginMutation.isPending}
              >
                Quick Demo Login
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center pt-0">
          <Button 
            variant="link" 
            className="text-sm text-gray-500"
            onClick={() => setForgotPasswordOpen(true)}
          >
            Forgot your password?
          </Button>
        </CardFooter>
      </Card>
      
      {/* Email Verification Dialog */}
      <Dialog open={emailVerificationOpen} onOpenChange={setEmailVerificationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-secondary" />
              Verify Your Email
            </DialogTitle>
            <DialogDescription>
              Please enter your email address to receive a verification link.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...emailVerificationForm}>
            <form onSubmit={emailVerificationForm.handleSubmit(handleResendVerification)} className="space-y-4">
              <FormField
                control={emailVerificationForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-secondary hover:bg-secondary-dark text-primary font-bold"
                  disabled={resendVerificationMutation.isPending}
                >
                  {resendVerificationMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Send Verification Email
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription>
              Enter your email address below to receive a password reset link.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-secondary hover:bg-secondary-dark text-primary font-bold"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Send Reset Link
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
