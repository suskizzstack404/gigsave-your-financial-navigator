import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { profileService } from "@/services/authService";
import { incomeService } from "@/services/incomeService";
import { expenseService } from "@/services/expenseService";
import { jarService } from "@/services/jarService";
import { goalService } from "@/services/goalService";
import { notificationService } from "@/services/notificationService";
import type {
  ExpenseInsert,
  ExpenseUpdate,
  GoalInsert,
  GoalUpdate,
  JarInsert,
  JarUpdate,
  ProfileUpdate,
} from "@/services/types";

export const queryKeys = {
  profile: ["profile"] as const,
  income: ["income"] as const,
  expenses: ["expenses"] as const,
  jars: ["jars"] as const,
  goals: ["goals"] as const,
  allocations: ["allocations"] as const,
  notifications: ["notifications"] as const,
};

/** Everything the dashboard/analytics derive from — invalidated after any write. */
const FINANCIAL_KEYS = [
  queryKeys.income,
  queryKeys.expenses,
  queryKeys.jars,
  queryKeys.goals,
  queryKeys.allocations,
];

function useInvalidateFinancials() {
  const queryClient = useQueryClient();
  return () => FINANCIAL_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
}

function onError(error: unknown) {
  toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => profileService.get(),
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfileUpdate) => profileService.update(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      toast.success("Profile updated");
    },
    onError,
  });
}

export function useIncome() {
  return useQuery({
    queryKey: queryKeys.income,
    queryFn: () => incomeService.list(),
    staleTime: 30_000,
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses,
    queryFn: () => expenseService.list(),
    staleTime: 30_000,
  });
}

export function useJars() {
  return useQuery({
    queryKey: queryKeys.jars,
    queryFn: () => jarService.list(),
    staleTime: 30_000,
  });
}

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals,
    queryFn: () => goalService.list(),
    staleTime: 30_000,
  });
}

export function useAllocations() {
  return useQuery({
    queryKey: queryKeys.allocations,
    queryFn: () => jarService.allocations(),
    staleTime: 30_000,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationService.list(),
    staleTime: 30_000,
  });
}

export function useAddIncome() {
  const invalidate = useInvalidateFinancials();
  return useMutation({
    mutationFn: (input: {
      amount: number;
      source: string;
      notes?: string | null;
      income_date: string;
    }) => incomeService.create(input),
    onSuccess: () => {
      invalidate();
      toast.success("Income recorded and split into your jars");
    },
    onError,
  });
}

export function useDeleteIncome() {
  const invalidate = useInvalidateFinancials();
  return useMutation({
    mutationFn: (id: string) => incomeService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Income deleted and jar balances restored");
    },
    onError,
  });
}

export function useUpdateIncome() {
  const invalidate = useInvalidateFinancials();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { source?: string; notes?: string | null; income_date?: string };
    }) => incomeService.update(id, patch),
    onSuccess: () => {
      invalidate();
      toast.success("Income updated");
    },
    onError,
  });
}

export function useAddExpense() {
  const invalidate = useInvalidateFinancials();
  return useMutation({
    mutationFn: (input: Omit<ExpenseInsert, "user_id">) => expenseService.create(input),
    onSuccess: () => {
      invalidate();
      toast.success("Expense recorded");
    },
    onError,
  });
}

export function useUpdateExpense() {
  const invalidate = useInvalidateFinancials();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ExpenseUpdate }) =>
      expenseService.update(id, patch),
    onSuccess: () => {
      invalidate();
      toast.success("Expense updated");
    },
    onError,
  });
}

export function useDeleteExpense() {
  const invalidate = useInvalidateFinancials();
  return useMutation({
    mutationFn: (id: string) => expenseService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Expense deleted");
    },
    onError,
  });
}

export function useSaveJar() {
  const invalidate = useInvalidateFinancials();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: Omit<JarInsert, "user_id"> | JarUpdate }) =>
      id
        ? jarService.update(id, input as JarUpdate)
        : jarService.create(input as Omit<JarInsert, "user_id">),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(variables.id ? "Jar updated" : "Jar created");
    },
    onError,
  });
}

export function useDeleteJar() {
  const invalidate = useInvalidateFinancials();
  return useMutation({
    mutationFn: (id: string) => jarService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Jar deleted");
    },
    onError,
  });
}

export function useSaveGoal() {
  const invalidate = useInvalidateFinancials();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id?: string;
      input: Omit<GoalInsert, "user_id"> | GoalUpdate;
    }) =>
      id
        ? goalService.update(id, input as GoalUpdate)
        : goalService.create(input as Omit<GoalInsert, "user_id">),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(variables.id ? "Goal updated" : "Goal created");
    },
    onError,
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateFinancials();
  return useMutation({
    mutationFn: (id: string) => goalService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Goal deleted");
    },
    onError,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) =>
      id ? notificationService.markRead(id) : notificationService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
    onError,
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
    onError,
  });
}
