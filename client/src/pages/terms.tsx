import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Scale, Shield, FileText } from "lucide-react";

export default function TermsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
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
                <Scale className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          
          <div className="mb-8">
            <p className="text-gray-600 text-lg">
              Last updated: January 22, 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              By accessing and using Big Boys Game ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Big Boys Game is a digital gaming platform that provides online stone-rolling games where users can stake money and compete for prizes. The platform facilitates multiplayer and single-player games with real money transactions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Age Requirements</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              You must be at least 18 years old to use this platform. By using our services, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into this agreement.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Account</h2>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must provide accurate and truthful information during registration</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Game Rules and Fair Play</h2>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>All games use certified random number generation for fair outcomes</li>
              <li>Cheating, fraud, or any attempt to manipulate game results is strictly prohibited</li>
              <li>The platform reserves the right to void games if irregularities are detected</li>
              <li>Commission rates are clearly displayed before joining any game</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Financial Terms</h2>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>All transactions are processed securely through approved payment providers</li>
              <li>Platform commission rates range from 5% to 20% depending on game type</li>
              <li>Withdrawals are processed within 24-48 hours to verified bank accounts</li>
              <li>Minimum and maximum stake limits apply to different game types</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Responsible Gaming</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We are committed to promoting responsible gaming. Users are encouraged to set personal limits and seek help if gaming becomes problematic. We provide tools for self-exclusion and spending limits upon request.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Prohibited Activities</h2>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>Using multiple accounts to gain unfair advantage</li>
              <li>Colluding with other players to manipulate game outcomes</li>
              <li>Using automated software or bots to play games</li>
              <li>Money laundering or other illegal financial activities</li>
              <li>Harassing or threatening other users</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Platform Availability</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              While we strive for 99.9% uptime, the platform may occasionally be unavailable due to maintenance, technical issues, or circumstances beyond our control. We are not liable for any losses due to service interruptions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Big Boys Game shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our platform. Our total liability is limited to the amount of funds in your account at the time of any incident.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Privacy and Data Protection</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information. By using our platform, you consent to our data practices as outlined in the Privacy Policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Modifications to Terms</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or platform notifications. Continued use of the platform after changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Termination</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We may terminate or suspend accounts at our discretion for violations of these terms. Upon termination, you may withdraw any remaining account balance subject to verification procedures.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Governing Law</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              These terms are governed by the laws of Nigeria. Any disputes will be resolved through binding arbitration in Lagos, Nigeria.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="mb-2 text-gray-700">For questions about these terms, please contact us:</p>
              <ul className="text-gray-700">
                <li>Email: legal@bigboysgame.com</li>
                <li>Phone: +234 901 234 5678</li>
                <li>Address: Victoria Island, Lagos, Nigeria</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setLocation('/')} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Back to Platform
              </Button>
              <Button onClick={() => setLocation('/privacy')} variant="outline" className="flex-1">
                <Shield className="h-4 w-4 mr-2" />
                Privacy Policy
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}