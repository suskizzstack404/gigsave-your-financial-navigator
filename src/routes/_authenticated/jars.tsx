import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, PiggyBank, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeading } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteJar, useJars, useProfile, useSaveJar } from "@/hooks/useGigSaveData";
import { JAR_COLORS, JAR_ICONS } from "@/constants/app";
import { formatCurrency, toNumber } from "@/utils/format";
import { toneStyle } from "@/utils/tone";
import { cn } from "@/lib/utils";
import type { Jar } from "@/services/types";

export const Route = createFileRoute("/_authenticated/jars")({
  head: () => ({
    meta: [
      { title: "Savings Jars — GigSave" },
      {
        name: "description",
        content: "Create savings jars and set the percentage of every earning that saves itself.",
      },
      { property: "og:title", content: "Savings Jars — GigSave" },
      {
        property: "og:description",
        content: "Automatic percentage-based savings jars for gig workers.",
      },
    ],
  }),
  component: JarsPage,
});

const schema = z.object({
  jar_name: z.string().trim().min(2, "Give your jar a name").max(40),
  icon: z.string().min(1),
  color: z.string().min(1),
  percentage: z.coerce
    .number()
    .min(0, "Percentage cannot be negative")
    .max(100, "Percentage cannot exceed 100"),
});

const emptyForm = {
  jar_name: "",
  icon: JAR_ICONS[0] as string,
  color: JAR_COLORS[0] as string,
  percentage: 10,
};

function JarsPage() {
  const { data: jars = [], isLoading } = useJars();
  const { data: profile } = useProfile();
  const saveJar = useSaveJar();
  const deleteJar = useDeleteJar();
  const currency = profile?.preferred_currency ?? "INR";

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState(emptyForm);

  const totals = useMemo(() => {
    const percentage = jars.reduce((sum, jar) => sum + toNumber(jar.percentage), 0);
    const balance = jars.reduce((sum, jar) => sum + toNumber(jar.balance), 0);
    return { percentage, balance };
  }, [jars]);

  function openCreate() {
    setEditingId(undefined);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(jar: Jar) {
    setEditingId(jar.id);
    setForm({
      jar_name: jar.jar_name,
      icon: jar.icon,
      color: jar.color,
      percentage: toNumber(jar.percentage),
    });
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    const othersPercentage = jars
      .filter((jar) => jar.id !== editingId)
      .reduce((sum, jar) => sum + toNumber(jar.percentage), 0);
    if (othersPercentage + parsed.data.percentage > 100) {
      return toast.error("Total jar percentage cannot exceed 100%");
    }

    saveJar.mutate({ id: editingId, input: parsed.data }, { onSuccess: () => setOpen(false) });
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeading
          title="Savings Jars"
          description="Every jar takes its share of each earning, automatically."
          action={
            <Button variant="hero" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New jar
            </Button>
          }
        />

        <GlassCard className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total saved</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatCurrency(totals.balance, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Saving rule</p>
            <p className="mt-1 text-2xl font-semibold">{totals.percentage}%</p>
            <p className="text-xs text-muted-foreground">
              {totals.percentage === 0
                ? "Set a percentage so earnings save themselves."
                : `${100 - totals.percentage}% of each earning stays available to spend.`}
            </p>
          </div>
        </GlassCard>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your jars…</p>
        ) : jars.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="h-8 w-8" />}
            title="No jars yet"
            description="Create your first jar and pick what share of every earning goes into it."
            action={
              <Button variant="hero" onClick={openCreate}>
                Create a jar
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {jars.map((jar) => (
              <GlassCard key={jar.id} className="space-y-4">
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                    style={toneStyle(jar.color)}
                  >
                    <DynamicIcon name={jar.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{jar.jar_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {toNumber(jar.percentage)}% of every earning
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    {formatCurrency(toNumber(jar.balance), currency)}
                  </p>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${Math.min(100, toNumber(jar.percentage))}%`,
                      backgroundColor: `var(--brand-${jar.color})`,
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="soft" size="sm" className="flex-1" onClick={() => openEdit(jar)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${jar.jar_name}`}
                    onClick={() => deleteJar.mutate(jar.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit jar" : "New jar"}</DialogTitle>
            <DialogDescription>
              Pick a name, a look, and the share of each earning it should take.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="jar-name">Jar name</Label>
              <Input
                id="jar-name"
                placeholder="Emergency Fund"
                value={form.jar_name}
                onChange={(e) => setForm((s) => ({ ...s, jar_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {JAR_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    aria-label={icon}
                    aria-pressed={form.icon === icon}
                    onClick={() => setForm((s) => ({ ...s, icon }))}
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-xl border border-border/60 transition",
                      form.icon === icon && "ring-2 ring-primary",
                    )}
                    style={toneStyle(form.color)}
                  >
                    <DynamicIcon name={icon} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Colour</Label>
              <div className="flex flex-wrap gap-2">
                {JAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    aria-pressed={form.color === color}
                    onClick={() => setForm((s) => ({ ...s, color }))}
                    className={cn(
                      "h-8 w-8 rounded-full border border-border/60 transition",
                      form.color === color &&
                        "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                    style={{ backgroundColor: `var(--brand-${color})` }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="jar-percentage">Auto-save percentage</Label>
                <span className="text-sm font-semibold">{form.percentage}%</span>
              </div>
              <Slider
                id="jar-percentage"
                value={[form.percentage]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) => setForm((s) => ({ ...s, percentage: value }))}
              />
            </div>

            <DialogFooter>
              <Button type="submit" variant="hero" disabled={saveJar.isPending}>
                {saveJar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingId ? "Save changes" : "Create jar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
