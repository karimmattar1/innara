import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingStats } from "@/components/landing/LandingStats";
import { LandingServices } from "@/components/landing/LandingServices";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingDemo } from "@/components/landing/LandingDemo";
import { LandingBrands } from "@/components/landing/LandingBrands";
import { LandingContact } from "@/components/landing/LandingContact";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-navy text-white scroll-smooth">
      <LandingNav />
      <LandingHero />
      <LandingStats />
      <LandingServices />
      <section id="features">
        <LandingFeatures />
      </section>
      <LandingDemo />
      <LandingBrands />
      <LandingContact />
      <LandingFooter />
    </main>
  );
}
