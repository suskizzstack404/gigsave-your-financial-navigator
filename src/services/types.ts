import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export type Jar = Tables<"jars">;
export type JarInsert = TablesInsert<"jars">;
export type JarUpdate = TablesUpdate<"jars">;

export type Goal = Tables<"goals">;
export type GoalInsert = TablesInsert<"goals">;
export type GoalUpdate = TablesUpdate<"goals">;

export type Income = Tables<"income">;
export type IncomeUpdate = TablesUpdate<"income">;

export type Expense = Tables<"expenses">;
export type ExpenseInsert = TablesInsert<"expenses">;
export type ExpenseUpdate = TablesUpdate<"expenses">;

export type JarAllocation = Tables<"jar_allocations">;
export type AppNotification = Tables<"notifications">;

export type AiChatMessageRow = Tables<"ai_chat_messages">;
export type AiChatMessageInsert = TablesInsert<"ai_chat_messages">;

export interface Transaction {
  id: string;
  kind: "income" | "expense";
  label: string;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}
