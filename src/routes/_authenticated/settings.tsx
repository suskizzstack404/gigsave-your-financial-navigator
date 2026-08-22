import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeading } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile, useUpdateProfile } from "@/hooks/useGigSaveData";
import { authService } from "@/services/authService";
import { LANGUAGES, OCCUPATIONS } from "@/constants/app";
import { toNumber } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — GigSave" },
      {
        name: "description",
        content: "Manage your GigSave profile, currency, language, budget and notifications.",
      },
      { property: "og:title", content: "Settings — GigSave" },
      { property: "og:description", content: "Personalise your GigSave account." },
    ],
  }),
  component: SettingsPage,
});

const CURRENCIES = [
  { value: "INR", label: "₹ Indian Rupee" },
  { value: "USD", label: "$ US Dollar" },
  { value: "EUR", label: "€ Euro" },
  { value: "GBP", label: "£ British Pound" },
];

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(60),
  phone: z.string().trim().max(20).optional(),
  occupation: z.string().trim().max(60).optional(),
  preferred_currency: z.string().min(1),
  preferred_language: z.string().min(1),
  monthly_expense_budget: z.coerce.number().min(0, "Budget cannot be negative").max(100_000_000),
  notifications_enabled: z.boolean(),
  daily_reminder_enabled: z.boolean(),
});

function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    occupation: "",
    preferred_currency: "INR",
    preferred_language: "en",
    monthly_expense_budget: "0",
    notifications_enabled: true,
    daily_reminder_enabled: true,
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      occupation: profile.occupation ?? "",
      preferred_currency: profile.preferred_currency ?? "INR",
      preferred_language: profile.preferred_language ?? "en",
      monthly_expense_budget: String(toNumber(profile.monthly_expense_budget)),
      notifications_enabled: profile.notifications_enabled ?? true,
      daily_reminder_enabled: profile.daily_reminder_enabled ?? true,
    });
  }, [profile]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    updateProfile.mutate({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      occupation: parsed.data.occupation || null,
      preferred_currency: parsed.data.preferred_currency,
      preferred_language: parsed.data.preferred_language,
      monthly_expense_budget: parsed.data.monthly_expense_budget,
      notifications_enabled: parsed.data.notifications_enabled,
      daily_reminder_enabled: parsed.data.daily_reminder_enabled,
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authService.signOut();
      navigate({ to: "/auth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out");
      setSigningOut(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeading
          title="Settings"
          description="Your profile, money preferences and reminders."
        />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your settings…</p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <GlassCard className="space-y-4">
              <SectionHeading title="Profile" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    value={form.full_name}
                    onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    inputMode="tel"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Select
                    value={form.occupation || undefined}
                    onValueChange={(value) => setForm((s) => ({ ...s, occupation: value }))}
                  >
                    <SelectTrigger id="occupation">
                      <SelectValue placeholder="What kind of gig work do you do?" />
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
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <SectionHeading title="Money preferences" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={form.preferred_currency}
                    onValueChange={(value) => setForm((s) => ({ ...s, preferred_currency: value }))}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={form.preferred_language}
                    onValueChange={(value) => setForm((s) => ({ ...s, preferred_language: value }))}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="budget">Monthly expense budget</Label>
                  <Input
                    id="budget"
                    inputMode="decimal"
                    placeholder="15000"
                    value={form.monthly_expense_budget}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, monthly_expense_budget: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Set 0 to turn the budget off.</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <SectionHeading title="Notifications" />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">In-app notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Milestones, goal wins and savings nudges.
                  </p>
                </div>
                <Switch
                  checked={form.notifications_enabled}
                  onCheckedChange={(checked) =>
                    setForm((s) => ({ ...s, notifications_enabled: checked }))
                  }
                  aria-label="Toggle notifications"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Daily reminder</p>
                  <p className="text-xs text-muted-foreground">
                    A nudge to record the day's earnings.
                  </p>
                </div>
                <Switch
                  checked={form.daily_reminder_enabled}
                  onCheckedChange={(checked) =>
                    setForm((s) => ({ ...s, daily_reminder_enabled: checked }))
                  }
                  aria-label="Toggle daily reminder"
                />
              </div>
            </GlassCard>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="hero" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save changes
              </Button>
              <Button type="button" variant="outline" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Sign out
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
