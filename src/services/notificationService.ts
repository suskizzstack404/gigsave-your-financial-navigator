import { supabase, unwrap, requireUserId } from "./client";
import type { AppNotification } from "./types";

export const notificationService = {
  async list(limit = 50): Promise<AppNotification[]> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit),
      "Could not load notifications",
    );
  },

  async create(input: { title: string; message: string; type?: string }): Promise<AppNotification> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("notifications")
        .insert({ ...input, type: input.type ?? "info", user_id: userId })
        .select("*")
        .single(),
      "Could not create notification",
    );
  },

  async markRead(id: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(`Could not update notification: ${error.message}`);
  },

  async markAllRead(): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw new Error(`Could not update notifications: ${error.message}`);
  },

  async remove(id: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(`Could not delete notification: ${error.message}`);
  },
};
