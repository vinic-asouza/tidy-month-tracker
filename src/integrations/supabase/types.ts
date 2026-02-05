export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      credit_card_monthly_status: {
        Row: {
          created_at: string
          credit_card_id: string
          id: string
          paid: boolean
          updated_at: string
          user_id: string
          year_month: string
        }
        Insert: {
          created_at?: string
          credit_card_id: string
          id?: string
          paid?: boolean
          updated_at?: string
          user_id: string
          year_month: string
        }
        Update: {
          created_at?: string
          credit_card_id?: string
          id?: string
          paid?: boolean
          updated_at?: string
          user_id?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_monthly_status_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          color: string
          created_at: string
          display_order: number
          id: string
          name: string
          paid: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          display_order?: number
          id?: string
          name: string
          paid?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          paid?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          base_expense_id: string | null
          category: string
          created_at: string
          current_installment: number | null
          description: string
          display_order: number
          id: string
          paid: boolean
          payment_method: string
          repeat_all_months: boolean
          total_installments: number | null
          type: string
          updated_at: string
          user_id: string
          value: number
          year_month: string
        }
        Insert: {
          base_expense_id?: string | null
          category: string
          created_at?: string
          current_installment?: number | null
          description: string
          display_order?: number
          id?: string
          paid?: boolean
          payment_method: string
          repeat_all_months?: boolean
          total_installments?: number | null
          type: string
          updated_at?: string
          user_id: string
          value: number
          year_month: string
        }
        Update: {
          base_expense_id?: string | null
          category?: string
          created_at?: string
          current_installment?: number | null
          description?: string
          display_order?: number
          id?: string
          paid?: boolean
          payment_method?: string
          repeat_all_months?: boolean
          total_installments?: number | null
          type?: string
          updated_at?: string
          user_id?: string
          value?: number
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_base_expense_id_fkey"
            columns: ["base_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_settings: {
        Row: {
          created_at: string
          expense_categories: string[]
          id: string
          income_tags: string[]
          investment_tags: string[]
          payment_methods: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expense_categories?: string[]
          id?: string
          income_tags?: string[]
          investment_tags?: string[]
          payment_methods?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expense_categories?: string[]
          id?: string
          income_tags?: string[]
          investment_tags?: string[]
          payment_methods?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          base_income_id: string | null
          created_at: string
          date: string
          description: string
          display_order: number
          id: string
          repeat_all_months: boolean
          tag: string
          updated_at: string
          user_id: string
          value: number
          year_month: string
        }
        Insert: {
          base_income_id?: string | null
          created_at?: string
          date: string
          description: string
          display_order?: number
          id?: string
          repeat_all_months?: boolean
          tag: string
          updated_at?: string
          user_id: string
          value: number
          year_month: string
        }
        Update: {
          base_income_id?: string | null
          created_at?: string
          date?: string
          description?: string
          display_order?: number
          id?: string
          repeat_all_months?: boolean
          tag?: string
          updated_at?: string
          user_id?: string
          value?: number
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomes_base_income_id_fkey"
            columns: ["base_income_id"]
            isOneToOne: false
            referencedRelation: "incomes"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          created_at: string
          date: string
          description: string
          display_order: number
          id: string
          tag: string
          updated_at: string
          user_id: string
          value: number
          year_month: string
        }
        Insert: {
          created_at?: string
          date: string
          description: string
          display_order?: number
          id?: string
          tag: string
          updated_at?: string
          user_id: string
          value: number
          year_month: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          display_order?: number
          id?: string
          tag?: string
          updated_at?: string
          user_id?: string
          value?: number
          year_month?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
