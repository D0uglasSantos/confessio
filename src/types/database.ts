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
      church_admins: {
        Row: {
          church_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          church_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          church_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_admins_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      churches: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      global_admins: {
        Row: {
          created_at: string
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      paper_print_batch_tickets: {
        Row: {
          batch_id: string
          ticket_id: string
        }
        Insert: {
          batch_id: string
          ticket_id: string
        }
        Update: {
          batch_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_print_batch_tickets_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "paper_print_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_print_batch_tickets_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_print_batches: {
        Row: {
          church_id: string
          created_at: string
          created_by: string
          first_public_number: number
          id: string
          last_public_number: number
          session_id: string
          ticket_count: number
        }
        Insert: {
          church_id: string
          created_at?: string
          created_by: string
          first_public_number: number
          id?: string
          last_public_number: number
          session_id: string
          ticket_count: number
        }
        Update: {
          church_id?: string
          created_at?: string
          created_by?: string
          first_public_number?: number
          id?: string
          last_public_number?: number
          session_id?: string
          ticket_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "paper_print_batches_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_print_batches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      session_counters: {
        Row: {
          last_public_number: number
          session_id: string
        }
        Insert: {
          last_public_number?: number
          session_id: string
        }
        Update: {
          last_public_number?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_counters_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          church_id: string
          created_at: string
          ends_at: string | null
          entry_closed_at: string | null
          entry_opened_at: string | null
          finished_at: string | null
          id: string
          name: string
          show_waiting_queue_on_tv: boolean
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["session_status"]
          ticket_prefix: string
          updated_at: string
        }
        Insert: {
          church_id: string
          created_at?: string
          ends_at?: string | null
          entry_closed_at?: string | null
          entry_opened_at?: string | null
          finished_at?: string | null
          id?: string
          name: string
          show_waiting_queue_on_tv?: boolean
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          ticket_prefix?: string
          updated_at?: string
        }
        Update: {
          church_id?: string
          created_at?: string
          ends_at?: string | null
          entry_closed_at?: string | null
          entry_opened_at?: string | null
          finished_at?: string | null
          id?: string
          name?: string
          show_waiting_queue_on_tv?: boolean
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          ticket_prefix?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      station_access: {
        Row: {
          access_token: string
          created_at: string
          station_id: string
        }
        Insert: {
          access_token?: string
          created_at?: string
          station_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          station_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "station_access_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: true
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          created_at: string
          id: string
          name: string
          priest_name: string | null
          session_id: string
          status: Database["public"]["Enums"]["station_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          priest_name?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["station_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          priest_name?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["station_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_contacts: {
        Row: {
          created_at: string
          phone_e164: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          phone_e164: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          phone_e164?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_contacts_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tokens: {
        Row: {
          anonymous_token: string
          created_at: string
          ticket_id: string
        }
        Insert: {
          anonymous_token?: string
          created_at?: string
          ticket_id: string
        }
        Update: {
          anonymous_token?: string
          created_at?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tokens_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          called_at: string | null
          cancelled_at: string | null
          created_at: string
          finished_at: string | null
          id: string
          last_recalled_at: string | null
          no_show_at: string | null
          public_code: string
          public_number: number
          recall_count: number
          session_id: string
          started_at: string | null
          station_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
        }
        Insert: {
          called_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          last_recalled_at?: string | null
          no_show_at?: string | null
          public_code: string
          public_number: number
          recall_count?: number
          session_id: string
          started_at?: string | null
          station_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
        }
        Update: {
          called_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          last_recalled_at?: string | null
          no_show_at?: string | null
          public_code?: string
          public_number?: number
          recall_count?: number
          session_id?: string
          started_at?: string | null
          station_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tickets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_print_batch: { Args: { p_batch_id: string }; Returns: Json }
      admin_get_session_state: { Args: { p_session_id: string }; Returns: Json }
      admin_issue_paper_tickets: {
        Args: { p_count: number; p_session_id: string }
        Returns: string
      }
      call_next_ticket: {
        Args: { p_access_token: string; p_station_id: string }
        Returns: {
          called_at: string | null
          cancelled_at: string | null
          created_at: string
          finished_at: string | null
          id: string
          last_recalled_at: string | null
          no_show_at: string | null
          public_code: string
          public_number: number
          recall_count: number
          session_id: string
          started_at: string | null
          station_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_ticket: {
        Args: { p_token: string }
        Returns: Database["public"]["CompositeTypes"]["fiel_ticket"]
        SetofOptions: {
          from: "*"
          to: "fiel_ticket"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_ticket: {
        Args: {
          p_existing_token?: string
          p_phone_e164?: string
          p_session_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["fiel_ticket"]
        SetofOptions: {
          from: "*"
          to: "fiel_ticket"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      finish_service: {
        Args: {
          p_access_token: string
          p_station_id: string
          p_ticket_id: string
        }
        Returns: {
          called_at: string | null
          cancelled_at: string | null
          created_at: string
          finished_at: string | null
          id: string
          last_recalled_at: string | null
          no_show_at: string | null
          public_code: string
          public_number: number
          recall_count: number
          session_id: string
          started_at: string | null
          station_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_public_session_state: { Args: { p_slug: string }; Returns: Json }
      get_station_state: {
        Args: { p_access_token: string; p_station_id: string }
        Returns: Json
      }
      get_ticket_by_token: {
        Args: { p_token: string }
        Returns: Database["public"]["CompositeTypes"]["fiel_ticket"]
        SetofOptions: {
          from: "*"
          to: "fiel_ticket"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      global_assign_church_admin: {
        Args: { p_church_id: string; p_user_id: string }
        Returns: boolean
      }
      global_create_church: {
        Args: { p_logo_url?: string; p_name: string; p_slug: string }
        Returns: string
      }
      global_get_dashboard_metrics: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      global_list_audit_log: { Args: { p_limit?: number }; Returns: Json }
      global_list_church_admins: {
        Args: { p_church_id: string }
        Returns: Json
      }
      global_list_church_sessions: {
        Args: { p_church_id: string }
        Returns: Json
      }
      global_list_churches: { Args: never; Returns: Json }
      global_set_church_active: {
        Args: { p_church_id: string; p_is_active: boolean }
        Returns: boolean
      }
      global_update_church: {
        Args: {
          p_church_id: string
          p_logo_url?: string
          p_name: string
          p_slug: string
        }
        Returns: boolean
      }
      is_church_admin: { Args: { p_church_id: string }; Returns: boolean }
      is_global_admin: { Args: { p_required_role?: string }; Returns: boolean }
      is_visible_session_status: {
        Args: { p_status: Database["public"]["Enums"]["session_status"] }
        Returns: boolean
      }
      mark_no_show: {
        Args: {
          p_access_token: string
          p_station_id: string
          p_ticket_id: string
        }
        Returns: {
          called_at: string | null
          cancelled_at: string | null
          created_at: string
          finished_at: string | null
          id: string
          last_recalled_at: string | null
          no_show_at: string | null
          public_code: string
          public_number: number
          recall_count: number
          session_id: string
          started_at: string | null
          station_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pause_station: {
        Args: { p_access_token: string; p_station_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          priest_name: string | null
          session_id: string
          status: Database["public"]["Enums"]["station_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "stations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      recall_ticket: {
        Args: {
          p_access_token: string
          p_station_id: string
          p_ticket_id: string
        }
        Returns: {
          called_at: string | null
          cancelled_at: string | null
          created_at: string
          finished_at: string | null
          id: string
          last_recalled_at: string | null
          no_show_at: string | null
          public_code: string
          public_number: number
          recall_count: number
          session_id: string
          started_at: string | null
          station_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resume_station: {
        Args: { p_access_token: string; p_station_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          priest_name: string | null
          session_id: string
          status: Database["public"]["Enums"]["station_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "stations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_service: {
        Args: {
          p_access_token: string
          p_station_id: string
          p_ticket_id: string
        }
        Returns: {
          called_at: string | null
          cancelled_at: string | null
          created_at: string
          finished_at: string | null
          id: string
          last_recalled_at: string | null
          no_show_at: string | null
          public_code: string
          public_number: number
          recall_count: number
          session_id: string
          started_at: string | null
          station_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      session_status:
        | "DRAFT"
        | "OPEN"
        | "ENTRY_CLOSED"
        | "FINISHED"
        | "CANCELLED"
      station_status: "OFFLINE" | "AVAILABLE" | "CALLING" | "BUSY" | "PAUSED"
      ticket_status:
        | "WAITING"
        | "CALLED"
        | "IN_SERVICE"
        | "COMPLETED"
        | "NO_SHOW"
        | "CANCELLED"
    }
    CompositeTypes: {
      fiel_ticket: {
        id: string | null
        session_id: string | null
        public_number: number | null
        public_code: string | null
        status: Database["public"]["Enums"]["ticket_status"] | null
        anonymous_token: string | null
        station_id: string | null
        station_name: string | null
        created_at: string | null
        called_at: string | null
        started_at: string | null
        finished_at: string | null
        cancelled_at: string | null
        no_show_at: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {
      session_status: [
        "DRAFT",
        "OPEN",
        "ENTRY_CLOSED",
        "FINISHED",
        "CANCELLED",
      ],
      station_status: ["OFFLINE", "AVAILABLE", "CALLING", "BUSY", "PAUSED"],
      ticket_status: [
        "WAITING",
        "CALLED",
        "IN_SERVICE",
        "COMPLETED",
        "NO_SHOW",
        "CANCELLED",
      ],
    },
  },
} as const

