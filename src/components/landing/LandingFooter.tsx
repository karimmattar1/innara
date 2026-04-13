import Image from "next/image";
import Link from "next/link";

export function LandingFooter(): React.ReactElement {
  return (
    <footer className="relative border-t border-white/[0.06] bg-navy-dark">
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Image
            src="/innaralightlogo2.png"
            alt="Innara"
            width={24}
            height={24}
          />
          <span className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} Innara. A SwampStudios venture.
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/auth/guest/login"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Guest Portal
          </Link>
          <Link
            href="/auth/staff/login"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
