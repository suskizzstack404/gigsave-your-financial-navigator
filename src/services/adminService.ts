import { supabase } from "./client";

export interface PlatformStats {
  total_users: number;
  total_income: number;
  total_expenses: number;
  total_savings: number;
  total_goals: number;
  completed_goals: number;
  users_today: number;
  income_today: number;
  expenses_today: number;
}

export interface AdminUser {
  id: string;
  full_name: string;
  occupation: string | null;
  phone: string | null;
  preferred_currency: string;
  preferred_language: string;
  created_at: string;
  updated_at: string;
  total_income: number;
  total_expenses: number;
  total_savings: number;
  goals_count: number;
  admin_role: string | null;
}

export interface UserListResult {
  users: AdminUser[] | null;
  total_count: number;
}

export interface UserDetail {
  profile: {
    id: string;
    full_name: string;
    occupation: string | null;
    phone: string | null;
    avatar_url: string | null;
    preferred_currency: string;
    preferred_language: string;
    theme: string;
    notifications_enabled: boolean;
    daily_reminder_enabled: boolean;
    monthly_expense_budget: number;
    created_at: string;
    updated_at: string;
  };
  jars: Array<{
    id: string;
    jar_name: string;
    icon: string;
    color: string;
    percentage: number;
    balance: number;
  }> | null;
  goals: Array<{
    id: string;
    goal_name: string;
    icon: string;
    target_amount: number;
    current_amount: number;
    is_completed: boolean;
    deadline: string | null;
  }> | null;
  recent_income: Array<{
    id: string;
    amount: number;
    source: string;
    notes: string | null;
    income_date: string;
    allocated_amount: number;
  }> | null;
  recent_expenses: Array<{
    id: string;
    amount: number;
    category: string;
    note: string | null;
    expense_date: string;
  }> | null;
  stats: {
    total_income: number;
    total_expenses: number;
    total_savings: number;
    income_count: number;
    expense_count: number;
  };
}

export const adminService = {
  async checkIsAdmin(): Promise<boolean> {
    const { data, error } = await supabase.rpc("is_admin");
    if (error) return false;
    return data === true;
  },

  async getAdminRole(): Promise<string | null> {
    const { data, error } = await supabase.rpc("get_admin_role");
    if (error) return null;
    return data;
  },

  async getPlatformStats(): Promise<PlatformStats> {
    const { data, error } = await supabase.rpc("admin_get_platform_stats");
    if (error) throw new Error(`Failed to get platform stats: ${error.message}`);
    return data as unknown as PlatformStats;
  },

  async listUsers(limit = 50, offset = 0, search?: string): Promise<UserListResult> {
    const { data, error } = await supabase.rpc("admin_list_users", {
      p_limit: limit,
      p_offset: offset,
      p_search: search || null,
    });
    if (error) throw new Error(`Failed to list users: ${error.message}`);
    return data as unknown as UserListResult;
  },

  async getUserDetail(userId: string): Promise<UserDetail> {
    const { data, error } = await supabase.rpc("admin_get_user_detail", {
      p_user_id: userId,
    });
    if (error) throw new Error(`Failed to get user detail: ${error.message}`);
    return data as unknown as UserDetail;
  },
};
