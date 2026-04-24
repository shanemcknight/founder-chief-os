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
      activities: {
        Row: {
          contact_id: string | null
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
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
      agent_context: {
        Row: {
          agent_id: string
          content: Json
          context_type: string
          id: string
          last_updated: string
          user_id: string
        }
        Insert: {
          agent_id: string
          content: Json
          context_type: string
          id?: string
          last_updated?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          content?: Json
          context_type?: string
          id?: string
          last_updated?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          service: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          service: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          service?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      approvals_log: {
        Row: {
          action_id: string
          decision: string
          edited_content: Json | null
          id: string
          notes: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          action_id: string
          decision: string
          edited_content?: Json | null
          id?: string
          notes?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          action_id?: string
          decision?: string
          edited_content?: Json | null
          id?: string
          notes?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_log_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "proposed_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          id: string
          max_uses: number
          status: string
          used_at: string | null
          used_by: string | null
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string
          id?: string
          max_uses?: number
          status?: string
          used_at?: string | null
          used_by?: string | null
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          max_uses?: number
          status?: string
          used_at?: string | null
          used_by?: string | null
          uses?: number
        }
        Relationships: []
      }
      beta_testers: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_at: string
          invited_by: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_at?: string
          invited_by?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_at?: string
          invited_by?: string
          status?: string
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
      companies: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          location: string | null
          name: string
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          name: string
          user_id: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          name?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          last_contacted_at: string | null
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          pipeline_id: string | null
          stage: string
          tags: string[]
          title: string | null
          user_id: string
          value: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          pipeline_id?: string | null
          stage?: string
          tags?: string[]
          title?: string | null
          user_id: string
          value?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          pipeline_id?: string | null
          stage?: string
          tags?: string[]
          title?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          completed: boolean
          contact_id: string | null
          created_at: string
          due_date: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          created_at: string | null
          display_name: string | null
          email_address: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          nango_connection_id: string
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email_address: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          nango_connection_id: string
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email_address?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          nango_connection_id?: string
          provider?: string
          user_id?: string
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
          account_email: string | null
          archived: boolean
          body_full: string | null
          body_preview: string | null
          category: string
          chief_summary: string | null
          created_at: string
          email_account_id: string | null
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
          account_email?: string | null
          archived?: boolean
          body_full?: string | null
          body_preview?: string | null
          category?: string
          chief_summary?: string | null
          created_at?: string
          email_account_id?: string | null
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
          account_email?: string | null
          archived?: boolean
          body_full?: string | null
          body_preview?: string | null
          category?: string
          chief_summary?: string | null
          created_at?: string
          email_account_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "emails_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          sender: string
          type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender: string
          type?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
      pipelines: {
        Row: {
          color: string
          created_at: string
          description: string
          id: string
          name: string
          sort_order: number
          stages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          sort_order?: number
          stages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          sort_order?: number
          stages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agent_name: string
          anthropic_api_key: string | null
          api_keys_connected: boolean
          approved: boolean
          business_name: string | null
          created_at: string
          environment: string
          full_name: string | null
          gemini_api_key: string | null
          id: string
          is_admin: boolean
          onboarding_complete: boolean
          openai_api_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_name?: string
          anthropic_api_key?: string | null
          api_keys_connected?: boolean
          approved?: boolean
          business_name?: string | null
          created_at?: string
          environment?: string
          full_name?: string | null
          gemini_api_key?: string | null
          id?: string
          is_admin?: boolean
          onboarding_complete?: boolean
          openai_api_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_name?: string
          anthropic_api_key?: string | null
          api_keys_connected?: boolean
          approved?: boolean
          business_name?: string | null
          created_at?: string
          environment?: string
          full_name?: string | null
          gemini_api_key?: string | null
          id?: string
          is_admin?: boolean
          onboarding_complete?: boolean
          openai_api_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposed_actions: {
        Row: {
          action_type: string
          approval_timestamp: string | null
          created_at: string
          draft_content: Json
          executed_at: string | null
          id: string
          message_id: string
          status: string
        }
        Insert: {
          action_type: string
          approval_timestamp?: string | null
          created_at?: string
          draft_content: Json
          executed_at?: string | null
          id?: string
          message_id: string
          status?: string
        }
        Update: {
          action_type?: string
          approval_timestamp?: string | null
          created_at?: string
          draft_content?: Json
          executed_at?: string | null
          id?: string
          message_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposed_actions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      report_formulas: {
        Row: {
          category: string | null
          created_at: string
          formula: string
          id: string
          plain_english: string | null
          starred: boolean
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          formula: string
          id?: string
          plain_english?: string | null
          starred?: boolean
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          formula?: string
          id?: string
          plain_english?: string | null
          starred?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          category: string
          content: string | null
          created_at: string
          description: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          last_used_at: string | null
          starred: boolean
          title: string
          user_id: string
          version_label: string | null
          version_of: string | null
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          last_used_at?: string | null
          starred?: boolean
          title: string
          user_id: string
          version_label?: string | null
          version_of?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          last_used_at?: string | null
          starred?: boolean
          title?: string
          user_id?: string
          version_label?: string | null
          version_of?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_version_of_fkey"
            columns: ["version_of"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
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
      support_knowledge: {
        Row: {
          active: boolean
          category: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
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
      user_oauth_tokens: {
        Row: {
          access_token_encrypted: string
          created_at: string
          expires_at: string | null
          id: string
          platform: string
          platform_metadata: Json | null
          refresh_token_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          platform: string
          platform_metadata?: Json | null
          refresh_token_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          platform?: string
          platform_metadata?: Json | null
          refresh_token_encrypted?: string | null
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
      is_admin: { Args: never; Returns: boolean }
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
