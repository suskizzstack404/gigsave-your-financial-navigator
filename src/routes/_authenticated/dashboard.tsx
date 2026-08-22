import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Plus, Sparkles, TrendingUp, Wallet } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeading } from "@/components/ui/glass-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { EmptyState } from "@/components/ui/empty-state";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/ui/reveal";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useFinancialOverview } from "@/hooks/useFinancialOverview";
import { formatCurrency, relativeDay, toNumber } from "@/utils/format";
import { toneStyle } from "@/utils/tone";
import { goalProgress } from "@/utils/finance";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const overview = useFinancialOverview();
  const { currency } = overview;

  return (
    <AppShell streak={overview.streak}>
      <div className="space-y-6">
        <GlassCard className="animate-fade-up border-0 bg-black text-white shadow-glow">
          <p className="text-sm/6 text-white/70">Available to spend</p>
          {overview.isLoading ? (
            <Skeleton className="mt-2 h-9 w-40 bg-white/25" />
          ) : (
            <p className="mt-1 text-4xl font-extrabold tracking-tight">
              <AnimatedNumber
                value={overview.availableBalance}
                format={(n) => formatCurrency(n, currency)}
              />
            </p>
          )}
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-white/10 px-2 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-white/60">Earned today</p>
              <p className="mt-0.5 text-sm font-bold text-lime-400">
                <AnimatedNumber value={overview.todayEarnings} format={(n) => formatCurrency(n, currency)} />
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-2 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-white/60">Spent today</p>
              <p className="mt-0.5 text-sm font-bold">
                <AnimatedNumber value={overview.todayExpenses} format={(n) => formatCurrency(n, currency)} />
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-2 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-white/60">Saved today</p>
              <p className="mt-0.5 text-sm font-bold text-lime-400">
                <AnimatedNumber value={overview.todaySavings} format={(n) => formatCurrency(n, currency)} />
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="grid animate-fade-up gap-3 [animation-delay:60ms] sm:grid-cols-2">
          <Button asChild variant="hero" size="lg" className="w-full">
            <Link to="/income">
              <Plus className="h-4 w-4" /> Add income
            </Link>
          </Button>
          <Button asChild variant="soft" size="lg" className="w-full">
            <Link to="/expenses">
              <ArrowDownRight className="h-4 w-4" /> Add expense
            </Link>
          </Button>
        </div>

        <GlassCard className="animate-fade-up [animation-delay:120ms]">
          <div className="flex items-center gap-5">
            <ProgressRing
              value={overview.health.score}
              tone="lime"
              label={`Financial health ${overview.health.score} of 100`}
            >
              <span className="text-xl font-extrabold">{overview.health.score}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                score
              </span>
            </ProgressRing>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Financial health: {overview.health.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{`${overview.health.savingsScore + overview.health.expenseScore}/50 on saving and spending control.`}</p>
              <Link
                to="/analytics"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <TrendingUp className="h-3.5 w-3.5" /> See analytics
              </Link>
            </div>
          </div>
        </GlassCard>

        <section className="space-y-3">
          <SectionHeading
            title="Savings jars"
            description="Every rupee you earn is split automatically."
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/jars">Manage</Link>
              </Button>
            }
          />
          {overview.jars.length === 0 ? (
            <EmptyState
              title="No jars yet"
              description="Create jars like Emergency, Bike Fund or Rent to auto-split your income."
              action={
                <Button asChild variant="hero">
                  <Link to="/jars">Create a jar</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {overview.jars.map((jar, i) => (
                <Reveal key={jar.id} index={i}>
                  <GlassCard className="flex items-center gap-4">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                      style={toneStyle(jar.color)}
                    >
                      <DynamicIcon name={jar.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{jar.jar_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {toNumber(jar.percentage)}% of every income
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold">
                      {formatCurrency(toNumber(jar.balance), currency)}
                    </p>
                  </GlassCard>
                </Reveal>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeading
            title="Active goals"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/goals">All goals</Link>
              </Button>
            }
          />
          {overview.goals.length === 0 ? (
            <EmptyState
              title="Set your first goal"
              description="A new phone, a bike, or an emergency cushion — GigSave tracks it for you."
              action={
                <Button asChild variant="hero">
                  <Link to="/goals">Add a goal</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {overview.goals.slice(0, 3).map((goal, i) => {
                const percent = goalProgress(goal);
                return (
                  <Reveal key={goal.id} index={i}>
                    <GlassCard className="flex items-center gap-4">
                      <ProgressRing value={percent} size={62} thickness={7} tone="lime">
                        <span className="text-xs font-bold">{Math.round(percent)}%</span>
                      </ProgressRing>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{goal.goal_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(toNumber(goal.current_amount), currency)} of{" "}
                          {formatCurrency(toNumber(goal.target_amount), currency)}
                        </p>
                      </div>
                    </GlassCard>
                  </Reveal>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeading title="Recent activity" />
          {overview.transactions.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-8 w-8" />}
              title="Nothing recorded yet"
              description="Log your first earning to see it here."
            />
          ) : (
            <GlassCard className="divide-y divide-border/60 p-0">
              {overview.transactions.slice(0, 8).map((item, i) => (
                <Reveal
                  key={`${item.kind}-${item.id}`}
                  index={Math.min(i, 6)}
                  stagger={40}
                  className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-accent/50"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                      item.kind === "income" ? "bg-teal/15 text-teal" : "bg-pink/15 text-pink"
                    }`}
                  >
                    {item.kind === "income" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{relativeDay(item.date)}</p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold ${
                      item.kind === "income" ? "text-teal" : "text-foreground"
                    }`}
                  >
                    {item.kind === "income" ? "+" : "−"}
                    {formatCurrency(item.amount, currency)}
                  </p>
                </Reveal>
              ))}
            </GlassCard>
          )}
        </section>

        <Reveal>
          <GlassCard className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-warm text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Your money coach</p>
              <p className="truncate text-xs text-muted-foreground">
                {overview.insights[0]?.message ?? "Log some income to unlock personalised tips."}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link to="/coach">Open</Link>
            </Button>
          </GlassCard>
        </Reveal>
      </div>
    </AppShell>
  );
}
