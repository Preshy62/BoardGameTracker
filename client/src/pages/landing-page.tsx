import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  PlusCircle, 
  Users, 
  DollarSign, 
  Trophy,
  Clock, 
  CreditCard,
  Gamepad2,
  Globe2,
  Radio
} from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  
  // Redirect to auth page
  const handleSignIn = () => {
    setLocation('/auth');
  };

  // Redirect to quick demo game
  const handleQuickDemo = () => {
    setLocation('/demo-new');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Big Boys Game</h1>
          </div>
          <div className="space-x-2">
            <Button 
              onClick={handleQuickDemo}
              variant="secondary"
              className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Try Demo
            </Button>
            <Button 
              onClick={handleSignIn}
              variant="outline" 
              className="text-white border-white hover:bg-white/10"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">The Ultimate Nigerian Gambling Experience</h1>
              <p className="text-xl mb-8 text-blue-100">Play the classic stone game online with real stakes and real winners</p>
              <div className="space-x-4">
                <Button 
                  onClick={handleSignIn}
                  size="lg"
                  className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
                >
                  Sign In / Register
                </Button>
                <Button 
                  onClick={handleQuickDemo}
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Try Demo
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg border border-white/20 shadow-xl">
                <div className="grid grid-cols-3 gap-4">
                  {/* Game stones examples */}
                  {[29, 75, 42, 1000, 3355, 63, 500, 6624, 91].map((number, index) => (
                    <div 
                      key={index}
                      className={`w-20 h-20 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg transform transition hover:scale-105 ${
                        number === 1000 || number === 500 
                          ? 'bg-yellow-500 text-primary' 
                          : number === 3355 || number === 6624 
                            ? 'bg-red-600 text-white border-2 border-yellow-400' 
                            : 'bg-gray-800 text-white'
                      }`}
                    >
                      {number}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Game Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="p-4 bg-blue-100 text-blue-700 rounded-full mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Multiplayer Gameplay</h3>
                <p className="text-gray-500">
                  Play with 2-10 players in exciting game rooms with real-time interaction.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="p-4 bg-secondary bg-opacity-20 text-secondary rounded-full mb-4">
                  <Gamepad2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Special Stones</h3>
                <p className="text-gray-500">
                  Land on special stones like 500, 1000, 3355, or 6624 for bonus multipliers!
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="p-4 bg-green-100 text-green-700 rounded-full mb-4">
                  <Globe2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">International Play</h3>
                <p className="text-gray-500">
                  Play from anywhere with multi-currency support and local bank withdrawals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <Separator className="my-8" />
      
      {/* How to Play */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">How to Play Big Boys Game</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-4">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">1. Place Your Stake</h3>
              <p className="text-sm text-gray-600">
                Create a game with your desired stake amount or join an existing game
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-100 text-purple-700 rounded-full p-4 mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">2. Wait for Players</h3>
              <p className="text-sm text-gray-600">
                Games can host 2-10 players. Game starts when all players are ready.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 text-amber-700 rounded-full p-4 mb-4">
                <Gamepad2 className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">3. Roll Your Stone</h3>
              <p className="text-sm text-gray-600">
                Take turns rolling your stone. The player with the highest number wins!
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 text-green-700 rounded-full p-4 mb-4">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">4. Collect Winnings</h3>
              <p className="text-sm text-gray-600">
                Winners automatically receive their share of the pot in their wallet
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              onClick={handleQuickDemo}
              className="bg-secondary hover:bg-secondary-dark text-primary font-bold mr-4"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Try Demo
            </Button>
            <Button 
              onClick={() => setLocation("/voice-chat-demo")}
              className="bg-amber-500 hover:bg-amber-600 text-white mr-4"
            >
              <Radio className="h-4 w-4 mr-2" />
              Voice Chat Demo
            </Button>
            <Button 
              onClick={handleSignIn}
              variant="default"
            >
              Sign In / Register
            </Button>
          </div>
        </div>
      </section>
      
      {/* Stats & Testimonials */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">Game Stats</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 text-center">
                    <div className="text-4xl font-bold text-primary mb-2">₦50M+</div>
                    <p className="text-gray-500">Total Payouts</p>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                    <p className="text-gray-500">Active Players</p>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-4xl font-bold text-primary mb-2">5K+</div>
                    <p className="text-gray-500">Daily Games</p>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-4xl font-bold text-primary mb-2">99%</div>
                    <p className="text-gray-500">Payout Rate</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-6">Top Winners</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">BigWinner123</div>
                        <div className="text-sm text-gray-500">Lagos, Nigeria</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">₦1,250,000</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">LuckyPlayer555</div>
                        <div className="text-sm text-gray-500">Abuja, Nigeria</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">₦950,000</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">GoldMaster</div>
                        <div className="text-sm text-gray-500">Port Harcourt, Nigeria</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">₦750,000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call To Action */}
      <section className="py-12 bg-gradient-to-r from-secondary to-yellow-500 text-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">Join thousands of players from around the world and experience the thrill of Big Boys Game!</p>
          <div className="space-x-4">
            <Button 
              onClick={handleSignIn}
              size="lg"
              className="bg-primary hover:bg-primary-dark text-white font-bold"
            >
              Sign In / Register
            </Button>
            <Button 
              onClick={handleQuickDemo}
              size="lg" 
              variant="outline"
              className="border-primary bg-white/80 hover:bg-white"
            >
              Try Demo First
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Big Boys Game</h3>
              <p className="text-gray-400 text-sm">The Ultimate Nigerian Gambling Experience</p>
            </div>
            
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Big Boys Game. All rights reserved.</p>
            <p className="mt-1">For entertainment purposes only. 18+ only. Play responsibly.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}