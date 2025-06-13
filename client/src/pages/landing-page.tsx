import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Users, 
  Bot, 
  Gamepad2,
  Trophy,
  Clock,
  Star,
  PlayCircle,
  Zap,
  Target,
  Brain,
  BarChart4,
  ChevronRight,
  Shield,
  Globe2
} from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  
  const handleSignIn = () => {
    setLocation('/auth');
  };

  const handleQuickDemo = () => {
    setLocation('/demo-new');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">
              Big Boys <span className="text-blue-400">Game</span>
            </h1>
          </div>
          <div className="space-x-3">
            <Button 
              onClick={handleQuickDemo}
              variant="outline"
              className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Try Demo
            </Button>
            <Button 
              onClick={handleSignIn}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 pointer-events-none"></div>
        <div className="absolute top-20 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-6 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm border border-white/20">
                <p className="text-sm font-medium text-blue-200 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                  Enhanced AI Gaming Platform
                </p>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
                Sophisticated <span className="text-blue-400">Multiplayer</span> Gaming
              </h1>
              
              <p className="text-xl mb-8 text-gray-300 max-w-lg">
                Experience next-generation gaming with enhanced bot AI, real-time multiplayer battles, and strategic complexity that adapts to your skill level.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={handleSignIn}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg transform transition-all hover:translate-y-[-2px]"
                >
                  <div className="flex items-center">
                    Start Gaming
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </div>
                </Button>
                
                <Button 
                  onClick={handleQuickDemo}
                  variant="outline"
                  size="lg"
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </div>
            
            {/* Gaming Visual */}
            <div className="hidden md:block">
              <div className="relative">
                <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                      <Brain className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">Enhanced AI</p>
                    </div>
                    <div className="bg-green-500/20 rounded-lg p-4 text-center">
                      <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">Multiplayer</p>
                    </div>
                    <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                      <Target className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">Strategy</p>
                    </div>
                    <div className="bg-yellow-500/20 rounded-lg p-4 text-center">
                      <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">Compete</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                      Real-time Gaming Engine
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Advanced gaming technology meets sophisticated multiplayer experiences
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Enhanced Bot AI</h3>
                <p className="text-gray-400">
                  Sophisticated artificial intelligence that adapts to your skill level and provides challenging gameplay experiences.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Real-time Multiplayer</h3>
                <p className="text-gray-400">
                  WebSocket-based real-time communication enables seamless multiplayer gaming with friends worldwide.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Strategic Depth</h3>
                <p className="text-gray-400">
                  Complex game mechanics and strategic gameplay that rewards tactical thinking and skill development.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Game Modes Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Multiple Game Modes
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose from various gaming experiences designed for different skill levels and preferences
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/30 rounded-lg p-6 text-center border border-slate-700">
              <Zap className="h-10 w-10 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Quick Match</h3>
              <p className="text-gray-400 text-sm">Fast-paced battles</p>
            </div>
            
            <div className="bg-slate-800/30 rounded-lg p-6 text-center border border-slate-700">
              <Bot className="h-10 w-10 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Bot Challenge</h3>
              <p className="text-gray-400 text-sm">AI training mode</p>
            </div>
            
            <div className="bg-slate-800/30 rounded-lg p-6 text-center border border-slate-700">
              <Brain className="h-10 w-10 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Strategy Arena</h3>
              <p className="text-gray-400 text-sm">Advanced tactical gameplay</p>
            </div>
            
            <div className="bg-slate-800/30 rounded-lg p-6 text-center border border-slate-700">
              <Trophy className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Tournament</h3>
              <p className="text-gray-400 text-sm">Competitive brackets</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-20 bg-slate-800/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">24/7</div>
              <p className="text-gray-400">Platform Availability</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">Real-time</div>
              <p className="text-gray-400">Multiplayer Gaming</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">Advanced</div>
              <p className="text-gray-400">AI Opponents</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">Global</div>
              <p className="text-gray-400">Player Community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Gaming?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join the sophisticated multiplayer gaming platform and experience next-generation interactive gameplay.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              onClick={handleSignIn}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold"
            >
              Get Started Now
            </Button>
            <Button 
              onClick={handleQuickDemo}
              variant="outline"
              size="lg"
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Try Demo First
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Big Boys Game</h3>
              <p className="text-gray-400">
                Sophisticated multiplayer gaming platform with enhanced bot AI and real-time interactive gameplay.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Game Modes</li>
                <li>AI Technology</li>
                <li>Multiplayer System</li>
                <li>Tournaments</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Player Support</li>
                <li>Gaming Guides</li>
                <li>Skill Development</li>
                <li>Fair Play</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Technology</h4>
              <ul className="space-y-2 text-gray-400">
                <li>WebSocket Gaming</li>
                <li>Enhanced Bot AI</li>
                <li>Real-time Engine</li>
                <li>Cross-platform</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Big Boys Game. Sophisticated multiplayer gaming platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}