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
      characters: {
        Row: {
          age: number | null
          appearance_name: string | null
          created_at: string | null
          gender: string | null
          group_name: string | null
          id: string
          image_url: string | null
          name: string
          origin: string | null
          profession: string | null
          relationship: string | null
          sexuality: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          appearance_name?: string | null
          created_at?: string | null
          gender?: string | null
          group_name?: string | null
          id?: string
          image_url?: string | null
          name: string
          origin?: string | null
          profession?: string | null
          relationship?: string | null
          sexuality?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          appearance_name?: string | null
          created_at?: string | null
          gender?: string | null
          group_name?: string | null
          id?: string
          image_url?: string | null
          name?: string
          origin?: string | null
          profession?: string | null
          relationship?: string | null
          sexuality?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          character_avatar: string | null
          character_name: string | null
          content: string
          created_at: string
          id: string
          location: string
          sub_location: string | null
          user_id: string
        }
        Insert: {
          character_avatar?: string | null
          character_name?: string | null
          content: string
          created_at?: string
          id?: string
          location: string
          sub_location?: string | null
          user_id: string
        }
        Update: {
          character_avatar?: string | null
          character_name?: string | null
          content?: string
          created_at?: string
          id?: string
          location?: string
          sub_location?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_workers: {
        Row: {
          created_at: string
          id: string
          location: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      food_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          customer_id: string
          customer_name: string
          id: string
          items: Json
          location: string
          preparation_time: number
          ready_at: string | null
          status: string
          total_price: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_id: string
          customer_name: string
          id?: string
          items?: Json
          location: string
          preparation_time?: number
          ready_at?: string | null
          status?: string
          total_price?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          id?: string
          items?: Json
          location?: string
          preparation_time?: number
          ready_at?: string | null
          status?: string
          total_price?: number
        }
        Relationships: []
      }
      inventory: {
        Row: {
          attributes: Json | null
          category: string | null
          created_at: string | null
          id: string
          item_id: string
          item_image: string | null
          item_name: string
          quantity: number | null
          user_id: string
        }
        Insert: {
          attributes?: Json | null
          category?: string | null
          created_at?: string | null
          id?: string
          item_id: string
          item_image?: string | null
          item_name: string
          quantity?: number | null
          user_id: string
        }
        Update: {
          attributes?: Json | null
          category?: string | null
          created_at?: string | null
          id?: string
          item_id?: string
          item_image?: string | null
          item_name?: string
          quantity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_age: number | null
          applicant_name: string | null
          created_at: string
          experience: string | null
          id: string
          location: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          applicant_age?: number | null
          applicant_name?: string | null
          created_at?: string
          experience?: string | null
          id?: string
          location: string
          role: string
          status?: string
          user_id: string
        }
        Update: {
          applicant_age?: number | null
          applicant_name?: string | null
          created_at?: string
          experience?: string | null
          id?: string
          location?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          title: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          title?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          alcoholism: number
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          current_disease: string | null
          disease_started_at: string | null
          energy: number
          full_name: string
          health: number
          hunger: number
          id: string
          is_leader: boolean | null
          last_spin_at: string | null
          money: number
          race: Database["public"]["Enums"]["character_race"]
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          alcoholism?: number
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          current_disease?: string | null
          disease_started_at?: string | null
          energy?: number
          full_name: string
          health?: number
          hunger?: number
          id?: string
          is_leader?: boolean | null
          last_spin_at?: string | null
          money?: number
          race: Database["public"]["Enums"]["character_race"]
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          alcoholism?: number
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          current_disease?: string | null
          disease_started_at?: string | null
          energy?: number
          full_name?: string
          health?: number
          hunger?: number
          id?: string
          is_leader?: boolean | null
          last_spin_at?: string | null
          money?: number
          race?: Database["public"]["Enums"]["character_race"]
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      room_authorizations: {
        Row: {
          created_at: string
          granted_by: string
          id: string
          location: string
          room_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by: string
          id?: string
          location: string
          room_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          id?: string
          location?: string
          room_name?: string
          user_id?: string
        }
        Relationships: []
      }
      treatment_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          cure_time_minutes: number
          disease_id: string
          disease_name: string
          id: string
          patient_id: string
          status: string
          treatment_cost: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          cure_time_minutes: number
          disease_id: string
          disease_name: string
          id?: string
          patient_id: string
          status?: string
          treatment_cost: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          cure_time_minutes?: number
          disease_id?: string
          disease_name?: string
          id?: string
          patient_id?: string
          status?: string
          treatment_cost?: number
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
      character_race: "draeven" | "sylven" | "lunari"
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
      character_race: ["draeven", "sylven", "lunari"],
    },
  },
} as const
