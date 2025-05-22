import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, Clock, Headphones, Send, ChevronDown, ChevronUp, Star, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
    priority: ''
  });

  const handleEmailContact = () => {
    window.location.href = "mailto:support@bigboysgame.com";
  };

  const handlePhoneContact = () => {
    window.location.href = "tel:+2349012345678";
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create mailto with form data
    const subject = encodeURIComponent(`[${formData.category}] ${formData.subject}`);
    const body = encodeURIComponent(`
Name: ${formData.name}
Email: ${formData.email}
Category: ${formData.category}
Priority: ${formData.priority}

Message:
${formData.message}
    `);
    
    window.location.href = `mailto:support@bigboysgame.com?subject=${subject}&body=${body}`;
    
    toast({
      title: "Opening Email Client",
      description: "Your default email client will open with your message pre-filled.",
    });
  };

  const faqItems = [
    {
      question: "How do I deposit money into my account?",
      answer: "You can deposit money using Paystack, our secure payment processor. Go to your wallet, click 'Deposit', choose your amount, and follow the payment instructions. Deposits are usually instant."
    },
    {
      question: "How do I withdraw my winnings?",
      answer: "To withdraw, go to your wallet and click 'Withdraw'. Enter your bank details and the amount you want to withdraw. Withdrawals are processed within 24-48 hours to verified Nigerian bank accounts."
    },
    {
      question: "What are the game rules for Big Boys Game?",
      answer: "Each player stakes money and rolls virtual stones numbered 1-6, plus special stones (500, 1000) and super stones (3355, 6624). The player with the highest number wins the pot minus platform commission."
    },
    {
      question: "How do I verify my account?",
      answer: "Account verification involves confirming your email address and providing valid ID documentation. This ensures secure transactions and compliance with financial regulations."
    },
    {
      question: "I forgot my password, what should I do?",
      answer: "Click 'Forgot Password' on the login page. Enter your email address, and we'll send you a secure reset link. Follow the instructions in the email to create a new password."
    },
    {
      question: "Voice chat is not working in my game",
      answer: "Voice chat requires microphone permissions and is available for games with stakes ₦20,000 and above. Check your browser permissions and ensure your microphone is working properly."
    },
    {
      question: "What are the platform commission rates?",
      answer: "Commission rates are: 5% for games under ₦10,000, 10% for games ₦10,000 and above, and 20% for bot games. All rates are clearly displayed before you join a game."
    },
    {
      question: "Is my money safe on the platform?",
      answer: "Yes, we use industry-standard security measures including 256-bit SSL encryption, secure payment processing through Paystack, and regular security audits to protect your funds and data."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center">
              <Headphones className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Contact Support</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">We're Here to Help</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get fast support from our dedicated team. We're available 24/7 to assist with any questions or issues.
            </p>
            <div className="flex items-center justify-center mt-6 space-x-8">
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <span className="font-semibold">24/7 Support</span>
              </div>
              <div className="flex items-center text-blue-600">
                <Star className="h-5 w-5 mr-2" />
                <span className="font-semibold">Expert Team</span>
              </div>
              <div className="flex items-center text-purple-600">
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-semibold">Fast Response</span>
              </div>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            
            {/* Email Support */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Email Support</h3>
                <p className="text-gray-600 mb-4">Get detailed assistance via email</p>
                <Button 
                  onClick={handleEmailContact}
                  className="w-full"
                >
                  support@bigboysgame.com
                </Button>
                <p className="text-sm text-gray-500 mt-2">Response within 2 hours</p>
              </CardContent>
            </Card>

            {/* Phone Support */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Phone Support</h3>
                <p className="text-gray-600 mb-4">Speak directly with our team</p>
                <Button 
                  onClick={handlePhoneContact}
                  variant="outline"
                  className="w-full"
                >
                  +234 901 234 5678
                </Button>
                <p className="text-sm text-gray-500 mt-2">Available 24/7</p>
              </CardContent>
            </Card>

            {/* Live Chat */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Live Chat</h3>
                <p className="text-gray-600 mb-4">Instant help through our platform</p>
                <Button 
                  onClick={() => setLocation('/auth')}
                  variant="outline"
                  className="w-full"
                >
                  Start Chat
                </Button>
                <p className="text-sm text-gray-500 mt-2">Login required</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            
            {/* Contact Form */}
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h3>
                
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="game-issues">🎮 Game Issues</SelectItem>
                          <SelectItem value="payments">💰 Payment Support</SelectItem>
                          <SelectItem value="account">🔐 Account Help</SelectItem>
                          <SelectItem value="technical">⚙️ Technical Support</SelectItem>
                          <SelectItem value="general">❓ General Inquiry</SelectItem>
                          <SelectItem value="feedback">💭 Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">🟢 Low - General question</SelectItem>
                          <SelectItem value="medium">🟡 Medium - Issue affecting gameplay</SelectItem>
                          <SelectItem value="high">🟠 High - Money/security concern</SelectItem>
                          <SelectItem value="urgent">🔴 Urgent - Account locked/critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Please provide detailed information about your issue, including any error messages, steps you've tried, or relevant account details..."
                      rows={6}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" size="lg">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Support Categories */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-bold mb-4">What Can We Help You With?</h4>
                  <div className="space-y-4">
                    <div className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-xl mr-3">🎮</div>
                      <div>
                        <h5 className="font-semibold">Game Issues</h5>
                        <p className="text-sm text-gray-600">Technical problems, disconnections, game rules</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-xl mr-3">💰</div>
                      <div>
                        <h5 className="font-semibold">Payment Support</h5>
                        <p className="text-sm text-gray-600">Deposits, withdrawals, transaction issues</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-xl mr-3">🔐</div>
                      <div>
                        <h5 className="font-semibold">Account Help</h5>
                        <p className="text-sm text-gray-600">Login problems, verification, security</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-xl mr-3">❓</div>
                      <div>
                        <h5 className="font-semibold">General Support</h5>
                        <p className="text-sm text-gray-600">Platform features, how-to guides, feedback</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <h4 className="text-lg font-bold text-blue-800 mb-2">Quick Tips for Better Support</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Include your username for account-related issues</li>
                    <li>• Describe what you were doing when the problem occurred</li>
                    <li>• Include error messages if any appeared</li>
                    <li>• Mention your device/browser for technical issues</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Office Information */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Contact Info */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">Office Address</h4>
                      <p className="text-gray-600">Victoria Island<br />Lagos, Nigeria</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">Support Hours</h4>
                      <p className="text-gray-600">24/7 - Always Available<br />Peak hours: 9 AM - 6 PM WAT</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Mail className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">Department Emails</h4>
                      <p className="text-gray-600">
                        General: support@bigboysgame.com<br />
                        Technical: tech@bigboysgame.com<br />
                        Billing: billing@bigboysgame.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive FAQ */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
                
                <div className="space-y-3">
                  {faqItems.map((item, index) => (
                    <div key={index} className="border rounded-lg">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium">{item.question}</span>
                        {expandedFaq === index ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      {expandedFaq === index && (
                        <div className="px-4 pb-4 text-gray-700">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Pro Tip:</strong> Include your username and a detailed description of your issue for faster resolution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}