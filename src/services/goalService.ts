import { supabase, unwrap, requireUserId } from "./client";
import type { Goal, GoalInsert, GoalUpdate } from "./types";

export const goalService = {
  async list(): Promise<Goal[]> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      "Could not load goals",
    );
  },

  async create(input: Omit<GoalInsert, "user_id">): Promise<Goal> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("goals")
        .insert({ ...input, user_id: userId })
        .select("*")
        .single(),
      "Could not create goal",
    );
  },

  async update(id: string, patch: GoalUpdate): Promise<Goal> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("goals")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single(),
      "Could not update goal",
    );
  },

  async remove(id: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", userId);
    if (error) throw new Error(`Could not delete goal: ${error.message}`);
  },
};
