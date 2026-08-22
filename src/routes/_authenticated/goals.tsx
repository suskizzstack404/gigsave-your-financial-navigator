import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeading } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { ProgressRing } from "@/components/ui/progress-ring";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteGoal, useSaveGoal } from "@/hooks/useGigSaveData";
import { useFinancialOverview } from "@/hooks/useFinancialOverview";
import { JAR_ICONS } from "@/constants/app";
import { formatCurrency, formatDate, localISODate, toNumber } from "@/utils/format";
import { estimateGoalCompletion, goalProgress } from "@/utils/finance";
import { toneStyle } from "@/utils/tone";
import { cn } from "@/lib/utils";
import type { Goal } from "@/services/types";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Savings Goals — GigSave" },
      {
        name: "description",
        content:
          "Set savings goals, link them to a jar and watch GigSave estimate your finish date.",
      },
      { property: "og:title", content: "Savings Goals — GigSave" },
      {
        property: "og:description",
        content: "Track progress toward every goal with automatic jar funding.",
      },
    ],
  }),
  component: GoalsPage,
});

const NO_JAR = "none";

const schema = z.object({
  goal_name: z.string().trim().min(2, "Name your goal").max(60),
  icon: z.string().min(1),
  target_amount: z.coerce.number().positive("Target must be above zero").max(100_000_000),
  deadline: z.string().optional(),
  jar_id: z.string().optional(),
});

const emptyForm = {
  goal_name: "",
  icon: "target",
  target_amount: "",
  deadline: "",
  jar_id: NO_JAR,
};

function GoalsPage() {
  const { goals, jars, currency, dailySavingsRate, isLoading } = useFinancialOverview();
  const saveGoal = useSaveGoal();
  const deleteGoal = useDeleteGoal();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  function openCreate() {
    setEditingId(undefined);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditingId(goal.id);
    setForm({
      goal_name: goal.goal_name,
      icon: goal.icon,
      target_amount: String(toNumber(goal.target_amount)),
      deadline: goal.deadline ?? "",
      jar_id: goal.jar_id ?? NO_JAR,
    });
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    const jarId = parsed.data.jar_id && parsed.data.jar_id !== NO_JAR ? parsed.data.jar_id : null;
    const linkedJar = jars.find((jar) => jar.id === jarId);

    saveGoal.mutate(
      {
        id: editingId,
        input: {
          goal_name: parsed.data.goal_name,
          icon: parsed.data.icon,
          target_amount: parsed.data.target_amount,
          deadline: parsed.data.deadline || null,
          jar_id: jarId,
          current_amount: linkedJar
            ? Math.min(parsed.data.target_amount, toNumber(linkedJar.balance))
            : 0,
          is_completed: linkedJar
            ? toNumber(linkedJar.balance) >= parsed.data.target_amount
            : false,
        },
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeading
          title="Goals"
          description="Link a goal to a jar and it fills itself as you earn."
          action={
            <Button variant="hero" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New goal
            </Button>
          }
        />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your goals…</p>
        ) : goals.length === 0 ? (
          <EmptyState
            icon={<Target className="h-8 w-8" />}
            title="No goals yet"
            description="A new phone, a bike service, an emergency cushion — name it and start saving."
            action={
              <Button variant="hero" onClick={openCreate}>
                Create a goal
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((goal) => {
              const jar = jars.find((item) => item.id === goal.jar_id);
              const tone = jar?.color ?? "violet";
              const progress = goalProgress(goal);
              const estimate = estimateGoalCompletion(goal, dailySavingsRate);
              const remaining = Math.max(
                0,
                toNumber(goal.target_amount) - toNumber(goal.current_amount),
              );

              return (
                <GlassCard key={goal.id} className="space-y-4">
                  <div className="flex items-start gap-4">
                    <ProgressRing value={progress} tone={tone} size={72} thickness={7}>
                      <span className="text-sm font-semibold">{Math.round(progress)}%</span>
                    </ProgressRing>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
                          style={toneStyle(tone)}
                        >
                          <DynamicIcon name={goal.icon} className="h-3.5 w-3.5" />
                        </span>
                        <p className="truncate font-semibold">{goal.goal_name}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(toNumber(goal.current_amount), currency)} of{" "}
                        {formatCurrency(toNumber(goal.target_amount), currency)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {goal.is_completed ? (
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Goal achieved
                          </span>
                        ) : (
                          <>
                            {formatCurrency(remaining, currency)} to go · {estimate.label}
                          </>
                        )}
                      </p>
                      {goal.deadline ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Target date {formatDate(goal.deadline)}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {jar ? `Funded by ${jar.jar_name}` : "Not linked to a jar"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="soft"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(goal)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${goal.goal_name}`}
                      onClick={() => deleteGoal.mutate(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit goal" : "New goal"}</DialogTitle>
            <DialogDescription>
              Link a jar so the goal fills automatically with every earning.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="goal-name">Goal name</Label>
              <Input
                id="goal-name"
                placeholder="New smartphone"
                value={form.goal_name}
                onChange={(e) => setForm((s) => ({ ...s, goal_name: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="goal-target">Target amount</Label>
                <Input
                  id="goal-target"
                  inputMode="decimal"
                  placeholder="20000"
                  value={form.target_amount}
                  onChange={(e) => setForm((s) => ({ ...s, target_amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-deadline">Target date (optional)</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  min={localISODate()}
                  value={form.deadline}
                  onChange={(e) => setForm((s) => ({ ...s, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-jar">Funded by jar</Label>
              <Select
                value={form.jar_id}
                onValueChange={(value) => setForm((s) => ({ ...s, jar_id: value }))}
              >
                <SelectTrigger id="goal-jar">
                  <SelectValue placeholder="Choose a jar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_JAR}>No jar (track manually)</SelectItem>
                  {jars.map((jar) => (
                    <SelectItem key={jar.id} value={jar.id}>
                      {jar.jar_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {["target", ...JAR_ICONS].map((icon) => (
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
                    style={toneStyle("violet")}
                  >
                    <DynamicIcon name={icon} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" variant="hero" disabled={saveGoal.isPending}>
                {saveGoal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingId ? "Save changes" : "Create goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
