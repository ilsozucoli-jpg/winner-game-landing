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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      game_parameters: {
        Row: {
          created_at: string | null
          id: string
          max_score: number
          max_time_seconds: number
          stage_number: number
          stage_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_score: number
          max_time_seconds: number
          stage_number: number
          stage_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_score?: number
          max_time_seconds?: number
          stage_number?: number
          stage_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      game_play: {
        Row: {
          abandon_reason: string | null
          completed_at: string | null
          created_at: string
          current_stage: number
          game_token: string
          id: string
          sponsor_id: string | null
          stage_points: number[]
          stage_tokens: string[]
          started_at: string
          status: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          abandon_reason?: string | null
          completed_at?: string | null
          created_at?: string
          current_stage?: number
          game_token: string
          id?: string
          sponsor_id?: string | null
          stage_points?: number[]
          stage_tokens?: string[]
          started_at?: string
          status?: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          abandon_reason?: string | null
          completed_at?: string | null
          created_at?: string
          current_stage?: number
          game_token?: string
          id?: string
          sponsor_id?: string | null
          stage_points?: number[]
          stage_tokens?: string[]
          started_at?: string
          status?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_play_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      game_results: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          is_winner: boolean | null
          player_email: string
          player_name: string
          player_phone: string
          points: number
          prize_claimed_at: string | null
          sponsor_id: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          is_winner?: boolean | null
          player_email: string
          player_name: string
          player_phone: string
          points?: number
          prize_claimed_at?: string | null
          sponsor_id: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          is_winner?: boolean | null
          player_email?: string
          player_name?: string
          player_phone?: string
          points?: number
          prize_claimed_at?: string | null
          sponsor_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_results_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_promotions: {
        Row: {
          ai_validation_notes: string | null
          city: string | null
          created_at: string
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string | null
          phone: string
          prize_count: number
          prize_description: string
          promotion_end_date: string | null
          sponsor_registration_id: string | null
          state: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_validation_notes?: string | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          phone: string
          prize_count?: number
          prize_description: string
          promotion_end_date?: string | null
          sponsor_registration_id?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_validation_notes?: string | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          phone?: string
          prize_count?: number
          prize_description?: string
          promotion_end_date?: string | null
          sponsor_registration_id?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_promotions_sponsor_registration_id_fkey"
            columns: ["sponsor_registration_id"]
            isOneToOne: false
            referencedRelation: "sponsor_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          terms_accepted_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      registered_cities: {
        Row: {
          city: string
          created_at: string
          id: string
          state: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          state: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          state?: string
        }
        Relationships: []
      }
      sponsor_registrations: {
        Row: {
          address: string
          city: string
          company: string
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          payment_proof_url: string | null
          phone: string | null
          plan: string
          plan_value: number
          state: string
          status: string
          updated_at: string
          user_id: string | null
          validity_date: string | null
        }
        Insert: {
          address: string
          city: string
          company: string
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          payment_proof_url?: string | null
          phone?: string | null
          plan: string
          plan_value: number
          state: string
          status?: string
          updated_at?: string
          user_id?: string | null
          validity_date?: string | null
        }
        Update: {
          address?: string
          city?: string
          company?: string
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          payment_proof_url?: string | null
          phone?: string | null
          plan?: string
          plan_value?: number
          state?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          validity_date?: string | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string | null
          phone: string
          prize_count: number
          prize_description: string
          promotion_end_date: string | null
          sponsor_registration_id: string | null
          state: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          phone: string
          prize_count?: number
          prize_description: string
          promotion_end_date?: string | null
          sponsor_registration_id?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          phone?: string
          prize_count?: number
          prize_description?: string
          promotion_end_date?: string | null
          sponsor_registration_id?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_sponsor_registration_id_fkey"
            columns: ["sponsor_registration_id"]
            isOneToOne: false
            referencedRelation: "sponsor_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          admin_replied_at: string | null
          admin_reply: string | null
          attachment_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          promotion_id: string
          promotion_name: string
          sponsor_registration_id: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_replied_at?: string | null
          admin_reply?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          promotion_id: string
          promotion_name: string
          sponsor_registration_id: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_replied_at?: string | null
          admin_reply?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          promotion_id?: string
          promotion_name?: string
          sponsor_registration_id?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sponsor_registration_id_fkey"
            columns: ["sponsor_registration_id"]
            isOneToOne: false
            referencedRelation: "sponsor_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_sponsor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
