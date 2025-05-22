import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { 
  Trophy, 
  Users, 
  Globe2, 
  Shield, 
  Clock, 
  Target,
  CheckCircle,
  Star,
  Heart,
  Zap
} from "lucide-react";

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              About Big Boys Game
            </h1>
            <p className="text-xl md:text-2xl mb-8 leading-relaxed opacity-90">
              The World's Most Authentic Digital Stone-Rolling Experience
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm opacity-80">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                <span>50,000+ Players</span>
              </div>
              <div className="flex items-center">
                <Globe2 className="h-5 w-5 mr-2" />
                <span>25+ Countries</span>
              </div>
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                <span>₦500M+ Paid Out</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6 text-gray-900">Our Story</h2>
                <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                  <p>
                    Big Boys Game began with a simple vision: to bring the authentic Nigerian stone-rolling tradition to the digital world without losing its soul. What started as a beloved community game played in neighborhoods across West Africa has evolved into a sophisticated global gaming platform.
                  </p>
                  <p>
                    Our founders, passionate about preserving cultural gaming traditions while embracing modern technology, spent years perfecting the digital recreation of this timeless game. Every stone roll, every victory celebration, every moment of suspense has been carefully crafted to honor the original experience.
                  </p>
                  <p>
                    Today, Big Boys Game stands as the premier destination for authentic stone-rolling entertainment, connecting players worldwide through the shared thrill of chance, strategy, and community.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">50,000+</h3>
                    <p className="opacity-90">Active Players</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="p-6 text-center">
                    <Target className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">1M+</h3>
                    <p className="opacity-90">Games Played</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6 text-center">
                    <Globe2 className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">25+</h3>
                    <p className="opacity-90">Countries</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">24/7</h3>
                    <p className="opacity-90">Live Games</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-gray-900">Our Mission</h2>
            <p className="text-xl text-gray-700 leading-relaxed mb-12">
              To preserve and celebrate traditional African gaming culture while providing a secure, fair, and thrilling digital gaming experience that connects players across the globe.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Cultural Preservation</h3>
                <p className="text-gray-600">Keeping traditional games alive for future generations through digital innovation.</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Fair Play</h3>
                <p className="text-gray-600">Ensuring every game is transparent, secure, and gives every player an equal chance to win.</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Globe2 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Global Community</h3>
                <p className="text-gray-600">Building bridges between cultures through the universal language of gaming.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose BBG */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Why Choose Big Boys Game?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">Authentic Experience</h3>
                    <p className="text-gray-600">Faithfully recreated traditional stone-rolling mechanics with modern digital precision.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">Instant Payouts</h3>
                    <p className="text-gray-600">Winners receive their earnings immediately to local bank accounts worldwide.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">Multi-Currency Support</h3>
                    <p className="text-gray-600">Play in your local currency with automatic conversion and regional banking integration.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">Voice Chat Integration</h3>
                    <p className="text-gray-600">Premium games feature real-time voice communication for authentic social gaming.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">Mobile-First Design</h3>
                    <p className="text-gray-600">Optimized for smartphones with touch-friendly controls and responsive gameplay.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">24/7 Live Games</h3>
                    <p className="text-gray-600">Players around the world ensure there's always an active game to join.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">Secure & Licensed</h3>
                    <p className="text-gray-600">Bank-grade security with full regulatory compliance and player protection.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">Bot Practice Mode</h3>
                    <p className="text-gray-600">Learn the game risk-free with AI opponents before joining real-money games.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-16 text-gray-900">Our Core Values</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-xl font-bold mb-3 text-gray-900">Excellence</h3>
                <p className="text-gray-600 text-sm">We strive for perfection in every aspect of the gaming experience.</p>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-bold mb-3 text-gray-900">Integrity</h3>
                <p className="text-gray-600 text-sm">Transparent, fair, and honest in all our operations and communications.</p>
              </div>
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold mb-3 text-gray-900">Community</h3>
                <p className="text-gray-600 text-sm">Building lasting connections between players across cultures and continents.</p>
              </div>
              <div className="text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-xl font-bold mb-3 text-gray-900">Innovation</h3>
                <p className="text-gray-600 text-sm">Continuously improving and evolving the platform with cutting-edge technology.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Experience the Thrill?</h2>
            <p className="text-xl mb-10 opacity-90">
              Join our global community of players and discover why Big Boys Game is the ultimate digital stone-rolling experience.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => setLocation('/auth')}
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 font-bold px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transform transition-all hover:-translate-y-1 w-full sm:w-auto"
              >
                Start Playing Now
              </Button>
              <Button 
                onClick={() => setLocation('/demo-new')}
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white/10 font-bold px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transform transition-all hover:-translate-y-1 w-full sm:w-auto"
              >
                Try Free Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400 mb-4">© 2025 Big Boys Game. All rights reserved.</p>
            <p className="text-gray-500 text-sm">For entertainment purposes only. 18+ only. Play responsibly.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}