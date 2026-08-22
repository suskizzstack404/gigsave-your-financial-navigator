import { toNumber, clampPercent, localISODate, addDays } from "./format";
import type { Expense, Goal, Income, Jar } from "@/services/types";

/**
 * Core GigSave business logic.
 * Kept pure and framework-free so it is trivially testable.
 */

export interface AllocationLine {
  jarId: string;
  jarName: string;
  color: string;
  icon: string;
  percentage: number;
  amount: number;
}

/** Preview of how an income amount will be split across the user's jars. */
export function previewAllocation(
  amount: number,
  jars: Jar[],
): {
  lines: AllocationLine[];
  totalSaved: number;
  available: number;
  totalPercentage: number;
} {
  const safeAmount = Math.max(0, toNumber(amount));
  const lines = jars
    .filter((jar) => toNumber(jar.percentage) > 0)
    .map((jar) => ({
      jarId: jar.id,
      jarName: jar.jar_name,
      color: jar.color,
      icon: jar.icon,
      percentage: toNumber(jar.percentage),
      amount: Math.round(safeAmount * (toNumber(jar.percentage) / 100) * 100) / 100,
    }));
  const totalSaved = lines.reduce((sum, line) => sum + line.amount, 0);
  const totalPercentage = lines.reduce((sum, line) => sum + line.percentage, 0);
  return {
    lines,
    totalSaved,
    available: Math.max(0, safeAmount - totalSaved),
    totalPercentage,
  };
}

export function sumAmount<T extends { amount: number | string }>(rows: T[]): number {
  return rows.reduce((total, row) => total + toNumber(row.amount), 0);
}

export function filterByDate<T>(rows: T[], key: keyof T, date: string): T[] {
  return rows.filter((row) => String(row[key]) === date);
}

export function withinLastDays<T>(rows: T[], key: keyof T, days: number): T[] {
  const from = localISODate(addDays(new Date(), -(days - 1)));
  return rows.filter((row) => String(row[key]) >= from);
}

export function goalProgress(goal: Goal): number {
  return clampPercent(
    (toNumber(goal.current_amount) / Math.max(1, toNumber(goal.target_amount))) * 100,
  );
}

/**
 * Estimated completion date for a goal, based on the average daily amount
 * flowing into its linked jar (or overall daily savings when unlinked).
 */
export function estimateGoalCompletion(
  goal: Goal,
  dailySavingsRate: number,
): {
  daysLeft: number | null;
  date: Date | null;
  label: string;
} {
  const remaining = Math.max(0, toNumber(goal.target_amount) - toNumber(goal.current_amount));
  if (remaining <= 0) return { daysLeft: 0, date: new Date(), label: "Goal achieved" };
  if (dailySavingsRate <= 0) return { daysLeft: null, date: null, label: "Add income to estimate" };
  const daysLeft = Math.ceil(remaining / dailySavingsRate);
  const date = addDays(new Date(), daysLeft);
  const label =
    daysLeft <= 1
      ? "About a day away"
      : daysLeft < 30
        ? `About ${daysLeft} days away`
        : daysLeft < 365
          ? `About ${Math.round(daysLeft / 30)} months away`
          : `About ${(daysLeft / 365).toFixed(1)} years away`;
  return { daysLeft, date, label };
}

export interface HealthBreakdown {
  score: number;
  savingsScore: number;
  goalScore: number;
  expenseScore: number;
  consistencyScore: number;
  label: string;
}

/**
 * Financial Health Score (0-100) = savings rate + goal completion +
 * expense control + recording consistency, each worth 25 points.
 */
export function financialHealthScore(input: {
  income: Income[];
  expenses: Expense[];
  goals: Goal[];
  jars: Jar[];
}): HealthBreakdown {
  const recentIncome = withinLastDays(input.income, "income_date", 30);
  const recentExpenses = withinLastDays(input.expenses, "expense_date", 30);
  const earned = sumAmount(recentIncome);
  const spent = sumAmount(recentExpenses);
  const saved = recentIncome.reduce((total, row) => total + toNumber(row.allocated_amount), 0);

  const savingsRate = earned > 0 ? saved / earned : 0;
  const savingsScore = Math.round(clampPercent((savingsRate / 0.3) * 100) * 0.25);

  const goalAverage =
    input.goals.length > 0
      ? input.goals.reduce((total, goal) => total + goalProgress(goal), 0) / input.goals.length
      : 0;
  const goalScore = Math.round((input.goals.length ? goalAverage : 40) * 0.25);

  const expenseRatio = earned > 0 ? spent / earned : spent > 0 ? 1 : 0.5;
  const expenseScore = Math.round(clampPercent((1 - Math.min(1, expenseRatio)) * 100) * 0.25);

  const activeDays = new Set([
    ...recentIncome.map((row) => row.income_date),
    ...recentExpenses.map((row) => row.expense_date),
  ]).size;
  const consistencyScore = Math.round(clampPercent((activeDays / 20) * 100) * 0.25);

  const score = Math.min(100, savingsScore + goalScore + expenseScore + consistencyScore);
  const label =
    score >= 80
      ? "Excellent"
      : score >= 60
        ? "Healthy"
        : score >= 40
          ? "Fair"
          : score > 0
            ? "Needs work"
            : "Get started";

  return { score, savingsScore, goalScore, expenseScore, consistencyScore, label };
}

