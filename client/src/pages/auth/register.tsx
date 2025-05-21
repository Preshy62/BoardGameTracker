import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowRight, Star, Home } from "lucide-react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
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
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getPrimaryCurrencyForCountry, 
  groupCurrencies,
  currencies,
  countries
} from "@/lib/countryData";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  // International fields
  countryCode: z.string().min(2, "Country code is required"),
  preferredCurrency: z.string().min(3, "Currency is required"),
  language: z.string().min(2, "Language is required"),
  timeZone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Language options with mapping

// Language options list
const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "yo", name: "Yoruba" },
  { code: "ha", name: "Hausa" },
  { code: "ig", name: "Igbo" },
];

export default function Register() {
  const { registerMutation, resendVerificationMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [registrationStep, setRegistrationStep] = useState<"basic" | "international">("basic");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      countryCode: "NG", // Default to Nigeria
      preferredCurrency: "NGN", // Default to Naira
      language: "en", // Default to English
      timeZone: "", // Will be set automatically
    },
  });
  
  // Update preferred currency when country changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'countryCode' && value.countryCode) {
        const recommendedCurrency = getPrimaryCurrencyForCountry(value.countryCode as string);
        if (recommendedCurrency) {
          form.setValue('preferredCurrency', recommendedCurrency);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (data: RegisterFormValues) => {
    try {
      // Calculate initials from username
      const avatarInitials = getInitials(data.username);
      
      // Get browser timezone if not provided
      const timeZone = data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      console.log("Submitting registration data:", { ...data, avatarInitials, timeZone });
      
      // Register request with all needed data
      registerMutation.mutate({
        ...data,
        avatarInitials,
        timeZone,
      }, {
        onSuccess: (response) => {
          // Save the email for potential resend verification
          setRegisteredEmail(data.email);
          setRegistrationSuccess(true);
          toast({
            title: "Registration successful",
            description: "Your account has been created successfully.",
          });
          console.log("Registration success response:", response);
        },
        onError: (error: Error) => {
          console.error("Registration error in component:", error);
          toast({
            title: "Registration failed",
            description: error.message || "Please check your information and try again",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Unexpected error during registration:", error);
      toast({
        title: "Registration error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Join Big Boys Game and start winning big
        </CardDescription>
      </CardHeader>
      <CardContent>
        {registrationSuccess ? (
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
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium mb-2">Next steps:</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return to this site to login after verification</li>
              </ol>
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                <p className="font-medium text-amber-800">Development Mode Notice</p>
                <p className="text-amber-700 mt-1">
                  In development mode, emails are captured by Ethereal instead of being sent to your actual email.
                  Check the server console logs to find the verification link.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 mt-4">
              <Button 
                type="button"
                onClick={() => navigate('/auth?tab=login')}
                className="w-full bg-secondary hover:bg-secondary-dark text-primary font-bold flex items-center justify-center"
              >
                Go to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              {/* Add resend verification button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (registeredEmail) {
                    resendVerificationMutation.mutate({ email: registeredEmail });
                  }
                }}
              >
                Resend verification email
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs 
              defaultValue={registrationStep} 
              onValueChange={(value) => setRegistrationStep(value as "basic" | "international")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="international">Location & Preferences</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
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
                
                <Button 
                  type="button" 
                  className="w-full"
                  onClick={() => setRegistrationStep("international")}
                >
                  Next: Set Location & Preferences
                </Button>
              </TabsContent>
              
              <TabsContent value="international" className="space-y-4">
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Your country of residence
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredCurrency"
                  render={({ field }) => {
                    // Get the current country selection
                    const selectedCountry = form.getValues("countryCode");
                    
                    // Get recommendation groups based on the selected country
                    const grouped = groupCurrencies(currencies, selectedCountry);
                    const primaryCurrency = getPrimaryCurrencyForCountry(selectedCountry);
                    
                    return (
                      <FormItem>
                        <FormLabel>Preferred Currency</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Recommended Currencies Group */}
                            <SelectGroup>
                              <SelectLabel>Recommended Currencies</SelectLabel>
                              {grouped.recommended.map((currency) => (
                                <SelectItem key={currency.code} value={currency.code}>
                                  <div className="flex items-center">
                                    {currency.code === primaryCurrency && (
                                      <Home className="mr-2 h-3.5 w-3.5 text-primary" />
                                    )}
                                    {currency.code !== primaryCurrency && (
                                      <Star className="mr-2 h-3.5 w-3.5 text-yellow-500" />
                                    )}
                                    {currency.name} ({currency.symbol})
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            
                            {/* Other Currencies Group */}
                            <SelectGroup>
                              <SelectLabel>Other Currencies</SelectLabel>
                              {grouped.others.map((currency) => (
                                <SelectItem key={currency.code} value={currency.code}>
                                  {currency.name} ({currency.symbol})
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Currency used for deposits, stakes, and withdrawals
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Language</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map((language) => (
                            <SelectItem key={language.code} value={language.code}>
                              {language.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setRegistrationStep("basic")}
                  >
                    Back
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="flex-1 bg-secondary hover:bg-secondary-dark text-primary font-bold"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2" />
                    ) : null}
                    Create Account
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  );
}
