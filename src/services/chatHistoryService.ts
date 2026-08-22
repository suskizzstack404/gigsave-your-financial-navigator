import { supabase, unwrap, requireUserId } from "./client";
import type { AiChatMessageRow } from "./types";

export const chatHistoryService = {
  async list(limit = 100): Promise<AiChatMessageRow[]> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("ai_chat_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(limit),
      "Could not load chat history",
    );
  },

  async append(role: "user" | "assistant", content: string): Promise<AiChatMessageRow> {
    const userId = await requireUserId();
    return unwrap(
      await supabase
        .from("ai_chat_messages")
        .insert({ user_id: userId, role, content })
        .select("*")
        .single(),
      "Could not save chat message",
    );
  },

  async clear(): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from("ai_chat_messages").delete().eq("user_id", userId);
    if (error) throw new Error(`Could not clear chat history: ${error.message}`);
  },
};
