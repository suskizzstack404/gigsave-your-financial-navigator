import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Lightbulb, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeading } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import { useFinancialOverview } from "@/hooks/useFinancialOverview";
import { formatCurrency, toNumber } from "@/utils/format";
import { estimateGoalCompletion, goalProgress } from "@/utils/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "Money Coach — GigSave" },
      {
        name: "description",
        content: "Personalised savings tips based on your real earnings, spending and goals.",
      },
      { property: "og:title", content: "Money Coach — GigSave" },
      { property: "og:description", content: "Your daily money coach for gig work income." },
    ],
  }),
  component: CoachPage,
});

const TONE_CLASS: Record<string, string> = {
  positive: "border-l-4 border-l-[var(--lime-600)]",
  neutral: "border-l-4 border-l-[var(--brand-sky)]",
  warning: "border-l-4 border-l-[var(--brand-amber)]",
};

function CoachPage() {
  const overview = useFinancialOverview();
  const {
    insights,
    health,
    goals,
    jars,
    currency,
    streak,
    dailySavingsRate,
    totalEarned,
    totalSpent,
    totalSaved,
    isLoading,
  } = overview;

  const actions = useMemo(() => {
    const list: { title: string; description: string; to: string; cta: string }[] = [];
    const totalPercentage = jars.reduce((sum, jar) => sum + toNumber(jar.percentage), 0);

    if (jars.length === 0 || totalPercentage === 0) {
      list.push({
        title: "Turn on automatic saving",
        description: "Set a percentage on at least one jar so every earning saves itself.",
        to: "/jars",
        cta: "Set up jars",
      });
    }
    if (goals.length === 0) {
      list.push({
        title: "Name something worth saving for",
        description: "Goals make saving stick. Link one to a jar and it fills automatically.",
        to: "/goals",
        cta: "Create a goal",
      });
    }
    if (totalEarned === 0) {
      list.push({
        title: "Record today's earnings",
        description: "One entry is all it takes to start your streak and fund your jars.",
        to: "/income",
        cta: "Add income",
      });
    }
    if (totalSpent === 0 && totalEarned > 0) {
      list.push({
        title: "Log your costs too",
        description:
          "Fuel, food and repairs decide your real take-home. Track them for an honest picture.",
        to: "/expenses",
        cta: "Add expense",
      });
    }
    if (dailySavingsRate > 0) {
      list.push({
        title: "Push your daily rate a little",
        description: `You save about ${formatCurrency(dailySavingsRate, currency)} a day. Adding 10% compounds fast.`,
        to: "/jars",
        cta: "Adjust jars",
      });
    }
    return list.slice(0, 3);
  }, [jars, goals, totalEarned, totalSpent, dailySavingsRate, currency]);

  const savingsRate = totalEarned > 0 ? Math.round((totalSaved / totalEarned) * 100) : 0;
  const spendRate = totalEarned > 0 ? Math.round((totalSpent / totalEarned) * 100) : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeading
          title="Money Coach"
          description="Chat with GigSave AI, or browse insights from your own numbers below."
        />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Reading your finances…</p>
        ) : (
          <>
            <AiAssistantPanel overview={overview} />

            <div className="flex items-center gap-3 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              From your numbers
              <span className="h-px flex-1 bg-border" />
            </div>

            <GlassCard className="flex flex-wrap items-center gap-6">
              <ProgressRing value={health.score} size={104} thickness={10}>
                <span className="text-2xl font-semibold">{health.score}</span>
                <span className="text-[11px] text-muted-foreground">{health.label}</span>
              </ProgressRing>
              <div className="min-w-50 flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your financial health is{" "}
                  <span className="font-medium text-foreground">{health.label.toLowerCase()}</span>.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-teal" />
                    Saving {savingsRate}% of earnings
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingDown className="h-4 w-4 text-pink" />
                    Spending {spendRate}%
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-amber" />
                    {streak} day streak
                  </span>
                </div>
              </div>
            </GlassCard>

            <section className="space-y-3">
              <SectionHeading title="Today's insights" />
              <div className="grid gap-3">
                {insights.map((insight) => (
                  <GlassCard
                    key={insight.title}
                    className={cn("space-y-1", TONE_CLASS[insight.tone])}
                  >
                    <p className="flex items-center gap-2 font-semibold">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {insight.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{insight.message}</p>
                  </GlassCard>
                ))}
              </div>
            </section>

            {actions.length > 0 ? (
              <section className="space-y-3">
                <SectionHeading title="Next best actions" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {actions.map((action) => (
                    <GlassCard key={action.title} className="flex flex-col gap-3">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 font-semibold">
                          <Lightbulb className="h-4 w-4 text-amber" />
                          {action.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <Button asChild variant="soft" size="sm" className="mt-auto self-start">
                        <Link to={action.to}>{action.cta}</Link>
                      </Button>
                    </GlassCard>
                  ))}
                </div>
              </section>
            ) : null}

            {goals.filter((goal) => !goal.is_completed).length > 0 ? (
              <section className="space-y-3">
                <SectionHeading
                  title="Goal forecast"
                  description="Based on your current saving pace."
                />
                <GlassCard className="divide-y divide-border/60 p-0">
                  {goals
                    .filter((goal) => !goal.is_completed)
                    .map((goal) => {
                      const estimate = estimateGoalCompletion(goal, dailySavingsRate);
                      return (
                        <div key={goal.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{goal.goal_name}</p>
                            <p className="text-xs text-muted-foreground">{estimate.label}</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold">
                            {Math.round(goalProgress(goal))}%
                          </p>
                        </div>
                      );
                    })}
                </GlassCard>
              </section>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
