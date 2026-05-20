export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_content: {
        Row: {
          ai_model: string
          call_to_action: string | null
          confidence_score: number | null
          created_at: string | null
          email_body: string | null
          email_subject: string | null
          id: string
          lead_id: string
          linkedin_message: string | null
          processing_time_ms: number | null
          prompt_hash: string | null
          tokens_used: number | null
          tone: string | null
          twitter_message: string | null
        }
        Insert: {
          ai_model: string
          call_to_action?: string | null
          confidence_score?: number | null
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          lead_id: string
          linkedin_message?: string | null
          processing_time_ms?: number | null
          prompt_hash?: string | null
          tokens_used?: number | null
          tone?: string | null
          twitter_message?: string | null
        }
        Update: {
          ai_model?: string
          call_to_action?: string | null
          confidence_score?: number | null
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          lead_id?: string
          linkedin_message?: string | null
          processing_time_ms?: number | null
          prompt_hash?: string | null
          tokens_used?: number | null
          tone?: string | null
          twitter_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ai_model: string | null
          created_at: string | null
          description: string | null
          email_tone: string | null
          emails_clicked: number | null
          emails_delivered: number | null
          emails_failed: number | null
          emails_opened: number | null
          emails_sent: number | null
          from_email: string | null
          from_name: string | null
          id: string
          last_sent_at: string | null
          name: string
          reply_to_email: string | null
          status: string | null
          total_leads: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string | null
          description?: string | null
          email_tone?: string | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_failed?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          last_sent_at?: string | null
          name: string
          reply_to_email?: string | null
          status?: string | null
          total_leads?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string | null
          description?: string | null
          email_tone?: string | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_failed?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          last_sent_at?: string | null
          name?: string
          reply_to_email?: string | null
          status?: string | null
          total_leads?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          body_html: string | null
          body_text: string | null
          campaign_id: string
          clicked_at: string | null
          delivered_at: string | null
          error_message: string | null
          from_email: string
          id: string
          lead_id: string
          message_id: string | null
          opened_at: string | null
          provider: string | null
          provider_response: Json | null
          reply_to_email: string | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          campaign_id: string
          clicked_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          from_email: string
          id?: string
          lead_id: string
          message_id?: string | null
          opened_at?: string | null
          provider?: string | null
          provider_response?: Json | null
          reply_to_email?: string | null
          sent_at?: string | null
          status: string
          subject: string
          to_email: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          campaign_id?: string
          clicked_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          from_email?: string
          id?: string
          lead_id?: string
          message_id?: string | null
          opened_at?: string | null
          provider?: string | null
          provider_response?: Json | null
          reply_to_email?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          additional_data: Json | null
          ai_confidence: number | null
          campaign_id: string
          company: string | null
          created_at: string | null
          email: string
          id: string
          industry: string | null
          last_contacted_at: string | null
          name: string | null
          processed_at: string | null
          status: string | null
        }
        Insert: {
          additional_data?: Json | null
          ai_confidence?: number | null
          campaign_id: string
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          industry?: string | null
          last_contacted_at?: string | null
          name?: string | null
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          additional_data?: Json | null
          ai_confidence?: number | null
          campaign_id?: string
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          industry?: string | null
          last_contacted_at?: string | null
          name?: string | null
          processed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean | null
          ai_requests_per_month: number | null
          campaigns_limit: number | null
          created_at: string | null
          description: string | null
          emails_per_month: number | null
          features: Json | null
          id: string
          leads_per_upload: number | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
        }
        Insert: {
          active?: boolean | null
          ai_requests_per_month?: number | null
          campaigns_limit?: number | null
          created_at?: string | null
          description?: string | null
          emails_per_month?: number | null
          features?: Json | null
          id: string
          leads_per_upload?: number | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
        }
        Update: {
          active?: boolean | null
          ai_requests_per_month?: number | null
          campaigns_limit?: number | null
          created_at?: string | null
          description?: string | null
          emails_per_month?: number | null
          features?: Json | null
          id?: string
          leads_per_upload?: number | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          action: string
          campaign_id: string | null
          count: number | null
          created_at: string | null
          date: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          campaign_id?: string | null
          count?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          campaign_id?: string | null
          count?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_domains: {
        Row: {
          created_at: string | null
          dns_records: Json | null
          domain_name: string
          id: string
          is_default: boolean | null
          last_verified_at: string | null
          resend_domain_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          verification_error: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          dns_records?: Json | null
          domain_name: string
          id?: string
          is_default?: boolean | null
          last_verified_at?: string | null
          resend_domain_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_error?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          dns_records?: Json | null
          domain_name?: string
          id?: string
          is_default?: boolean | null
          last_verified_at?: string | null
          resend_domain_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_error?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_domains_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "user_domains_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_domains_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          campaigns_limit: number | null
          company_name: string | null
          created_at: string | null
          default_from_email: string | null
          default_from_name: string | null
          dodo_customer_id: string | null
          dodo_subscription_id: string | null
          email: string
          email_signature: string | null
          emails_per_month: number | null
          full_name: string | null
          id: string
          last_login_at: string | null
          leads_per_upload: number | null
          subscription_status: string | null
          subscription_tier: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          campaigns_limit?: number | null
          company_name?: string | null
          created_at?: string | null
          default_from_email?: string | null
          default_from_name?: string | null
          dodo_customer_id?: string | null
          dodo_subscription_id?: string | null
          email: string
          email_signature?: string | null
          emails_per_month?: number | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          leads_per_upload?: number | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          campaigns_limit?: number | null
          company_name?: string | null
          created_at?: string | null
          default_from_email?: string | null
          default_from_name?: string | null
          dodo_customer_id?: string | null
          dodo_subscription_id?: string | null
          email?: string
          email_signature?: string | null
          emails_per_month?: number | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          leads_per_upload?: number | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      campaign_performance: {
        Row: {
          ai_model: string | null
          clicked_count: number | null
          created_at: string | null
          delivered_count: number | null
          description: string | null
          email_tone: string | null
          emails_clicked: number | null
          emails_delivered: number | null
          emails_failed: number | null
          emails_opened: number | null
          emails_sent: number | null
          emails_sent_count: number | null
          failed_count: number | null
          from_email: string | null
          from_name: string | null
          id: string | null
          last_sent_at: string | null
          lead_count: number | null
          name: string | null
          opened_count: number | null
          owner_id: string | null
          processed_count: number | null
          reply_to_email: string | null
          status: string | null
          total_leads: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dashboard_stats: {
        Row: {
          active_campaigns: number | null
          campaign_limit: number | null
          completed_campaigns: number | null
          email: string | null
          email_limit: number | null
          emails_this_month: number | null
          full_name: string | null
          last_campaign_activity: string | null
          leads_contacted: number | null
          subscription_tier: string | null
          total_campaigns: number | null
          total_leads: number | null
          upload_limit: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_domain_limit: { Args: { p_user_id: string }; Returns: boolean }
      check_user_limit: {
        Args: { p_action: string; p_period?: string; p_user_id: string }
        Returns: boolean
      }
      get_user_default_domain: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string | null
          dns_records: Json | null
          domain_name: string
          id: string
          is_default: boolean | null
          last_verified_at: string | null
          resend_domain_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          verification_error: string | null
          verified_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "user_domains"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_usage: {
        Args: {
          p_action: string
          p_campaign_id?: string
          p_count?: number
          p_user_id: string
        }
        Returns: undefined
      }
      requesting_user_id: { Args: never; Returns: string }
      update_campaign_stats: {
        Args: { p_campaign_id: string }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

