"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { InnaraLogo } from "@/components/innara/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

export default function GuestLoginPage(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.push("/guest");
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="gradient-bg" />
      <div className="gradient-orb-1" />
      <div className="gradient-orb-3" />

      {/* Header */}
      <header className="mobile-header px-5 py-4 flex items-center gap-4 relative z-10">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-xl hover:bg-muted/50 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <InnaraLogo size="sm" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-5 py-10 relative z-10">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-medium mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to access your hotel experience
            </p>
          </div>

          {/* Login form */}
          <form
            onSubmit={handleSubmit}
            className="glass-card p-6 space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12 rounded-xl border-border/60 bg-white/90 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 pr-12 rounded-xl border-border/60 bg-white/90 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer links */}
          <p className="text-center mt-8 text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/guest/register"
              className="text-bronze font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>

          <p className="text-center mt-4 text-sm text-muted-foreground">
            Staff member?{" "}
            <Link
              href="/auth/staff/login"
              className="text-bronze font-semibold hover:underline"
            >
              Staff Console
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
