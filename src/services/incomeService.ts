import { supabase, unwrap, requireUserId } from "./client";
import type { Income, IncomeUpdate } from "./types";

export const incomeService = {
  async list(limit = 500): Promise<Income[]> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("income")
        .select("*")
        .eq("user_id", userId)
        .order("income_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit),
      "Could not load income",
    );
  },

  /**
   * Records income and lets the database split it across jars atomically,
   * so jar balances, goal progress and available balance stay consistent.
   */
  async create(input: {
    amount: number;
    source: string;
    notes?: string | null;
    income_date: string;
  }) {
    const { data, error } = await supabase.rpc("record_income", {
      p_amount: input.amount,
      p_source: input.source,
      p_notes: input.notes ?? "",
      p_income_date: input.income_date,
    });
    if (error) throw new Error(`Could not save income: ${error.message}`);
    return data as string;
  },

  /** Edits metadata only — amount changes are handled by delete + re-create. */
  async update(id: string, patch: IncomeUpdate): Promise<Income> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("income")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single(),
      "Could not update income",
    );
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.rpc("delete_income", { p_income_id: id });
    if (error) throw new Error(`Could not delete income: ${error.message}`);
  },
};
