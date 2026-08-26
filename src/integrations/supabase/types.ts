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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      discord_tickets: {
        Row: {
          channel_id: string
          created_at: string
          discord_user_id: string
          locale: string
          panel_message_id: string | null
          selected_days: number | null
          selected_plan: string | null
          summary_message_id: string | null
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          discord_user_id: string
          locale?: string
          panel_message_id?: string | null
          selected_days?: number | null
          selected_plan?: string | null
          summary_message_id?: string | null
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          discord_user_id?: string
          locale?: string
          panel_message_id?: string | null
          selected_days?: number | null
          selected_plan?: string | null
          summary_message_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      keyauth_assignments: {
        Row: {
          assigned_at: string
          assigned_by_discord_id: string
          delivered_at: string | null
          id: string
          key_hash: string
          key_last4: string
          purchase_order_id: string
          status: string
        }
        Insert: {
          assigned_at?: string
          assigned_by_discord_id: string
          delivered_at?: string | null
          id?: string
          key_hash: string
          key_last4: string
          purchase_order_id: string
          status?: string
        }
        Update: {
          assigned_at?: string
          assigned_by_discord_id?: string
          delivered_at?: string | null
          id?: string
          key_hash?: string
          key_last4?: string
          purchase_order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyauth_assignments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: true
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      license_audit: {
        Row: {
          action: string
          created_at: string
          id: string
          license_id: string | null
          metadata_minimal: Json
          source: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          license_id?: string | null
          metadata_minimal?: Json
          source: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          license_id?: string | null
          metadata_minimal?: Json
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_audit_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_deliveries: {
        Row: {
          attempts: number
          ciphertext: string | null
          created_at: string
          delivered_at: string | null
          discord_ticket_channel_id: string | null
          id: string
          iv: string | null
          last_error_code: string | null
          license_id: string | null
          purchase_order_id: string
          status: string
        }
        Insert: {
          attempts?: number
          ciphertext?: string | null
          created_at?: string
          delivered_at?: string | null
          discord_ticket_channel_id?: string | null
          id?: string
          iv?: string | null
          last_error_code?: string | null
          license_id?: string | null
          purchase_order_id: string
          status?: string
        }
        Update: {
          attempts?: number
          ciphertext?: string | null
          created_at?: string
          delivered_at?: string | null
          discord_ticket_channel_id?: string | null
          id?: string
          iv?: string | null
          last_error_code?: string | null
          license_id?: string | null
          purchase_order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_deliveries_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_deliveries_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: true
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string
          discord_user_id: string
          expires_at: string
          first_bound_at: string | null
          hwid_hash: string | null
          id: string
          key_hash: string
          key_last4: string
          last_hwid_reset_at: string | null
          last_validated_at: string | null
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discord_user_id: string
          expires_at: string
          first_bound_at?: string | null
          hwid_hash?: string | null
          id?: string
          key_hash: string
          key_last4: string
          last_hwid_reset_at?: string | null
          last_validated_at?: string | null
          plan: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discord_user_id?: string
          expires_at?: string
          first_bound_at?: string | null
          hwid_hash?: string | null
          id?: string
          key_hash?: string
          key_last4?: string
          last_hwid_reset_at?: string | null
          last_validated_at?: string | null
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          last_error_code: string | null
          payload_minimal: Json
          paypal_capture_id: string | null
          paypal_event_id: string
          processed_at: string | null
          processing_started_at: string | null
          purchase_order_id: string | null
          reject_reason: string | null
          rejected_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_type: string
          id?: string
          last_error_code?: string | null
          payload_minimal?: Json
          paypal_capture_id?: string | null
          paypal_event_id: string
          processed_at?: string | null
          processing_started_at?: string | null
          purchase_order_id?: string | null
          reject_reason?: string | null
          rejected_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          last_error_code?: string | null
          payload_minimal?: Json
          paypal_capture_id?: string | null
          paypal_event_id?: string
          processed_at?: string | null
          processing_started_at?: string | null
          purchase_order_id?: string | null
          reject_reason?: string | null
          rejected_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amount_cents: number
          checkout_expires_at: string
          checkout_token_hash: string
          created_at: string
          currency: string
          days: number
          discord_ticket_channel_id: string | null
          discord_user_id: string
          fulfillment_status: string | null
          id: string
          license_id: string | null
          locale: string
          paid_at: string | null
          paypal_capture_id: string | null
          paypal_order_id: string | null
          plan: string
          review_approved_at: string | null
          review_approved_by: string | null
          risk_checked_at: string | null
          risk_reason: string | null
          risk_status: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          checkout_expires_at: string
          checkout_token_hash: string
          created_at?: string
          currency?: string
          days: number
          discord_ticket_channel_id?: string | null
          discord_user_id: string
          fulfillment_status?: string | null
          id?: string
          license_id?: string | null
          locale?: string
          paid_at?: string | null
          paypal_capture_id?: string | null
          paypal_order_id?: string | null
          plan: string
          review_approved_at?: string | null
          review_approved_by?: string | null
          risk_checked_at?: string | null
          risk_reason?: string | null
          risk_status?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          checkout_expires_at?: string
          checkout_token_hash?: string
          created_at?: string
          currency?: string
          days?: number
          discord_ticket_channel_id?: string | null
          discord_user_id?: string
          fulfillment_status?: string | null
          id?: string
          license_id?: string | null
          locale?: string
          paid_at?: string | null
          paypal_capture_id?: string | null
          paypal_order_id?: string | null
          plan?: string
          review_approved_at?: string | null
          review_approved_by?: string | null
          risk_checked_at?: string | null
          risk_reason?: string | null
          risk_status?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          bucket_key: string
          counter: number
          window_start: string
        }
        Insert: {
          bucket_key: string
          counter?: number
          window_start?: string
        }
        Update: {
          bucket_key?: string
          counter?: number
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_order_delivery: {
        Args: { _order_id: string; _staff_id: string }
        Returns: {
          days: number
          discord_user_id: string
          plan: string
          result: string
          ticket_channel_id: string
        }[]
      }
      assign_keyauth_key: {
        Args: {
          _assigned_by: string
          _ciphertext: string
          _iv: string
          _key_hash: string
          _key_last4: string
          _order_id: string
        }
        Returns: {
          assignment_status: string
          result: string
        }[]
      }
      bump_rate_limit: {
        Args: { _key: string; _limit: number; _window_seconds: number }
        Returns: boolean
      }
      finalize_paid_order: {
        Args: {
          _capture_id: string
          _delivery_ciphertext?: string
          _delivery_iv?: string
          _new_key_hash: string
          _new_key_last4: string
          _order_id: string
          _source: string
        }
        Returns: {
          expires_at: string
          is_new_license: boolean
          license_id: string
          result: string
        }[]
      }
      finalize_paid_order_manual: {
        Args: { _capture_id: string; _order_id: string; _source: string }
        Returns: {
          amount_cents: number
          days: number
          discord_user_id: string
          plan: string
          result: string
          ticket_channel_id: string
        }[]
      }
      finalize_paid_order_reviewed: {
        Args: {
          _capture_id: string
          _needs_review: boolean
          _order_id: string
          _risk_reason: string
          _risk_status: string
          _source: string
        }
        Returns: {
          amount_cents: number
          days: number
          discord_user_id: string
          fulfillment_status: string
          plan: string
          result: string
          ticket_channel_id: string
        }[]
      }
      validate_license_hwid: {
        Args: { _hwid_hash: string; _key_hash: string }
        Returns: {
          expires_at: string
          license_id: string
          plan: string
          result: string
        }[]
      }
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
