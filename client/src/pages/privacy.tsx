import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, FileText, Eye } from "lucide-react";

export default function PrivacyPage() {
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
                <Shield className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
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
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>Name, email address, and phone number</li>
              <li>Date of birth for age verification</li>
              <li>Banking information for deposits and withdrawals</li>
              <li>Identity verification documents as required by law</li>
              <li>Location data for regulatory compliance</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Gaming Data</h3>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>Game history and statistics</li>
              <li>Transaction records</li>
              <li>Chat messages and communications</li>
              <li>Device information and IP addresses</li>
              <li>Voice chat recordings (premium games only)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li><strong>Service Provision:</strong> To operate games, process transactions, and manage your account</li>
              <li><strong>Security:</strong> To prevent fraud, ensure fair play, and maintain platform integrity</li>
              <li><strong>Communication:</strong> To send game notifications, updates, and support responses</li>
              <li><strong>Compliance:</strong> To meet legal obligations and regulatory requirements</li>
              <li><strong>Improvement:</strong> To analyze usage patterns and enhance user experience</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              We do not sell your personal information. We may share your data only in the following circumstances:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li><strong>Service Providers:</strong> Payment processors, identity verification services, and cloud hosting providers</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or regulatory authorities</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of business assets</li>
              <li><strong>Safety:</strong> To protect users' safety and prevent illegal activities</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li>256-bit SSL encryption for all data transmission</li>
              <li>Regular security audits and penetration testing</li>
              <li>Secure data centers with 24/7 monitoring</li>
              <li>Multi-factor authentication options</li>
              <li>Regular staff training on data protection</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              You have the following rights regarding your personal data:
            </p>
            <ul className="mb-6 text-gray-700 leading-relaxed list-disc pl-6">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Export your data in a readable format</li>
              <li><strong>Objection:</strong> Object to certain data processing activities</li>
              <li><strong>Restriction:</strong> Request limitation of data processing</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We use cookies and similar technologies to enhance your experience. Essential cookies are required for platform functionality, while analytics cookies help us improve our services. You can manage cookie preferences in your browser settings.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We retain your data for as long as necessary to provide services and comply with legal obligations. Game records are kept for 7 years for audit purposes. Personal data is deleted within 30 days of account closure, except where required by law.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Transfers</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Your data may be processed in countries outside your residence. We ensure adequate protection through appropriate safeguards such as standard contractual clauses and adequacy decisions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Our platform is not intended for users under 18. We do not knowingly collect personal information from children. If we discover that a child has provided personal information, we will delete it immediately.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Privacy Policy</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              We may update this privacy policy periodically. Significant changes will be communicated via email or platform notifications. Your continued use of the platform constitutes acceptance of the updated policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="mb-2 text-gray-700">For privacy-related questions or to exercise your rights, contact us:</p>
              <ul className="text-gray-700">
                <li>Email: privacy@bigboysgame.com</li>
                <li>Phone: +234 901 234 5678</li>
                <li>Address: Victoria Island, Lagos, Nigeria</li>
                <li>Data Protection Officer: dpo@bigboysgame.com</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setLocation('/')} className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Back to Platform
              </Button>
              <Button onClick={() => setLocation('/terms')} variant="outline" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Terms & Conditions
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}