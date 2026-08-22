import { supabase, unwrap, requireUserId } from "./client";
import type { Jar, JarInsert, JarUpdate, JarAllocation } from "./types";

export const jarService = {
  async list(): Promise<Jar[]> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("jars")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      "Could not load savings jars",
    );
  },

  async create(input: Omit<JarInsert, "user_id">): Promise<Jar> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("jars")
        .insert({ ...input, user_id: userId })
        .select("*")
        .single(),
      "Could not create jar",
    );
  },

  async update(id: string, patch: JarUpdate): Promise<Jar> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("jars")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single(),
      "Could not update jar",
    );
  },

  async remove(id: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from("jars").delete().eq("id", id).eq("user_id", userId);
    if (error) throw new Error(`Could not delete jar: ${error.message}`);
  },

  async allocations(limit = 800): Promise<JarAllocation[]> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("jar_allocations")
        .select("*")
        .eq("user_id", userId)
        .order("allocated_on", { ascending: true })
        .limit(limit),
      "Could not load savings history",
    );
  },
};
