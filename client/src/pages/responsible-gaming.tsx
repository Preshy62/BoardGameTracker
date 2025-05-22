import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, Heart, AlertTriangle, Clock, DollarSign, Users } from "lucide-react";

export default function ResponsibleGamingPage() {
  const [, setLocation] = useLocation();

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
              <Heart className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Responsible Gaming</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Gaming Should Be Fun</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to providing a safe, fair, and enjoyable gaming environment for all our players.
            </p>
          </div>

          {/* Warning Signs */}
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-orange-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-orange-800 mb-2">Recognize the Warning Signs</h3>
                  <p className="text-orange-700 mb-4">
                    Gaming becomes problematic when it interferes with your daily life, relationships, or financial well-being.
                  </p>
                  <ul className="text-orange-700 list-disc pl-6 space-y-1">
                    <li>Spending more time or money than intended</li>
                    <li>Chasing losses with bigger bets</li>
                    <li>Borrowing money to continue playing</li>
                    <li>Neglecting work, family, or personal responsibilities</li>
                    <li>Feeling anxious or depressed when not playing</li>
                    <li>Lying about time or money spent gaming</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools and Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <DollarSign className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-xl font-bold">Spending Limits</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Set daily, weekly, or monthly limits on deposits and stakes to control your spending.
                </p>
                <ul className="text-gray-700 list-disc pl-6 space-y-1 mb-4">
                  <li>Deposit limits</li>
                  <li>Loss limits</li>
                  <li>Stake limits per game</li>
                  <li>Time-based restrictions</li>
                </ul>
                <Button onClick={() => setLocation('/auth')} className="w-full">
                  Set My Limits
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Clock className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-xl font-bold">Time Management</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Monitor and control how much time you spend playing games.
                </p>
                <ul className="text-gray-700 list-disc pl-6 space-y-1 mb-4">
                  <li>Session time limits</li>
                  <li>Daily time reminders</li>
                  <li>Gaming activity reports</li>
                  <li>Cool-off periods</li>
                </ul>
                <Button onClick={() => setLocation('/auth')} variant="outline" className="w-full">
                  Manage Time
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Self-Exclusion */}
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-red-800 mb-2">Self-Exclusion Options</h3>
                  <p className="text-red-700 mb-4">
                    If you need a break from gaming, we offer several self-exclusion options:
                  </p>
                  <ul className="text-red-700 list-disc pl-6 space-y-1 mb-4">
                    <li><strong>24-Hour Cool-off:</strong> Temporary break for a day</li>
                    <li><strong>7-Day Break:</strong> One week away from the platform</li>
                    <li><strong>30-Day Suspension:</strong> Month-long account suspension</li>
                    <li><strong>Permanent Exclusion:</strong> Permanent account closure</li>
                  </ul>
                  <div className="flex gap-3">
                    <Button onClick={() => setLocation('/contact')} variant="outline">
                      Contact Support
                    </Button>
                    <Button onClick={() => setLocation('/auth')}>
                      Access Settings
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips for Healthy Gaming */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Tips for Healthy Gaming</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">✓ Do This</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Set a budget before you start</li>
                  <li>• Take regular breaks</li>
                  <li>• Play for entertainment, not money</li>
                  <li>• Keep track of time and spending</li>
                  <li>• Play when you're in a good mood</li>
                  <li>• Use our responsible gaming tools</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-red-600 mb-2">✗ Avoid This</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Never chase your losses</li>
                  <li>• Don't borrow money to play</li>
                  <li>• Avoid playing when upset</li>
                  <li>• Don't neglect responsibilities</li>
                  <li>• Never gamble under influence</li>
                  <li>• Don't hide your gaming activity</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Support Resources */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Get Help and Support</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h4 className="font-semibold mb-2">Professional Support</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Speak with qualified counselors who specialize in gaming addiction.
                </p>
                <Button 
                  onClick={() => window.open('https://gamblinganonymous.org', '_blank')}
                  variant="outline" 
                  size="sm"
                >
                  Find Counselors
                </Button>
              </div>
              
              <div className="text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h4 className="font-semibold mb-2">Support Groups</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Connect with others who understand your experience.
                </p>
                <Button 
                  onClick={() => window.open('https://www.gamblersanonymous.org', '_blank')}
                  variant="outline" 
                  size="sm"
                >
                  Join Groups
                </Button>
              </div>
              
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h4 className="font-semibold mb-2">Crisis Support</h4>
                <p className="text-sm text-gray-600 mb-3">
                  24/7 crisis hotlines for immediate assistance.
                </p>
                <Button 
                  onClick={() => window.location.href = 'tel:+2349012345678'}
                  size="sm"
                >
                  Call Now
                </Button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-center">
                <strong>Remember:</strong> Seeking help is a sign of strength, not weakness. 
                Our support team is here to help you maintain a healthy relationship with gaming.
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Need immediate assistance? Our responsible gaming team is available 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => setLocation('/contact')}>
                Contact Support Team
              </Button>
              <Button onClick={() => setLocation('/')} variant="outline">
                Back to Platform
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}