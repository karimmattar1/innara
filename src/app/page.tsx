import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bot, BarChart3, Shield, ChevronRight } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Concierge",
    description:
      "24/7 intelligent guest assistant powered by Claude. Handles requests, recommendations, and room service in natural language.",
  },
  {
    icon: BedDouble,
    title: "Guest Experience",
    description:
      "Mobile-first portal for service requests, room service ordering, and real-time status tracking — no app download required.",
  },
  {
    icon: BarChart3,
    title: "Operations & Analytics",
    description:
      "Staff dashboards, request routing, SLA tracking, and revenue analytics. One platform replacing 5-15 disconnected tools.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Multi-tenant isolation, role-based access, GDPR compliance, and row-level security on every table.",
  },
];

export default function LandingPage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-navy text-white">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(155,115,64,0.15)_0%,_transparent_70%)]" />
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            <Image
              src="/innaralightlogo2.png"
              alt="Innara"
              width={72}
              height={72}
              priority
            />
            <Image
              src="/innaralightword.png"
              alt="Innara"
              width={180}
              height={48}
              priority
              className="h-auto"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            AI-Powered
            <br />
            <span className="text-bronze-light">Hospitality Operations</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed">
            Replace your fragmented hotel tech stack with a single intelligent
            platform. Guest experience, staff operations, analytics, and AI
            concierge — unified.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href="/auth/guest/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-bronze hover:bg-bronze-light text-white font-semibold rounded-lg transition-colors"
            >
              Guest Portal
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/staff/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-colors"
            >
              Staff Login
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-navy-dark">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Everything your hotel needs.{" "}
            <span className="text-bronze-light">Nothing it doesn&apos;t.</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
              >
                <feature.icon className="w-8 h-8 text-bronze-light mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-white/40 text-sm border-t border-white/10">
        <p>&copy; {new Date().getFullYear()} Innara. A SwampStudios venture.</p>
      </footer>
    </main>
  );
}
