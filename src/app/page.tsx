import { LandingHero } from "@/components/landing/LandingHero";
import { LandingStats } from "@/components/landing/LandingStats";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-navy text-white overflow-hidden">
      <LandingNav />
      <LandingHero />
      <LandingStats />
      <LandingFeatures />
      <LandingFooter />
    </main>
  );
}
