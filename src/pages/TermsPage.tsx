import LandingNav from "@/components/landing/LandingNav";
import FooterSection from "@/components/landing/FooterSection";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-[720px] mx-auto">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-10">Effective Date: April 11, 2026</p>

          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Acceptance of Terms</h2>
              <p>By accessing or using MYTHOS HQ ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users, including free and paid subscribers.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Description of Service</h2>
              <p>MYTHOS HQ is a user operating system that provides AI-powered tools for social media management, sales pipeline tracking, email management, content publishing, and custom AI agent deployment. Features and availability may vary by subscription tier.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Your Account</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration. You agree to notify us immediately of any unauthorized use of your account.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Acceptable Use</h2>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or its infrastructure</li>
                <li>Use AI agents to generate spam, misleading content, or impersonate others</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">AI-Generated Content</h2>
              <p>MYTHOS HQ uses artificial intelligence to generate content, suggestions, and automated actions. While we strive for accuracy, AI-generated content may contain errors or inaccuracies. You are solely responsible for reviewing and approving any AI-generated content before publication or distribution. We make no guarantees about the accuracy, completeness, or suitability of AI outputs.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Third-Party Integrations</h2>
              <p>The Service allows you to connect third-party platforms (e.g., Gmail, Shopify, Slack). Your use of these integrations is subject to the respective third-party terms. We are not responsible for the availability, accuracy, or policies of third-party services.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Subscription and Billing</h2>
              <p>Paid features require an active subscription. Subscriptions renew automatically unless cancelled before the renewal date. Refunds are handled on a case-by-case basis. We reserve the right to change pricing with 30 days' notice.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Data and Privacy</h2>
              <p>Your use of the Service is also governed by our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. By using the Service, you consent to the collection and use of your data as described therein.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Intellectual Property</h2>
              <p>The Service, including its design, code, logos, and AI models, is the intellectual property of MYTHOS HQ. You retain ownership of content you create using the Service. By using the Service, you grant us a limited license to process your content as necessary to provide the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Disclaimers</h2>
              <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Limitation of Liability</h2>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, MYTHOS HQ SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Termination</h2>
              <p>We may suspend or terminate your account at our discretion if you violate these terms. You may close your account at any time through Settings → Account → Delete Account. Upon termination, your right to use the Service ceases immediately.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Governing Law</h2>
              <p>These terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict of law principles.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Changes to These Terms</h2>
              <p>We may modify these terms at any time. Material changes will be communicated via email or in-app notification at least 30 days before taking effect. Continued use of the Service after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Contact</h2>
              <p>For questions about these Terms of Service, contact us at <a href="mailto:legal@mythoshq.io" className="text-primary hover:underline">legal@mythoshq.io</a>.</p>
            </section>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
