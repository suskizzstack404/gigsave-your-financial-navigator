import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export interface ReferenceAnalyticsStat {
  label: string;
  value: string;
}

export interface ReferenceAnalyticsTrendPoint {
  label: string;
  income: number;
  expenses: number;
}

export interface ReferenceAnalyticsCategory {
  name: string;
  value: number;
}

export interface ReferenceAnalyticsTransaction {
  label: string;
  amount: number;
  kind: "income" | "expense";
}

/**
 * The exact analytics card design used on the landing page's "Reference
 * Analytics" section — cards, chart types/dimensions/styling, typography,
 * spacing, tooltips and legends are identical wherever this is rendered.
 * The ONLY thing that should ever differ between call sites is the data
 * (and the value formatter, since the dashboard supports multiple
 * currencies while the landing demo is fixed-format). Do not fork this
 * markup — if the design needs to change, change it here so both the
 * landing page and the dashboard stay in sync.
 */
export function ReferenceAnalyticsCard({
  stats,
  trend,
  categories,
  categoryColors,
  transactions,
  formatValue,
  className,
}: {
  stats: ReferenceAnalyticsStat[];
  trend: ReferenceAnalyticsTrendPoint[];
  categories: ReferenceAnalyticsCategory[];
  categoryColors: string[];
  transactions: ReferenceAnalyticsTransaction[];
  formatValue: (n: number) => string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[2.25rem] border border-black/5 bg-white p-4 shadow-sm sm:p-7", className)}>
      <div className="grid gap-3 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} index={i} stagger={80} className="rounded-2xl bg-[#f5f6f2] p-4">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-lg font-bold sm:text-xl">{stat.value}</p>
          </Reveal>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Reveal index={4} className="rounded-2xl bg-[#f5f6f2] p-4 sm:p-5">
          <p className="text-xs font-semibold text-zinc-500">Income vs expenses</p>
          <div className="mt-3 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="referenceIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-income)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-income)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="referenceExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-expense)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--chart-expense)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number) => formatValue(value)}
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="var(--chart-income)"
                  fill="url(#referenceIncome)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="var(--chart-expense)"
                  fill="url(#referenceExpense)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Reveal>

        <Reveal index={5} className="rounded-2xl bg-[#f5f6f2] p-4 sm:p-5">
          <p className="text-xs font-semibold text-zinc-500">Spending by category</p>
          <div className="mt-1 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {categories.map((entry, i) => (
                    <Cell key={entry.name} fill={categoryColors[i % categoryColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatValue(value)}
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {categories.map((c, i) => (
              <span key={c.name} className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: categoryColors[i % categoryColors.length] }}
                />
                {c.name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal index={6} className="mt-4 rounded-2xl bg-[#f5f6f2] p-4 sm:p-5">
        <p className="text-xs font-semibold text-zinc-500">Recent activity</p>
        <div className="mt-2 divide-y divide-black/5">
          {transactions.map((t) => (
            <div key={t.label} className="flex items-center justify-between py-2 text-sm">
              <span className="text-zinc-700">{t.label}</span>
              <span className={cn("font-semibold", t.kind === "income" ? "text-lime-700" : "text-zinc-500")}>
                {t.kind === "income" ? "+" : "−"}
                {formatValue(Math.abs(t.amount))}
              </span>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
