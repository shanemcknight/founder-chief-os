import LandingNav from "@/components/landing/LandingNav";
import FooterSection from "@/components/landing/FooterSection";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-[720px] mx-auto">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-10">Effective Date: April 11, 2026</p>

          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Who We Are</h2>
              <p>MYTHOS HQ ("we", "our", "us") is a user operating system that provides AI-powered business tools including social media management, sales pipelines, email, publishing, and custom AI agents. This policy explains how we collect, use, and protect your personal information.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">What Information We Collect</h2>
              <p className="mb-2">We collect information you provide directly, including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account information (name, email address, password)</li>
                <li>Business details (company name, industry, team size)</li>
                <li>Content you create, upload, or manage through our platform</li>
                <li>Communications with our support team</li>
                <li>Payment and billing information (processed by our payment provider)</li>
              </ul>
              <p className="mt-3">We also automatically collect usage data, device information, IP addresses, and analytics to improve our services.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">How We Use Your Information</h2>
              <p className="mb-2">We use your information to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide, maintain, and improve MYTHOS HQ services</li>
                <li>Process transactions and manage your subscription</li>
                <li>Power AI features including Chief, content generation, and agent deployment</li>
                <li>Send service-related communications and updates</li>
                <li>Detect and prevent fraud, abuse, and security incidents</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Third-Party Services</h2>
              <p>We integrate with third-party services (e.g., Gmail, Shopify, Slack, LinkedIn) at your direction. When you connect an integration, data flows between MYTHOS HQ and that service according to both our policy and theirs. We encourage you to review the privacy policies of any third-party services you connect.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Data Retention</h2>
              <p>We retain your data for as long as your account is active or as needed to provide services. When you delete your account, we remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention, financial records).</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Your Rights</h2>
              <p className="mb-2">Depending on your jurisdiction, you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to or restrict certain processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-3">To exercise these rights, contact us at privacy@mythoshq.io.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Cookies</h2>
              <p>We use essential cookies to keep you logged in and maintain your session. We may also use analytics cookies to understand how you use our platform. You can manage cookie preferences through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Children's Privacy</h2>
              <p>MYTHOS HQ is not intended for use by individuals under 16 years of age. We do not knowingly collect personal information from children. If we learn that we have collected data from a child, we will delete it promptly.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the effective date. Continued use of MYTHOS HQ after changes constitutes acceptance of the revised policy.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Contact</h2>
              <p>If you have questions about this Privacy Policy or your data, contact us at <a href="mailto:privacy@mythoshq.io" className="text-primary hover:underline">privacy@mythoshq.io</a>.</p>
            </section>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
