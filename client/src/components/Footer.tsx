import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  Gamepad2
} from "lucide-react";

export function Footer() {
  const [, setLocation] = useLocation();

  // Social media handlers with professional URLs
  const handleSocialClick = (platform: string) => {
    const socialUrls = {
      facebook: "https://facebook.com/bigboysgame",
      twitter: "https://twitter.com/bigboysgame", 
      instagram: "https://instagram.com/bigboysgame",
      youtube: "https://youtube.com/@bigboysgame"
    };
    
    // Open in new tab
    window.open(socialUrls[platform as keyof typeof socialUrls], '_blank');
  };

  const handleEmailContact = () => {
    window.location.href = "mailto:support@bigboysgame.com";
  };

  const handlePhoneContact = () => {
    window.location.href = "tel:+2349012345678";
  };

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <Gamepad2 className="h-8 w-8 mr-3 text-primary" />
              <h3 className="text-2xl font-bold">Big Boys Game</h3>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              The Ultimate Digital Stone-Rolling Experience. Authentic Nigerian gaming tradition meets modern technology.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-3">
              <button 
                onClick={() => handleSocialClick('facebook')}
                className="bg-gray-800 hover:bg-blue-600 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleSocialClick('twitter')}
                className="bg-gray-800 hover:bg-blue-400 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleSocialClick('instagram')}
                className="bg-gray-800 hover:bg-pink-600 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleSocialClick('youtube')}
                className="bg-gray-800 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                aria-label="Subscribe to our YouTube"
              >
                <Youtube className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => setLocation('/')} 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/about')} 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/demo-new')} 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Try Demo
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/auth')} 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Sign In / Register
                </button>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Support</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => setLocation('/contact')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center text-left"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/terms')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/privacy')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/responsible-gaming')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Responsible Gaming
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/about')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Security & Fair Play
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-gray-400 text-sm">
                  <p>Lagos, Nigeria</p>
                  <p>Victoria Island</p>
                </div>
              </div>
              
              <button 
                onClick={handleEmailContact}
                className="flex items-center text-gray-400 hover:text-white transition-colors duration-200"
              >
                <Mail className="h-5 w-5 mr-3 text-primary" />
                <span className="text-sm">support@bigboysgame.com</span>
              </button>
              
              <button 
                onClick={handlePhoneContact}
                className="flex items-center text-gray-400 hover:text-white transition-colors duration-200"
              >
                <Phone className="h-5 w-5 mr-3 text-primary" />
                <span className="text-sm">+234 901 234 5678</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 pt-8 border-t border-gray-800">
          <Button
            onClick={() => setLocation('/demo-new')}
            className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
          >
            <Gamepad2 className="h-4 w-4 mr-2" />
            Try Free Demo
          </Button>
          <Button
            onClick={() => setLocation('/auth')}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Sign In / Register
          </Button>
        </div>
        
        {/* Copyright and legal */}
        <div className="pt-8 border-t border-gray-800">
          <div className="text-center text-gray-500 text-sm">
            <p className="mb-4">© 2025 Big Boys Game. All rights reserved.</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <p>For entertainment purposes only. 18+ only. Play responsibly.</p>
              <div className="flex items-center gap-4">
                <span className="text-green-400 font-semibold">✓ Secure</span>
                <span className="text-blue-400 font-semibold">✓ Licensed</span>
                <span className="text-purple-400 font-semibold">✓ Fair Play</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}