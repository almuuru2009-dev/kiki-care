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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      children: {
        Row: {
          age: number | null
          avatar_color: string | null
          caregiver_id: string
          created_at: string
          date_of_birth: string | null
          diagnosis: string | null
          gmfcs: number | null
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          avatar_color?: string | null
          caregiver_id: string
          created_at?: string
          date_of_birth?: string | null
          diagnosis?: string | null
          gmfcs?: number | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          avatar_color?: string | null
          caregiver_id?: string
          created_at?: string
          date_of_birth?: string | null
          diagnosis?: string | null
          gmfcs?: number | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration: number | null
          id: string
          is_community: boolean | null
          name: string
          reps: string | null
          sets: number | null
          target_area: string | null
          thumbnail_color: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration?: number | null
          id?: string
          is_community?: boolean | null
          name: string
          reps?: string | null
          sets?: number | null
          target_area?: string | null
          thumbnail_color?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_community?: boolean | null
          name?: string
          reps?: string | null
          sets?: number | null
          target_area?: string | null
          thumbnail_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          text: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          text: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          text?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          link_id: string | null
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          link_id?: string | null
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          link_id?: string | null
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "therapist_caregiver_links"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          institution: string | null
          matricula: string | null
          name: string
          phone: string | null
          role: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          institution?: string | null
          matricula?: string | null
          name?: string
          phone?: string | null
          role: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          institution?: string | null
          matricula?: string | null
          name?: string
          phone?: string | null
          role?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          caregiver_id: string
          child_id: string
          child_mood: number | null
          completed_at: string
          created_at: string
          difficulty: number | null
          id: string
          note: string | null
          pain_reported: boolean | null
        }
        Insert: {
          caregiver_id: string
          child_id: string
          child_mood?: number | null
          completed_at?: string
          created_at?: string
          difficulty?: number | null
          id?: string
          note?: string | null
          pain_reported?: boolean | null
        }
        Update: {
          caregiver_id?: string
          child_id?: string
          child_mood?: number | null
          completed_at?: string
          created_at?: string
          difficulty?: number | null
          id?: string
          note?: string | null
          pain_reported?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_caregiver_links: {
        Row: {
          caregiver_email: string
          caregiver_id: string | null
          child_id: string | null
          created_at: string
          id: string
          invited_at: string
          responded_at: string | null
          status: string
          therapist_id: string
        }
        Insert: {
          caregiver_email: string
          caregiver_id?: string | null
          child_id?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          responded_at?: string | null
          status?: string
          therapist_id: string
        }
        Update: {
          caregiver_email?: string
          caregiver_id?: string | null
          child_id?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          responded_at?: string | null
          status?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_caregiver_links_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          active: boolean | null
          child_id: string
          created_at: string
          day_of_week: number[] | null
          exercise_id: string
          id: string
          therapist_id: string
        }
        Insert: {
          active?: boolean | null
          child_id: string
          created_at?: string
          day_of_week?: number[] | null
          exercise_id: string
          id?: string
          therapist_id: string
        }
        Update: {
          active?: boolean | null
          child_id?: string
          created_at?: string
          day_of_week?: number[] | null
          exercise_id?: string
          id?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
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
