import { useMemo } from "react";

import {
  useAllocations,
  useExpenses,
  useGoals,
  useIncome,
  useJars,
  useProfile,
} from "./useGigSaveData";
import { localISODate, toNumber, addDays } from "@/utils/format";
import { financialHealthScore, generateInsights, sumAmount, withinLastDays } from "@/utils/finance";
import type { Transaction } from "@/services/types";

/**
 * Single derived view of the user's finances used by the dashboard,
 * analytics and the AI coach so every screen agrees on the numbers.
 */
export function useFinancialOverview() {
  const profileQuery = useProfile();
  const incomeQuery = useIncome();
  const expensesQuery = useExpenses();
  const jarsQuery = useJars();
  const goalsQuery = useGoals();
  const allocationsQuery = useAllocations();

  const income = useMemo(() => incomeQuery.data ?? [], [incomeQuery.data]);
  const expenses = useMemo(() => expensesQuery.data ?? [], [expensesQuery.data]);
  const jars = useMemo(() => jarsQuery.data ?? [], [jarsQuery.data]);
  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);
  const allocations = useMemo(() => allocationsQuery.data ?? [], [allocationsQuery.data]);

  const isLoading =
    incomeQuery.isLoading ||
    expensesQuery.isLoading ||
    jarsQuery.isLoading ||
    goalsQuery.isLoading ||
    allocationsQuery.isLoading;

  return useMemo(() => {
    const today = localISODate();

    const todayIncomeRows = income.filter((row) => row.income_date === today);
    const todayExpenseRows = expenses.filter((row) => row.expense_date === today);

    const todayEarnings = sumAmount(todayIncomeRows);
    const todayExpenses = sumAmount(todayExpenseRows);
    const todaySavings = todayIncomeRows.reduce(
      (total, row) => total + toNumber(row.allocated_amount),
      0,
    );

    const totalEarned = sumAmount(income);
    const totalSpent = sumAmount(expenses);
    const totalSaved = income.reduce((total, row) => total + toNumber(row.allocated_amount), 0);
    const jarBalance = jars.reduce((total, jar) => total + toNumber(jar.balance), 0);
    const availableBalance = totalEarned - totalSaved - totalSpent;

    const weekIncome = withinLastDays(income, "income_date", 7);
    const dailySavingsRate = weekIncome.length
      ? weekIncome.reduce((total, row) => total + toNumber(row.allocated_amount), 0) / 7
      : 0;

    const transactions: Transaction[] = [
      ...income.map((row) => ({
        id: row.id,
        kind: "income" as const,
        label: row.source,
        amount: toNumber(row.amount),
        date: row.income_date,
        note: row.notes,
        createdAt: row.created_at,
      })),
      ...expenses.map((row) => ({
        id: row.id,
        kind: "expense" as const,
        label: row.category,
        amount: toNumber(row.amount),
        date: row.expense_date,
        note: row.note,
        createdAt: row.created_at,
      })),
    ].sort((a, b) =>
      a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
    );

    const health = financialHealthScore({ income, expenses, goals, jars });
    const insights = generateInsights({ income, expenses, goals, jars, health });

    const activeDates = new Set(income.map((row) => row.income_date));
    let streak = 0;
    for (let i = 0; i < 365; i += 1) {
      const day = localISODate(addDays(new Date(), -i));
      if (activeDates.has(day)) streak += 1;
      else if (i > 0) break;
    }

    return {
      isLoading,
      profile: profileQuery.data ?? null,
      currency: profileQuery.data?.preferred_currency ?? "INR",
      income,
      expenses,
      jars,
      goals,
      allocations,
      transactions,
      todayEarnings,
      todayExpenses,
      todaySavings,
      totalEarned,
      totalSpent,
      totalSaved,
      jarBalance,
      availableBalance,
      dailySavingsRate,
      health,
      insights,
      streak,
    };
  }, [income, expenses, jars, goals, allocations, isLoading, profileQuery.data]);
}
