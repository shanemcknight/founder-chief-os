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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_type: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      beta_waitlist: {
        Row: {
          business_type: string
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          business_type: string
          created_at?: string
          email: string
          full_name: string
          id?: string
        }
        Update: {
          business_type?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      email_drafts: {
        Row: {
          created_at: string
          draft_body: string | null
          email_id: string | null
          id: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          draft_body?: string | null
          email_id?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          draft_body?: string | null
          email_id?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_drafts_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          archived: boolean
          body_full: string | null
          body_preview: string | null
          category: string
          chief_summary: string | null
          created_at: string
          external_id: string | null
          from_email: string | null
          from_name: string | null
          id: string
          provider: string | null
          read: boolean
          received_at: string | null
          starred: boolean
          subject: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          body_full?: string | null
          body_preview?: string | null
          category?: string
          chief_summary?: string | null
          created_at?: string
          external_id?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          provider?: string | null
          read?: boolean
          received_at?: string | null
          starred?: boolean
          subject?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean
          body_full?: string | null
          body_preview?: string | null
          category?: string
          chief_summary?: string | null
          created_at?: string
          external_id?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          provider?: string | null
          read?: boolean
          received_at?: string | null
          starred?: boolean
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string | null
          read: boolean
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anthropic_api_key: string | null
          approved: boolean
          business_name: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anthropic_api_key?: string | null
          approved?: boolean
          business_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anthropic_api_key?: string | null
          approved?: boolean
          business_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_brand_voice_rules: {
        Row: {
          created_at: string
          example: string
          id: string
          rule: string
          sort_order: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          example?: string
          id?: string
          rule: string
          sort_order?: number
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          example?: string
          id?: string
          rule?: string
          sort_order?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          access_token_encrypted: string
          created_at: string
          id: string
          platform: string
          platform_user_id: string
          platform_username: string
          refresh_token_encrypted: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string
          created_at?: string
          id?: string
          platform: string
          platform_user_id?: string
          platform_username?: string
          refresh_token_encrypted?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          id?: string
          platform?: string
          platform_user_id?: string
          platform_username?: string
          refresh_token_encrypted?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_content_pillars: {
        Row: {
          best_platforms: string[]
          color: string
          created_at: string
          description: string
          emoji: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_platforms?: string[]
          color?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_platforms?: string[]
          color?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_platform_guides: {
        Row: {
          audience: string
          cadence: string
          caption_formula: string
          color_hex: string
          created_at: string
          example_post: string
          icon: string
          id: string
          platform: string
          role: string
          tone_guide: string
          updated_at: string
          user_id: string
          voice_keywords: string[]
          what_not_to_post: string[]
          what_to_post: string[]
        }
        Insert: {
          audience?: string
          cadence?: string
          caption_formula?: string
          color_hex?: string
          created_at?: string
          example_post?: string
          icon?: string
          id?: string
          platform: string
          role?: string
          tone_guide?: string
          updated_at?: string
          user_id: string
          voice_keywords?: string[]
          what_not_to_post?: string[]
          what_to_post?: string[]
        }
        Update: {
          audience?: string
          cadence?: string
          caption_formula?: string
          color_hex?: string
          created_at?: string
          example_post?: string
          icon?: string
          id?: string
          platform?: string
          role?: string
          tone_guide?: string
          updated_at?: string
          user_id?: string
          voice_keywords?: string[]
          what_not_to_post?: string[]
          what_to_post?: string[]
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          alt_text: string
          boost_budget: number
          boost_enabled: boolean
          caption: string
          content_pillar: string | null
          created_at: string
          first_comment: string
          hashtags: string
          id: string
          media_url: string
          platforms: string[]
          post_notes: string
          post_type: string
          post_types: Json
          scheduled_date: string | null
          scheduled_time: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alt_text?: string
          boost_budget?: number
          boost_enabled?: boolean
          caption?: string
          content_pillar?: string | null
          created_at?: string
          first_comment?: string
          hashtags?: string
          id?: string
          media_url?: string
          platforms?: string[]
          post_notes?: string
          post_type?: string
          post_types?: Json
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alt_text?: string
          boost_budget?: number
          boost_enabled?: boolean
          caption?: string
          content_pillar?: string | null
          created_at?: string
          first_comment?: string
          hashtags?: string
          id?: string
          media_url?: string
          platforms?: string[]
          post_notes?: string
          post_type?: string
          post_types?: Json
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_social_posts_pillar"
            columns: ["content_pillar"]
            isOneToOne: false
            referencedRelation: "social_content_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      social_shot_lists: {
        Row: {
          category: string
          created_at: string
          description: string
          duration: string
          id: string
          platform: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          duration?: string
          id?: string
          platform?: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          duration?: string
          id?: string
          platform?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          token_budget: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          token_budget?: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          token_budget?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          connected_at: string
          created_at: string
          id: string
          last_synced_at: string | null
          nango_connection_id: string
          provider: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          nango_connection_id: string
          provider: string
          user_id: string
        }
        Update: {
          connected_at?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          nango_connection_id?: string
          provider?: string
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
