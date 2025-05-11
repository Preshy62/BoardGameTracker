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
  ChevronRight,
  Shield,
  Zap
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
      {/* Header with improved styling */}
      <header className="sticky top-0 z-50 bg-primary text-white py-3 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Big Boys Game</h1>
          </div>
          <div className="space-x-2">
            <Button 
              onClick={handleQuickDemo}
              variant="secondary"
              className="bg-secondary hover:bg-secondary-dark text-primary font-bold transition-all"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Try Demo
            </Button>
            <Button 
              onClick={handleSignIn}
              variant="outline" 
              className="text-white border-white hover:bg-white/20 transition-all"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section with enhanced animations and visual effects */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary-dark to-blue-900 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 bg-grid-white pointer-events-none"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-secondary opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-6 bg-white/10 rounded-full px-4 py-1 backdrop-blur-sm border border-white/20">
                <p className="text-sm font-medium text-blue-100 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                  <span>10,000+ Live Players Online</span>
                </p>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                The Ultimate <span className="text-yellow-400">Nigerian</span> Gambling Experience (Redesigned)
              </h1>
              
              <p className="text-xl mb-8 text-blue-100 max-w-lg">
                Play the classic stone game online with real stakes and instant payouts to your local bank account. Join thousands of players today!
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={handleSignIn}
                  size="lg"
                  className="bg-secondary hover:bg-yellow-500 text-primary font-bold shadow-lg transform transition-all hover:translate-y-[-2px] shimmer"
                >
                  <div className="flex items-center">
                    Sign In / Register 
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </div>
                </Button>
                
                <Button 
                  onClick={handleQuickDemo}
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white/20 transition-all"
                >
                  <Gamepad2 className="mr-2 h-5 w-5" /> Try Demo
                </Button>
              </div>
              
              <div className="mt-8 flex items-center space-x-6">
                <div className="flex items-center">
                  <Shield className="text-green-400 mr-2 h-5 w-5" />
                  <span className="text-sm text-blue-100">Secure Transactions</span>
                </div>
                <div className="flex items-center">
                  <CreditCard className="text-green-400 mr-2 h-5 w-5" />
                  <span className="text-sm text-blue-100">Instant Payouts</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 shadow-2xl floating">
                <div className="grid grid-cols-3 gap-3">
                  {/* Game stones examples with enhanced visual effects and animations */}
                  {[29, 75, 42, 1000, 3355, 63, 500, 6624, 91].map((number, index) => (
                    <div 
                      key={index}
                      className={`
                        w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center 
                        font-bold text-lg md:text-xl shadow-lg transform transition-all duration-300
                        ${index === 4 ? 'z-10 scale-110' : ''}
                        ${number === 1000 || number === 500 
                          ? 'bg-yellow-500 text-primary hover:bg-yellow-400 hover:scale-110 hover:rotate-3' 
                          : number === 3355 || number === 6624 
                            ? 'bg-red-600 text-white border-2 border-yellow-400 hover:bg-red-500 hover:scale-110 hover:rotate-3' 
                            : 'bg-gray-800 text-white hover:bg-gray-700 hover:scale-105 hover:rotate-2'
                        }
                      `}
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                      }}
                    >
                      {number}
                      {/* Highlight effect for special numbers */}
                      {(number === 3355 || number === 6624) && (
                        <div className="absolute inset-0 rounded-lg bg-white opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Winning indicator */}
                <div className="mt-4 flex items-center justify-center bg-green-900/30 rounded-lg p-2 border border-green-500/30">
                  <Trophy className="text-yellow-400 mr-2 h-5 w-5" />
                  <span className="text-sm text-green-300">6624 Wins ₦240,000!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section with improved design */}
      <section className="py-24 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gray-100 opacity-50 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold inline-block relative">
              Game Features
              <span className="absolute bottom-0 left-0 w-full h-1 bg-secondary transform -translate-y-2"></span>
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Experience the authentic Big Boys Game with our digital platform's premium features</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-t-4 border-blue-500 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="p-4 bg-blue-100 text-blue-700 rounded-full mb-6 shadow-inner">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Multiplayer Gameplay</h3>
                <p className="text-gray-600">
                  Play with 2-10 players in exciting game rooms with real-time interaction. Voice chat available for premium games.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-t-4 border-yellow-500 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="p-4 bg-yellow-100 text-yellow-700 rounded-full mb-6 shadow-inner">
                  <Gamepad2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Special Stones</h3>
                <p className="text-gray-600">
                  Land on special stones like 500, 1000, 3355, or 6624 for bonus multipliers! Experience the thrill of big wins.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-t-4 border-green-500 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="p-4 bg-green-100 text-green-700 rounded-full mb-6 shadow-inner">
                  <Globe2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">International Play</h3>
                <p className="text-gray-600">
                  Play from anywhere with multi-currency support and local bank withdrawals. Connect with players around the world.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-16 text-center">
            <Button 
              onClick={handleQuickDemo}
              className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-6 rounded-lg shadow-lg"
            >
              <Zap className="h-5 w-5 mr-2" />
              Experience It Now
            </Button>
          </div>
        </div>
      </section>
      
      {/* How to Play - modern design with numbered cards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How to Play Big Boys Game</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Follow these simple steps to start playing and winning</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Step 1 */}
            <div className="group bg-white rounded-xl shadow-lg p-6 relative transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-lg">1</div>
              <div className="pt-4">
                <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-5 mx-auto w-16 h-16 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <DollarSign className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg mb-3 text-center">Place Your Stake</h3>
                <p className="text-gray-600 text-center">
                  Create a game with your desired stake amount or join an existing game with other players
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="group bg-white rounded-xl shadow-lg p-6 relative transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-lg">2</div>
              <div className="pt-4">
                <div className="bg-purple-100 text-purple-700 rounded-full p-4 mb-5 mx-auto w-16 h-16 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg mb-3 text-center">Wait for Players</h3>
                <p className="text-gray-600 text-center">
                  Games can host 2-10 players. The game begins automatically when all players are ready to start
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="group bg-white rounded-xl shadow-lg p-6 relative transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-lg">3</div>
              <div className="pt-4">
                <div className="bg-amber-100 text-amber-700 rounded-full p-4 mb-5 mx-auto w-16 h-16 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Gamepad2 className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg mb-3 text-center">Roll Your Stone</h3>
                <p className="text-gray-600 text-center">
                  Take turns rolling your stone. Watch for special numbers like 1000, 3355, and 6624 for bonus wins!
                </p>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="group bg-white rounded-xl shadow-lg p-6 relative transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-lg">4</div>
              <div className="pt-4">
                <div className="bg-green-100 text-green-700 rounded-full p-4 mb-5 mx-auto w-16 h-16 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <CreditCard className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg mb-3 text-center">Collect Winnings</h3>
                <p className="text-gray-600 text-center">
                  Winners automatically receive their share of the pot in their wallet with instant payouts
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={handleQuickDemo}
              className="bg-secondary hover:bg-secondary-dark text-primary font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <Gamepad2 className="h-5 w-5 mr-2" />
              Try Demo Now
            </Button>
            <Button 
              onClick={handleSignIn}
              variant="default"
              className="px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            >
              Sign In / Register
            </Button>
          </div>
        </div>
      </section>
      
      {/* Stats & Winners - visually enhanced */}
      <section className="py-20 bg-white relative">
        {/* Background gradient effect */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Game Statistics</h2>
            <p className="text-gray-600">Join thousands of players already winning big on our platform</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Game Stats with enhanced design */}
            <div>
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-primary text-white py-4 px-6">
                  <h3 className="text-xl font-bold">Platform Statistics</h3>
                </div>
                <div className="grid grid-cols-2 gap-0">
                  <div className="p-6 text-center border-r border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <div className="text-4xl font-bold text-primary mb-3">₦50M+</div>
                    <p className="text-gray-600 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                      Total Payouts
                    </p>
                  </div>
                  <div className="p-6 text-center border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <div className="text-4xl font-bold text-primary mb-3">10K+</div>
                    <p className="text-gray-600 flex items-center justify-center">
                      <Users className="h-4 w-4 mr-1 text-blue-500" />
                      Active Players
                    </p>
                  </div>
                  <div className="p-6 text-center border-r border-gray-100 hover:bg-blue-50 transition-colors">
                    <div className="text-4xl font-bold text-primary mb-3">5K+</div>
                    <p className="text-gray-600 flex items-center justify-center">
                      <Gamepad2 className="h-4 w-4 mr-1 text-purple-500" />
                      Daily Games
                    </p>
                  </div>
                  <div className="p-6 text-center hover:bg-blue-50 transition-colors">
                    <div className="text-4xl font-bold text-primary mb-3">99%</div>
                    <p className="text-gray-600 flex items-center justify-center">
                      <Shield className="h-4 w-4 mr-1 text-green-500" />
                      Payout Rate
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top Winners with enhanced visual appeal */}
            <div>
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-secondary text-primary py-4 px-6">
                  <h3 className="text-xl font-bold">Top Winners</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex items-center justify-between p-5 hover:bg-yellow-50 transition-colors">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white flex items-center justify-center mr-4 shadow-md">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">BigWinner123</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Globe2 className="h-3 w-3 mr-1" /> Lagos, Nigeria
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600 bg-green-50 py-1 px-3 rounded-full">₦1,250,000</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-5 hover:bg-yellow-50 transition-colors">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 text-white flex items-center justify-center mr-4 shadow-md">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">LuckyPlayer555</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Globe2 className="h-3 w-3 mr-1" /> Abuja, Nigeria
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600 bg-green-50 py-1 px-3 rounded-full">₦950,000</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-5 hover:bg-yellow-50 transition-colors">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center mr-4 shadow-md">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">GoldMaster</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Globe2 className="h-3 w-3 mr-1" /> Port Harcourt, Nigeria
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600 bg-green-50 py-1 px-3 rounded-full">₦750,000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call To Action - visually striking */}
      <section className="py-16 bg-gradient-to-br from-secondary via-yellow-500 to-yellow-400 text-primary relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-pattern-dots opacity-10"></div>
        
        {/* Animated shape */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-yellow-300 opacity-20 blur-3xl"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary opacity-10 blur-3xl"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Play?</h2>
            <p className="text-xl mb-10 leading-relaxed">Join thousands of players from around the world and experience the thrill of Big Boys Game! Start winning today!</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={handleSignIn}
                size="lg"
                className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transform transition-all hover:-translate-y-1 w-full sm:w-auto"
              >
                <div className="flex items-center justify-center">
                  Sign In / Register
                  <ChevronRight className="ml-2 h-5 w-5" />
                </div>
              </Button>
              <Button 
                onClick={handleQuickDemo}
                size="lg" 
                variant="outline"
                className="border-primary bg-white/90 hover:bg-white text-primary font-bold px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transform transition-all hover:-translate-y-1 w-full sm:w-auto"
              >
                <Gamepad2 className="mr-2 h-5 w-5" />
                Try Demo First
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      {/* Modern Footer with better information architecture */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Logo and tagline */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">Big Boys Game</h3>
              <p className="text-gray-400 max-w-md mb-6">The Ultimate Nigerian Gambling Experience. Play from anywhere with real stakes and instant payouts to your local bank account.</p>
              <div className="flex space-x-4">
                <a href="#" className="bg-gray-800 hover:bg-primary text-white p-2 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg>
                </a>
                <a href="#" className="bg-gray-800 hover:bg-primary text-white p-2 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                </a>
                <a href="#" className="bg-gray-800 hover:bg-primary text-white p-2 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path></svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold mb-4 text-gray-300">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Games</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">How to Play</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Winners</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="text-lg font-bold mb-4 text-gray-300">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Responsible Gaming</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Button
              onClick={handleQuickDemo}
              className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Try Demo
            </Button>
            <Button
              onClick={handleSignIn}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Sign In / Register
            </Button>
          </div>
          
          {/* Copyright and legal */}
          <div className="pt-8 mt-8 border-t border-gray-800">
            <div className="text-center text-gray-500 text-sm">
              <p className="mb-4">© 2025 Big Boys Game. All rights reserved.</p>
              <p>For entertainment purposes only. 18+ only. Play responsibly.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}