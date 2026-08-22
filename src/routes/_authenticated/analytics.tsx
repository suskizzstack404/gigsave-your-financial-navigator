import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeading } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ReferenceAnalyticsCard } from "@/components/analytics/ReferenceAnalyticsCard";
import { useFinancialOverview } from "@/hooks/useFinancialOverview";
import { addDays, formatCompact, formatCurrency, localISODate, toNumber } from "@/utils/format";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Reveal } from "@/components/ui/reveal";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — GigSave" },
      {
        name: "description",
        content: "See earnings trends, spending breakdowns and your financial health score.",
      },
      { property: "og:title", content: "Analytics — GigSave" },
      {
        property: "og:description",
        content: "Charts and trends for gig income, expenses and savings.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const PIE_TONES = [
  "var(--chart-income)",
  "var(--chart-savings)",
  "var(--chart-neutral)",
  "var(--lime-800)",
  "oklch(0.4 0.006 100)",
  "var(--lime-300)",
];

function AnalyticsPage() {
  const overview = useFinancialOverview();
  const {
    income,
    expenses,
    jars,
    currency,
    health,
    totalEarned,
    totalSpent,
    totalSaved,
    transactions,
    isLoading,
  } = overview;

  const daily = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, index) =>
      localISODate(addDays(new Date(), -(13 - index))),
    );
    return days.map((day) => ({
      label: day.slice(5),
      income: income.filter((r) => r.income_date === day).reduce((s, r) => s + toNumber(r.amount), 0),
      expenses: expenses
        .filter((r) => r.expense_date === day)
        .reduce((s, r) => s + toNumber(r.amount), 0),
    }));
  }, [income, expenses]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((row) =>
      map.set(row.category, (map.get(row.category) ?? 0) + toNumber(row.amount)),
    );
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    income.forEach((row) => map.set(row.source, (map.get(row.source) ?? 0) + toNumber(row.amount)));
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [income]);

  const recentActivity = useMemo(
    () =>
      transactions
        .slice(0, 6)
        .map((t) => ({ label: t.label, amount: t.amount, kind: t.kind })),
    [transactions],
  );

  const hasData = income.length > 0 || expenses.length > 0;
  const savingsRate = totalEarned > 0 ? (totalSaved / totalEarned) * 100 : 0;

  const tooltipFormatter = (value: number | string) => formatCurrency(Number(value), currency);
  const axisFormatter = (value: number) => formatCompact(value, currency);

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeading
          title="Analytics"
          description="Where your money comes from and where it goes."
        />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Crunching your numbers…</p>
        ) : !hasData ? (
          <EmptyState
            icon={<BarChart3 className="h-8 w-8" />}
            title="Nothing to chart yet"
            description="Record some income and expenses and your trends will appear here."
          />
        ) : (
          <>
            {/* Exactly the same component, cards, chart types/styling and layout as the
                landing page's "Reference Analytics" section — only the data differs. */}
            <ReferenceAnalyticsCard
              stats={[
                { label: "Total earned", value: formatCurrency(totalEarned, currency) },
                { label: "Total saved", value: formatCurrency(totalSaved, currency) },
                { label: "Total spent", value: formatCurrency(totalSpent, currency) },
                { label: "Savings rate", value: `${savingsRate.toFixed(1)}%` },
              ]}
              trend={daily}
              categories={byCategory}
              categoryColors={PIE_TONES}
              transactions={recentActivity}
              formatValue={(n) => formatCurrency(n, currency)}
            />

            {/* Dashboard-only sections beyond the reference design. */}
            <GlassCard className="space-y-4">
              <SectionHeading
                title="Financial health"
                description={`${health.label} — ${health.score}/100`}
              />
              <div className="flex flex-wrap items-center gap-6">
                <ProgressRing value={health.score} size={110} thickness={10}>
                  <span className="text-2xl font-semibold">
                    <AnimatedNumber value={health.score} format={(n) => String(Math.round(n))} />
                  </span>
                  <span className="text-[11px] text-muted-foreground">{health.label}</span>
                </ProgressRing>
                <div className="min-w-55 flex-1 space-y-3">
                  {[
                    { label: "Savings rate", value: health.savingsScore },
                    { label: "Goal progress", value: health.goalScore },
                    { label: "Expense control", value: health.expenseScore },
                    { label: "Consistency", value: health.consistencyScore },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value}/25</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-700"
                          style={{ width: `${(item.value / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {bySource.length > 0 ? (
              <Reveal>
                <GlassCard className="space-y-4">
                  <SectionHeading title="Top income sources" />
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bySource} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                          stroke="var(--muted-foreground)"
                        />
                        <YAxis
                          tickFormatter={axisFormatter}
                          tickLine={false}
                          axisLine={false}
                          width={60}
                          fontSize={11}
                          stroke="var(--muted-foreground)"
                        />
                        <Tooltip
                          cursor={{ fill: "var(--muted)" }}
                          formatter={tooltipFormatter}
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            color: "var(--foreground)",
                          }}
                        />
                        <Bar dataKey="value" name="Earned" radius={[8, 8, 0, 0]} fill="var(--chart-income)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </Reveal>
            ) : null}

            {jars.length > 0 ? (
              <Reveal>
                <GlassCard className="space-y-3">
                  <SectionHeading title="Jar balances" />
                  {jars.map((jar) => (
                    <div key={jar.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{jar.jar_name}</span>
                      <span className="font-semibold">
                        {formatCurrency(toNumber(jar.balance), currency)}
                      </span>
                    </div>
                  ))}
                </GlassCard>
              </Reveal>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
