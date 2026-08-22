import { supabase, unwrap, requireUserId } from "./client";
import type { Expense, ExpenseInsert, ExpenseUpdate } from "./types";

export const expenseService = {
  async list(limit = 500): Promise<Expense[]> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit),
      "Could not load expenses",
    );
  },

  async create(input: Omit<ExpenseInsert, "user_id">): Promise<Expense> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("expenses")
        .insert({ ...input, user_id: userId })
        .select("*")
        .single(),
      "Could not save expense",
    );
  },

  async update(id: string, patch: ExpenseUpdate): Promise<Expense> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("expenses")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single(),
      "Could not update expense",
    );
  },

  async remove(id: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", userId);
    if (error) throw new Error(`Could not delete expense: ${error.message}`);
  },
};
