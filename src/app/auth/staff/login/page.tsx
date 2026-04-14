"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { InnaraLogo } from "@/components/innara/Logo";
import { GlassButton } from "@/components/ui/glass-button";
import { BorderBeam } from "@/components/ui/border-beam";
import { Spotlight } from "@/components/ui/spotlight";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function StaffLoginPage(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.push("/staff");
  }

  return (
    <div className="dark">
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground overflow-hidden">
        {/* Spotlight */}
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#9B7340"
        />
        {/* Decorative background orbs */}
        <div
          className="pointer-events-none absolute top-24 right-[5%] h-72 w-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(155, 115, 64, 0.15), transparent 70%)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-24 left-[5%] h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(26, 29, 58, 0.3), transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <InnaraLogo variant="light" size="md" />
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 font-playfair text-3xl font-medium">Staff Console</h1>
            <p className="text-muted-foreground">Access the operations dashboard</p>
          </div>

          {/* Form card */}
          <div className="glass-card-dark relative p-6 sm:p-8">
            <BorderBeam size={180} duration={12} />
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="staff@hotel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 rounded-xl border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="staff-password">Password</Label>
                  <Link
                    href="/auth/staff/forgot-password"
                    className="text-xs text-bronze hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="staff-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 rounded-xl border-white/10 bg-white/5 pr-11 text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <GlassButton
                type="submit"
                variant="solid"
                disabled={isLoading}
                className="h-11 w-full rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </GlassButton>
            </form>
          </div>

          {/* Guest link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Guest?{" "}
            <Link
              href="/auth/guest/login"
              className="font-semibold text-bronze hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
