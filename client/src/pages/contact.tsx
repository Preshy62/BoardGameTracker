import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, Clock, Headphones } from "lucide-react";

export default function ContactPage() {
  const [, setLocation] = useLocation();

  const handleEmailContact = () => {
    window.location.href = "mailto:support@bigboysgame.com";
  };

  const handlePhoneContact = () => {
    window.location.href = "tel:+2349012345678";
  };

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

          {/* Support Categories */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">What Can We Help You With?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-2xl mb-2">🎮</div>
                <h4 className="font-semibold mb-2">Game Issues</h4>
                <p className="text-sm text-gray-600">Technical problems, disconnections, game rules</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-2xl mb-2">💰</div>
                <h4 className="font-semibold mb-2">Payments</h4>
                <p className="text-sm text-gray-600">Deposits, withdrawals, transaction issues</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-2xl mb-2">🔐</div>
                <h4 className="font-semibold mb-2">Account</h4>
                <p className="text-sm text-gray-600">Login problems, verification, security</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-2xl mb-2">❓</div>
                <h4 className="font-semibold mb-2">General</h4>
                <p className="text-sm text-gray-600">Platform features, how-to guides, feedback</p>
              </div>
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

              {/* FAQ Quick Links */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Solutions</h3>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    How do I deposit money?
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    How do I withdraw winnings?
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    What are the game rules?
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    How do I verify my account?
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Forgot my password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Voice chat not working
                  </Button>
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