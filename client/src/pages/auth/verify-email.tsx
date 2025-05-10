import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Verifying your email...");

  useEffect(() => {
    // Extract the token from the URL
    const token = window.location.pathname.split("/verify-email/")[1];
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }
    
    // Add debugging
    console.log("Verification token extracted:", token);
    
    // Send the token to the server for verification
    const verifyEmail = async () => {
      try {
        console.log("Sending verification request to:", `/api/verify-email/${token}`);
        
        const response = await apiRequest("POST", `/api/verify-email/${token}`);
        console.log("Verification response:", response.status);
        
        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been successfully verified! You can now log in to your account.");
          toast({
            title: "Email verified",
            description: "Your account has been activated successfully.",
            variant: "default",
          });
        } else {
          const errorData = await response.json();
          console.error("Verification error response:", errorData);
          setStatus("error");
          setMessage(errorData.message || "Email verification failed. The link may be expired or invalid.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An error occurred while verifying your email. Please try again later.");
      }
    };

    verifyEmail();
  }, [toast]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Email Verification</CardTitle>
        <CardDescription className="text-center">
          Verifying your email address for Big Boys Game
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-secondary mb-4" />
            <p className="text-center text-lg font-medium">{message}</p>
            <p className="text-center text-muted-foreground mt-2">
              This may take a few moments...
            </p>
          </>
        )}
        
        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-center text-lg font-medium">{message}</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <p className="text-center text-lg font-medium">{message}</p>
            <p className="text-center text-muted-foreground mt-2">
              If you're having trouble, you can request a new verification link.
            </p>
          </>
        )}
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