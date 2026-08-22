import type { AiCoachContext } from "@/services/aiCoachService";
import { toNumber } from "@/utils/format";
import { goalProgress } from "@/utils/finance";
import { queryKeys } from "@/hooks/useGigSaveData";
import type { useFinancialOverview } from "@/hooks/useFinancialOverview";

export type Overview = ReturnType<typeof useFinancialOverview>;

/** Compact, privacy-conscious snapshot of the user's real data, sent as ground truth to the AI. */
export function buildAiContext(overview: Overview): AiCoachContext {
  return {
    currency: overview.currency,
    availableBalance: overview.availableBalance,
    totalEarned: overview.totalEarned,
    totalSpent: overview.totalSpent,
    totalSaved: overview.totalSaved,
    dailySavingsRate: overview.dailySavingsRate,
    streak: overview.streak,
    health: { score: overview.health.score, label: overview.health.label },
    jars: overview.jars.map((jar) => ({
      name: jar.jar_name,
      percentage: toNumber(jar.percentage),
      balance: toNumber(jar.balance),
    })),
    goals: overview.goals.map((goal) => ({
      name: goal.goal_name,
      targetAmount: toNumber(goal.target_amount),
      currentAmount: toNumber(goal.current_amount),
      percentComplete: Math.round(goalProgress(goal)),
    })),
  };
}

/** Query keys to invalidate after a tool call writes real data, shared by text + voice assistants. */
export const AI_ACTION_QUERY_KEYS = [
  queryKeys.jars,
  queryKeys.goals,
  queryKeys.income,
  queryKeys.expenses,
  queryKeys.allocations,
];
