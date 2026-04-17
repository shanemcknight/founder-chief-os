import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PillarsSection from "@/components/landing/PillarsSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import PricingSection from "@/components/landing/PricingSection";
import FooterSection from "@/components/landing/FooterSection";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <HowItWorksSection />
      <PillarsSection />
      <UseCasesSection />
      <PricingSection />
      <FooterSection />
    </div>
  );
}
