import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import LandingNav from "@/components/landing/LandingNav";
import FooterSection from "@/components/landing/FooterSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

const businessTypes = [
  "E-commerce Brand",
  "Bar or Restaurant",
  "Event Company",
  "Agency",
  "Content Creator",
  "CPG Brand",
  "Other",
];

export default function BetaPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !businessType) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("beta_waitlist").insert({
      full_name: fullName.trim(),
      email: email.trim(),
      business_type: businessType,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNav />
      <main className="flex-1 flex items-center justify-center px-6 pt-24 pb-16">
        <div className="w-full max-w-[560px]">
          {submitted ? (
            <div className="text-center space-y-6 animate-in fade-in-0 zoom-in-95 duration-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">You're on the list! 🎉</h1>
              <p className="text-muted-foreground text-lg">We'll reach out when your spot is ready.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-primary/10 text-primary">
                  Coming Soon
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Mythos HQ is in private beta.
                </h1>
                <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
                  Join the waitlist and we'll reach out when your spot is ready. We're opening access to a small group of users first.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Shane McKnight"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Join the Waitlist →"}
                </button>

                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">We'll email you when your spot is ready.</p>
                  <p className="text-xs text-muted-foreground/60">We won't spam you. Unsubscribe anytime.</p>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
