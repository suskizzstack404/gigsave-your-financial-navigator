import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset your GigSave password" },
      { name: "description", content: "Choose a new password for your GigSave account." },
      { property: "og:title", content: "Reset your GigSave password" },
      { property: "og:description", content: "Choose a new password for your GigSave account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = z.string().min(8, "Use at least 8 characters").max(72).safeParse(password);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (password !== confirm) return toast.error("Passwords don't match");

    setSaving(true);
    try {
      await authService.updatePassword(password);
      toast.success("Password updated. You're all set.");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-x-10 top-0 -z-10 h-72 rounded-full bg-lime-300/30 blur-[100px]" />

      <div className="w-full max-w-sm animate-fade-up rounded-3xl border border-border bg-card p-6 shadow-sm">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lime-400 text-black shadow-glow">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "Choose a password you'll remember."
            : "Open this page from the reset link we emailed you."}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!ready}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={!ready}
            />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={!ready || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
