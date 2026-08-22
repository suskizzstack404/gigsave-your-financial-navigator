export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_chat_messages: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          expense_date: string;
          id: string;
          note: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category?: string;
          created_at?: string;
          expense_date?: string;
          id?: string;
          note?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          expense_date?: string;
          id?: string;
          note?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          created_at: string;
          current_amount: number;
          deadline: string | null;
          goal_name: string;
          icon: string;
          id: string;
          is_completed: boolean;
          jar_id: string | null;
          target_amount: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_amount?: number;
          deadline?: string | null;
          goal_name: string;
          icon?: string;
          id?: string;
          is_completed?: boolean;
          jar_id?: string | null;
          target_amount: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_amount?: number;
          deadline?: string | null;
          goal_name?: string;
          icon?: string;
          id?: string;
          is_completed?: boolean;
          jar_id?: string | null;
          target_amount?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goals_jar_id_fkey";
            columns: ["jar_id"];
            isOneToOne: false;
            referencedRelation: "jars";
            referencedColumns: ["id"];
          },
        ];
      };
      income: {
        Row: {
          allocated_amount: number;
          amount: number;
          created_at: string;
          id: string;
          income_date: string;
          notes: string | null;
          source: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          allocated_amount?: number;
          amount: number;
          created_at?: string;
          id?: string;
          income_date?: string;
          notes?: string | null;
          source?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          allocated_amount?: number;
          amount?: number;
          created_at?: string;
          id?: string;
          income_date?: string;
          notes?: string | null;
          source?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      jar_allocations: {
        Row: {
          allocated_on: string;
          amount: number;
          created_at: string;
          id: string;
          income_id: string | null;
          jar_id: string;
          user_id: string;
        };
        Insert: {
          allocated_on?: string;
          amount: number;
          created_at?: string;
          id?: string;
          income_id?: string | null;
          jar_id: string;
          user_id: string;
        };
        Update: {
          allocated_on?: string;
          amount?: number;
          created_at?: string;
          id?: string;
          income_id?: string | null;
          jar_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jar_allocations_income_id_fkey";
            columns: ["income_id"];
            isOneToOne: false;
            referencedRelation: "income";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jar_allocations_jar_id_fkey";
            columns: ["jar_id"];
            isOneToOne: false;
            referencedRelation: "jars";
            referencedColumns: ["id"];
          },
        ];
      };
      jars: {
        Row: {
          balance: number;
          color: string;
          created_at: string;
          icon: string;
          id: string;
          jar_name: string;
          percentage: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          jar_name: string;
          percentage?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          jar_name?: string;
          percentage?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          title: string;
          type?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          daily_reminder_enabled: boolean;
          full_name: string;
          id: string;
          monthly_expense_budget: number;
          notifications_enabled: boolean;
          occupation: string | null;
          phone: string | null;
          preferred_currency: string;
          preferred_language: string;
          theme: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          daily_reminder_enabled?: boolean;
          full_name?: string;
          id: string;
          monthly_expense_budget?: number;
          notifications_enabled?: boolean;
          occupation?: string | null;
          phone?: string | null;
          preferred_currency?: string;
          preferred_language?: string;
          theme?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          daily_reminder_enabled?: boolean;
          full_name?: string;
          id?: string;
          monthly_expense_budget?: number;
          notifications_enabled?: boolean;
          occupation?: string | null;
          phone?: string | null;
          preferred_currency?: string;
          preferred_language?: string;
          theme?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_get_platform_stats: { Args: Record<string, never>; Returns: Json };
      admin_get_user_detail: { Args: { p_user_id: string }; Returns: Json };
      admin_list_users: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string | null };
        Returns: Json;
      };
      delete_income: { Args: { p_income_id: string }; Returns: undefined };
      get_admin_role: { Args: Record<string, never>; Returns: string | null };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      record_income: {
        Args: {
          p_amount: number;
          p_income_date: string;
          p_notes: string;
          p_source: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