export interface Insight {
  title: string;
  message: string;
  tone: "positive" | "neutral" | "warning";
}

/** Rule-based AI coach (v1). Returns the most relevant insights first. */
export function generateInsights(input: {
  income: Income[];
  expenses: Expense[];
  goals: Goal[];
  jars: Jar[];
  health: HealthBreakdown;
}): Insight[] {
  const insights: Insight[] = [];
  const thisWeek = withinLastDays(input.income, "income_date", 7);
  const prevWeekFrom = localISODate(addDays(new Date(), -13));
  const prevWeekTo = localISODate(addDays(new Date(), -7));
  const lastWeek = input.income.filter(
    (row) => row.income_date >= prevWeekFrom && row.income_date < prevWeekTo,
  );

  const thisWeekEarned = sumAmount(thisWeek);
  const lastWeekEarned = sumAmount(lastWeek);
  if (lastWeekEarned > 0 && thisWeekEarned > 0) {
    const change = Math.round(((thisWeekEarned - lastWeekEarned) / lastWeekEarned) * 100);
    if (change >= 5) {
      insights.push({
        title: "Earnings are up",
        message: `You earned ${change}% more this week than last week. Consider raising a jar percentage to lock in the extra.`,
        tone: "positive",
      });
    } else if (change <= -10) {
      insights.push({
        title: "Slower week",
        message: `Earnings dropped ${Math.abs(change)}% versus last week. Your jars kept saving automatically — stay consistent.`,
        tone: "warning",
      });
    }
  }

  const weekExpenses = withinLastDays(input.expenses, "expense_date", 7);
  const weekSpent = sumAmount(weekExpenses);
  if (weekSpent > 0) {
    const byCategory = new Map<string, number>();
    weekExpenses.forEach((row) => {
      byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + toNumber(row.amount));
    });
    const [topCategory, topAmount] = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
    const share = Math.round((topAmount / weekSpent) * 100);
    insights.push({
      title: `${topCategory} is your biggest spend`,
      message: `${share}% of this week's expenses went to ${topCategory.toLowerCase()}. Trimming it by 10% frees up money for your goals.`,
      tone: share > 45 ? "warning" : "neutral",
    });
  }

  const activeGoal = input.goals
    .filter((goal) => !goal.is_completed)
    .sort((a, b) => goalProgress(b) - goalProgress(a))[0];
  if (activeGoal) {
    const remaining = Math.max(
      0,
      toNumber(activeGoal.target_amount) - toNumber(activeGoal.current_amount),
    );
    const dailySaved =
      thisWeek.reduce((total, row) => total + toNumber(row.allocated_amount), 0) / 7;
    if (dailySaved > 0) {
      const days = Math.ceil(remaining / dailySaved);
      const faster = Math.ceil(remaining / (dailySaved + 100));
      insights.push({
        title: `${activeGoal.goal_name} on track`,
        message: `At your current pace you'll get there in about ${days} days. Save ₹100 more each day to finish ${Math.max(1, days - faster)} days earlier.`,
        tone: "positive",
      });
    } else {
      insights.push({
        title: `Start feeding ${activeGoal.goal_name}`,
        message: "Record today's earnings and your linked jar will fill automatically.",
        tone: "neutral",
      });
    }
  }

  const totalPercentage = input.jars.reduce((total, jar) => total + toNumber(jar.percentage), 0);
  if (totalPercentage === 0) {
    insights.push({
      title: "No savings rule yet",
      message: "Set a percentage on at least one jar so every rupee you earn saves itself.",
      tone: "warning",
    });
  } else if (totalPercentage > 70) {
    insights.push({
      title: "Allocation is aggressive",
      message: `You're saving ${totalPercentage}% of every entry. Make sure enough stays available for daily costs.`,
      tone: "warning",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: input.health.score >= 60 ? "You're doing great" : "Welcome to GigSave",
      message:
        input.health.score >= 60
          ? "Your saving habit is steady. Keep recording every day to protect your streak."
          : "Record today's earnings and GigSave will split them into your jars automatically.",
      tone: input.health.score >= 60 ? "positive" : "neutral",
    });
  }

  return insights;
}
