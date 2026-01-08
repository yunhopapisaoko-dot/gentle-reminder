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
      baby_deliveries: {
        Row: {
          baby_gender: string
          created_at: string
          id: string
          mother_id: string
          mother_name: string
          pregnancy_id: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
        }
        Insert: {
          baby_gender: string
          created_at?: string
          id?: string
          mother_id: string
          mother_name: string
          pregnancy_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
        }
        Update: {
          baby_gender?: string
          created_at?: string
          id?: string
          mother_id?: string
          mother_name?: string
          pregnancy_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "baby_deliveries_pregnancy_id_fkey"
            columns: ["pregnancy_id"]
            isOneToOne: false
            referencedRelation: "pregnancies"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedColumns: ["user_id"]
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
      chat_read_receipts: {
        Row: {
          created_at: string
          last_seen_at: string
          location: string
          sub_location: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_seen_at?: string
          location: string
          sub_location: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_seen_at?: string
          location?: string
          sub_location?: string
          updated_at?: string
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
      contraceptive_effects: {
        Row: {
          expires_at: string
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          expires_at: string
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
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
      fridge_items: {
        Row: {
          added_by: string
          added_by_name: string
          attributes: Json | null
          category: string | null
          created_at: string
          id: string
          item_id: string
          item_image: string | null
          item_name: string
          quantity: number | null
        }
        Insert: {
          added_by: string
          added_by_name: string
          attributes?: Json | null
          category?: string | null
          created_at?: string
          id?: string
          item_id: string
          item_image?: string | null
          item_name: string
          quantity?: number | null
        }
        Update: {
          added_by?: string
          added_by_name?: string
          attributes?: Json | null
          category?: string | null
          created_at?: string
          id?: string
          item_id?: string
          item_image?: string | null
          item_name?: string
          quantity?: number | null
        }
        Relationships: []
      }
      house_invites: {
        Row: {
          created_at: string
          house_id: string
          id: string
          invited_by: string
          invited_user_id: string
        }
        Insert: {
          created_at?: string
          house_id: string
          id?: string
          invited_by: string
          invited_user_id: string
        }
        Update: {
          created_at?: string
          house_id?: string
          id?: string
          invited_by?: string
          invited_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_invites_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "house_invites_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      houses: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          owner_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          owner_name: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          owner_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "houses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
            referencedColumns: ["user_id"]
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
      jyp_appearances: {
        Row: {
          appeared_at: string
          id: string
          location: string
          message: string | null
          stolen_amount: number
          sub_location: string | null
          victim_id: string | null
          victim_name: string | null
        }
        Insert: {
          appeared_at?: string
          id?: string
          location?: string
          message?: string | null
          stolen_amount?: number
          sub_location?: string | null
          victim_id?: string | null
          victim_name?: string | null
        }
        Update: {
          appeared_at?: string
          id?: string
          location?: string
          message?: string | null
          stolen_amount?: number
          sub_location?: string | null
          victim_id?: string | null
          victim_name?: string | null
        }
        Relationships: []
      }
      jyp_state: {
        Row: {
          id: number
          last_robbery_at: string | null
          updated_at: string
        }
        Insert: {
          id: number
          last_robbery_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          last_robbery_at?: string | null
          updated_at?: string
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
      notifications: {
        Row: {
          actor_avatar: string | null
          actor_id: string
          actor_name: string
          comment_id: string | null
          content: string | null
          created_at: string
          id: string
          post_id: string | null
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_avatar?: string | null
          actor_id: string
          actor_name: string
          comment_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_avatar?: string | null
          actor_id?: string
          actor_name?: string
          comment_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          customer_id: string
          customer_name: string
          id: string
          item_name: string
          item_price: number
          item_type: string
          quantity: number
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_id: string
          customer_name: string
          id?: string
          item_name: string
          item_price: number
          item_type: string
          quantity?: number
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          id?: string
          item_name?: string
          item_price?: number
          item_type?: string
          quantity?: number
          status?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string
          created_at: string
          featured_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          title: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string
          featured_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          title?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          featured_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          title?: string | null
          user_id?: string
          video_url?: string | null
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
      pregnancies: {
        Row: {
          announced: boolean
          baby_gender: string
          created_from_test_id: string | null
          delivered: boolean
          ends_at: string
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          announced?: boolean
          baby_gender: string
          created_from_test_id?: string | null
          delivered?: boolean
          ends_at: string
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          announced?: boolean
          baby_gender?: string
          created_from_test_id?: string | null
          delivered?: boolean
          ends_at?: string
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pregnancies_created_from_test_id_fkey"
            columns: ["created_from_test_id"]
            isOneToOne: false
            referencedRelation: "pregnancy_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      pregnancy_tests: {
        Row: {
          announced: boolean
          expires_at: string
          id: string
          result: string
          used_at: string
          user_id: string
        }
        Insert: {
          announced?: boolean
          expires_at?: string
          id?: string
          result: string
          used_at?: string
          user_id: string
        }
        Update: {
          announced?: boolean
          expires_at?: string
          id?: string
          result?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      private_conversations: {
        Row: {
          created_at: string
          id: string
          participant_1: string
          participant_2: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_1: string
          participant_2: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_1?: string
          participant_2?: string
          updated_at?: string
        }
        Relationships: []
      }
      private_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          reply_to_id: string | null
          reply_to_name: string | null
          reply_to_text: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          reply_to_id?: string | null
          reply_to_name?: string | null
          reply_to_text?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          reply_to_id?: string | null
          reply_to_name?: string | null
          reply_to_text?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "private_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "private_messages"
            referencedColumns: ["id"]
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
          current_location: string | null
          current_sub_location: string | null
          disease_started_at: string | null
          energy: number
          full_name: string
          health: number
          hunger: number
          id: string
          is_active_rp: boolean
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
          current_location?: string | null
          current_sub_location?: string | null
          disease_started_at?: string | null
          energy?: number
          full_name: string
          health?: number
          hunger?: number
          id?: string
          is_active_rp?: boolean
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
          current_location?: string | null
          current_sub_location?: string | null
          disease_started_at?: string | null
          energy?: number
          full_name?: string
          health?: number
          hunger?: number
          id?: string
          is_active_rp?: boolean
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          ingredients: Json
          name: string
          preparation_time: number | null
          result_attributes: Json | null
          result_category: string | null
          result_item_id: string
          result_item_image: string | null
          result_item_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          name: string
          preparation_time?: number | null
          result_attributes?: Json | null
          result_category?: string | null
          result_item_id: string
          result_item_image?: string | null
          result_item_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          name?: string
          preparation_time?: number | null
          result_attributes?: Json | null
          result_category?: string | null
          result_item_id?: string
          result_item_image?: string | null
          result_item_name?: string
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
      scratch_cards: {
        Row: {
          id: string
          prize_amount: number | null
          prize_type: string | null
          scratched_at: string
          slots: Json
          user_id: string
          won: boolean
        }
        Insert: {
          id?: string
          prize_amount?: number | null
          prize_type?: string | null
          scratched_at?: string
          slots?: Json
          user_id: string
          won?: boolean
        }
        Update: {
          id?: string
          prize_amount?: number | null
          prize_type?: string | null
          scratched_at?: string
          slots?: Json
          user_id?: string
          won?: boolean
        }
        Relationships: []
      }
      supermarket_items: {
        Row: {
          attributes: Json | null
          category: string
          created_at: string
          id: string
          item_id: string
          item_image: string | null
          item_name: string
          price: number
          stock: number
        }
        Insert: {
          attributes?: Json | null
          category: string
          created_at?: string
          id?: string
          item_id: string
          item_image?: string | null
          item_name: string
          price?: number
          stock?: number
        }
        Update: {
          attributes?: Json | null
          category?: string
          created_at?: string
          id?: string
          item_id?: string
          item_image?: string | null
          item_name?: string
          price?: number
          stock?: number
        }
        Relationships: []
      }
      supermarket_purchases: {
        Row: {
          id: string
          item_id: string
          purchased_at: string
          user_id: string
          week_number: number
          year: number
        }
        Insert: {
          id?: string
          item_id: string
          purchased_at?: string
          user_id: string
          week_number: number
          year: number
        }
        Update: {
          id?: string
          item_id?: string
          purchased_at?: string
          user_id?: string
          week_number?: number
          year?: number
        }
        Relationships: []
      }
      treatment_requests: {
        Row: {
          ai_scene: string | null
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
          ai_scene?: string | null
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
          ai_scene?: string | null
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
      user_ip_logs: {
        Row: {
          id: string
          ip_address: string
          logged_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address: string
          logged_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string
          logged_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_visited_chats: {
        Row: {
          chat_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vip_reservation_guests: {
        Row: {
          created_at: string
          id: string
          reservation_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          reservation_id: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          reservation_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_reservation_guests_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "vip_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_reservations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          location: string
          price: number
          reserver_id: string
          reserver_name: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          location: string
          price: number
          reserver_id: string
          reserver_name: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          location?: string
          price?: number
          reserver_id?: string
          reserver_name?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_jyp_for_test: { Args: never; Returns: undefined }
      try_trigger_jyp_robbery: {
        Args: { min_interval_ms: number }
        Returns: boolean
      }
      user_is_chat_member: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
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
