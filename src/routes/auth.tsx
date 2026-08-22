import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PiggyBank, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authService } from "@/services/authService";
import { lovable } from "@/integrations/lovable";
import { APP_NAME, APP_TAGLINE, OCCUPATIONS } from "@/constants/app";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to GigSave — Track Earnings & Savings" },
      {
        name: "description",
        content:
          "Sign in or create your free GigSave account to track gig earnings, expenses and savings goals.",
      },
      { property: "og:title", content: "Sign in to GigSave" },
      {
        property: "og:description",
        content: "Create your free GigSave account and start saving automatically.",
      },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Enter your password").max(72),
});

/** Map raw Supabase error messages to actionable, user-friendly text. */
function friendlyAuthError(raw: string): { message: string; needsConfirmation?: boolean } {
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return {
      message: "Email or password is incorrect. Double-check and try again.",
    };
  }
  if (lower.includes("email not confirmed")) {
    return {
      message: "Your email isn't confirmed yet. Check your inbox for the confirmation link.",
      needsConfirmation: true,
    };
  }
  if (lower.includes("user already registered")) {
    return { message: "An account with this email already exists. Try signing in instead." };
  }
  if (lower.includes("password should be at least")) {
    return { message: "Password must be at least 8 characters." };
  }
  return { message: raw };
}

function AuthPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({
    fullName: "",
    email: "",
    password: "",
    occupation: OCCUPATIONS[0],
  });
  // If the user needs to confirm their email, surface a resend button
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    const parsed = signInSchema.safeParse(signIn);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setPending("signin");
    setUnconfirmedEmail(null);
    try {
      await authService.signIn(parsed.data.email, parsed.data.password);
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Could not sign in";
      const { message, needsConfirmation } = friendlyAuthError(raw);
      toast.error(message);
      if (needsConfirmation) setUnconfirmedEmail(parsed.data.email);
    } finally {
      setPending(null);
    }
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    const parsed = signUpSchema.safeParse(signUp);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setPending("signup");
    try {
      const result = await authService.signUp(
        parsed.data.email,
        parsed.data.password,
        parsed.data.fullName,
        signUp.occupation,
      );
      if (result.session) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        // Email confirmation required
        setUnconfirmedEmail(parsed.data.email);
        toast.success(
          "Account created! Check your inbox and click the confirmation link to sign in.",
        );
      }
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Could not create your account";
      toast.error(friendlyAuthError(raw).message);
    } finally {
      setPending(null);
    }
  }

  async function handleGoogle() {
    setPending("google");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard", replace: true });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function handleForgotPassword() {
    const email = signIn.email.trim();
    if (!z.string().email().safeParse(email).success) {
      return toast.error("Enter your email above first, then tap reset.");
    }
    try {
      await authService.sendPasswordReset(email);
      toast.success("Password reset link sent — check your inbox.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send reset link");
    }
  }

  async function handleResendConfirmation() {
    if (!unconfirmedEmail) return;
    setPending("resend");
    try {
      await authService.resendConfirmation(unconfirmedEmail);
      toast.success(`Confirmation email resent to ${unconfirmedEmail}. Check your inbox.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend confirmation");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-x-10 top-0 -z-10 h-72 rounded-full bg-lime-300/30 blur-[100px]" />

      <div className="w-full max-w-md">
        <div className="mb-7 animate-fade-up text-center">
          <Link
            to="/"
            className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-lime-400 text-black shadow-glow transition-transform duration-200 hover:scale-105"
          >
            <PiggyBank className="h-7 w-7" aria-hidden="true" />
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </div>

        {/* Email confirmation nudge */}
        {unconfirmedEmail ? (
          <div className="mb-4 flex animate-fade-up items-start gap-3 rounded-2xl border border-amber/40 bg-amber/10 p-4 [animation-delay:60ms]">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Confirm your email
              </p>
              <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                We sent a confirmation link to{" "}
                <span className="font-medium">{unconfirmedEmail}</span>. Click it to activate your
                account, then sign in.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-0 text-xs font-semibold text-amber-700 hover:text-amber-900 dark:text-amber-300"
                onClick={handleResendConfirmation}
                disabled={pending === "resend"}
              >
                {pending === "resend" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                Resend confirmation email
              </Button>
            </div>
          </div>
        ) : null}

        <div className="animate-fade-up rounded-3xl border border-border bg-card p-6 shadow-sm [animation-delay:100ms]">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form className="space-y-4" onSubmit={handleSignIn}>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    value={signIn.email}
                    onChange={(e) => setSignIn((s) => ({ ...s, email: e.target.value }))}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    value={signIn.password}
                    onChange={(e) => setSignIn((s) => ({ ...s, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
                <Button type="submit" variant="hero" className="w-full" disabled={pending !== null}>
                  {pending === "signin" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form className="space-y-4" onSubmit={handleSignUp}>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    value={signUp.fullName}
                    onChange={(e) => setSignUp((s) => ({ ...s, fullName: e.target.value }))}
                    placeholder="Ravi Kumar"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-occupation">What do you do?</Label>
                  <Select
                    value={signUp.occupation}
                    onValueChange={(value) => setSignUp((s) => ({ ...s, occupation: value }))}
                  >
                    <SelectTrigger id="signup-occupation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCUPATIONS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={signUp.email}
                    onChange={(e) => setSignUp((s) => ({ ...s, email: e.target.value }))}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={signUp.password}
                    onChange={(e) => setSignUp((s) => ({ ...s, password: e.target.value }))}
                    placeholder="At least 8 characters"
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={pending !== null}>
                  {pending === "signup" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create free account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex animate-fade-in items-center gap-3 text-xs text-muted-foreground [animation-delay:160ms]">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full animate-fade-up [animation-delay:180ms]"
            onClick={handleGoogle}
            disabled={pending !== null}
          >
            {pending === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Continue with Google"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
