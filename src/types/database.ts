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
      ai_conversations: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          model: string | null
          role: string
          tokens_input: number | null
          tokens_output: number | null
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          tokens_input?: number | null
          tokens_output?: number | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          tokens_input?: number | null
          tokens_output?: number | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          hotel_id: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          hotel_id?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          hotel_id?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          check_in_date: string
          check_out_date: string
          confirmation_number: string
          created_at: string
          guest_count: number
          hotel_id: string
          id: string
          notes: string | null
          room_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_date: string
          check_out_date: string
          confirmation_number: string
          created_at?: string
          guest_count?: number
          hotel_id: string
          id?: string
          notes?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_date?: string
          check_out_date?: string
          confirmation_number?: string
          created_at?: string
          guest_count?: number
          hotel_id?: string
          id?: string
          notes?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_branding: {
        Row: {
          accent_color: string | null
          background_color: string | null
          created_at: string
          custom_css: string | null
          favicon_url: string | null
          font_body: string | null
          font_heading: string | null
          hotel_id: string
          id: string
          logo_light_url: string | null
          logo_url: string | null
          primary_color: string | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          hotel_id: string
          id?: string
          logo_light_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          hotel_id?: string
          id?: string
          logo_light_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_branding_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: true
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_faqs: {
        Row: {
          answer: string
          created_at: string
          hotel_id: string
          id: string
          is_active: boolean
          keywords: string[] | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          hotel_id: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          hotel_id?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_faqs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string | null
          amenities: string[] | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          location: string
          logo_url: string | null
          name: string
          price_per_night: number
          rating: number | null
          settings: Json | null
          slug: string
          theme_accent_color: string | null
          theme_primary_color: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location: string
          logo_url?: string | null
          name: string
          price_per_night?: number
          rating?: number | null
          settings?: Json | null
          slug: string
          theme_accent_color?: string | null
          theme_primary_color?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string
          logo_url?: string | null
          name?: string
          price_per_night?: number
          rating?: number | null
          settings?: Json | null
          slug?: string
          theme_accent_color?: string | null
          theme_primary_color?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_configs: {
        Row: {
          created_at: string
          credentials_encrypted: Json | null
          display_name: string | null
          hotel_id: string
          id: string
          last_error: string | null
          last_sync_at: string | null
          provider: string
          settings: Json | null
          status: string
          sync_log: Json[] | null
          updated_at: string
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          credentials_encrypted?: Json | null
          display_name?: string | null
          hotel_id: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider: string
          settings?: Json | null
          status?: string
          sync_log?: Json[] | null
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          credentials_encrypted?: Json | null
          display_name?: string | null
          hotel_id?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider?: string
          settings?: Json | null
          status?: string
          sync_log?: Json[] | null
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_configs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          description: string | null
          hotel_id: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          category_id: string | null
          created_at: string
          description: string | null
          hotel_id: string
          id: string
          image_url: string | null
          is_available: boolean
          is_popular: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          hotel_id: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_popular?: boolean
          name: string
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          hotel_id?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_popular?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean
          request_id: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          request_id?: string | null
          sender_id: string
          sender_type?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          request_id?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          hotel_id: string
          id: string
          preferences: Json
          push_enabled: boolean
          push_subscription: Json | null
          sound_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          hotel_id: string
          id?: string
          preferences?: Json
          push_enabled?: boolean
          push_subscription?: Json | null
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          hotel_id?: string
          id?: string
          preferences?: Json
          push_enabled?: boolean
          push_subscription?: Json | null
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          modifiers: Json | null
          name: string
          notes: string | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          modifiers?: Json | null
          name: string
          notes?: string | null
          order_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          modifiers?: Json | null
          name?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          request_id: string | null
          room_number: string
          status: string
          stay_id: string | null
          subtotal: number
          tax: number
          tip: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          request_id?: string | null
          room_number: string
          status?: string
          stay_id?: string | null
          subtotal?: number
          tax?: number
          tip?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          request_id?: string | null
          room_number?: string
          status?: string
          stay_id?: string | null
          subtotal?: number
          tax?: number
          tip?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "stays"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          hotel_id: string
          id: string
          order_id: string | null
          rating: number
          request_id: string | null
          tip_amount: number | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          order_id?: string | null
          rating: number
          request_id?: string | null
          tip_amount?: number | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          order_id?: string | null
          rating?: number
          request_id?: string | null
          tip_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          request_id: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          request_id: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          assigned_staff_id: string | null
          category: Database["public"]["Enums"]["request_category"]
          completed_at: string | null
          created_at: string
          description: string | null
          eta_minutes: number | null
          hotel_id: string
          id: string
          item: string
          priority: Database["public"]["Enums"]["request_priority"]
          room_number: string
          status: Database["public"]["Enums"]["request_status"]
          stay_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_staff_id?: string | null
          category: Database["public"]["Enums"]["request_category"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          eta_minutes?: number | null
          hotel_id: string
          id?: string
          item: string
          priority?: Database["public"]["Enums"]["request_priority"]
          room_number: string
          status?: Database["public"]["Enums"]["request_status"]
          stay_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_staff_id?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          eta_minutes?: number | null
          hotel_id?: string
          id?: string
          item?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          room_number?: string
          status?: Database["public"]["Enums"]["request_status"]
          stay_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "stays"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: string[] | null
          created_at: string
          description: string | null
          floor: number
          hotel_id: string
          id: string
          image_url: string | null
          max_occupancy: number
          price_per_night: number | null
          room_number: string
          room_type: string
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          created_at?: string
          description?: string | null
          floor?: number
          hotel_id: string
          id?: string
          image_url?: string | null
          max_occupancy?: number
          price_per_night?: number | null
          room_number: string
          room_type?: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          created_at?: string
          description?: string | null
          floor?: number
          hotel_id?: string
          id?: string
          image_url?: string | null
          max_occupancy?: number
          price_per_night?: number | null
          room_number?: string
          room_type?: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      service_options: {
        Row: {
          created_at: string | null
          description: string | null
          eta_minutes: number | null
          hotel_id: string
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          service_type: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          eta_minutes?: number | null
          hotel_id: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          service_type: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          eta_minutes?: number | null
          hotel_id?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          service_type?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_options_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      service_time_options: {
        Row: {
          created_at: string | null
          hotel_id: string
          id: string
          is_active: boolean | null
          label: string
          minutes: number
          service_type: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean | null
          label: string
          minutes: number
          service_type: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          label?: string
          minutes?: number
          service_type?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_time_options_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          check_in_at: string | null
          check_out_at: string | null
          created_at: string
          department: Database["public"]["Enums"]["department_type"] | null
          id: string
          shift_id: string
          staff_id: string
          status: string
        }
        Insert: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          department?: Database["public"]["Enums"]["department_type"] | null
          id?: string
          shift_id: string
          staff_id: string
          status?: string
        }
        Update: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          department?: Database["public"]["Enums"]["department_type"] | null
          id?: string
          shift_id?: string
          staff_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          date: string
          end_time: string
          hotel_id: string
          id: string
          name: string
          notes: string | null
          start_time: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          hotel_id: string
          id?: string
          name: string
          notes?: string | null
          start_time: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          hotel_id?: string
          id?: string
          name?: string
          notes?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_configs: {
        Row: {
          category: Database["public"]["Enums"]["request_category"]
          created_at: string
          hotel_id: string
          id: string
          priority: Database["public"]["Enums"]["request_priority"]
          target_minutes: number
        }
        Insert: {
          category: Database["public"]["Enums"]["request_category"]
          created_at?: string
          hotel_id: string
          id?: string
          priority: Database["public"]["Enums"]["request_priority"]
          target_minutes?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["request_category"]
          created_at?: string
          hotel_id?: string
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          target_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "sla_configs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_assignments: {
        Row: {
          created_at: string
          department: Database["public"]["Enums"]["department_type"]
          hotel_id: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          department: Database["public"]["Enums"]["department_type"]
          hotel_id: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          department?: Database["public"]["Enums"]["department_type"]
          hotel_id?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_assignments_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      stays: {
        Row: {
          booking_id: string | null
          check_in: string
          check_out: string
          created_at: string
          hotel_id: string
          id: string
          room_id: string | null
          room_number: string
          status: Database["public"]["Enums"]["stay_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          booking_id?: string | null
          check_in: string
          check_out: string
          created_at?: string
          hotel_id: string
          id?: string
          room_id?: string | null
          room_number: string
          status?: Database["public"]["Enums"]["stay_status"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          booking_id?: string | null
          check_in?: string
          check_out?: string
          created_at?: string
          hotel_id?: string
          id?: string
          room_id?: string | null
          room_number?: string
          status?: Database["public"]["Enums"]["stay_status"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stays_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stays_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stays_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          hotel_id: string
          id: string
          plan: string
          room_count: number | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          hotel_id: string
          id?: string
          plan: string
          room_count?: number | null
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          hotel_id?: string
          id?: string
          plan?: string
          room_count?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: true
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
          source: string | null
          type: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          source?: string | null
          type: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          source?: string | null
          type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_request: {
        Args: { p_reason?: string; p_request_id: string; p_user_id: string }
        Returns: Json
      }
      create_order_with_items: {
        Args: {
          p_hotel_id: string
          p_items?: Json
          p_notes?: string
          p_room_number: string
          p_stay_id?: string
          p_tip?: number
          p_user_id: string
        }
        Returns: Json
      }
      generate_confirmation_number: { Args: never; Returns: string }
      get_demo_item_v2: { Args: { cat: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_demo_data: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "guest" | "staff" | "front_desk" | "manager" | "super_admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled"
      department_type:
        | "housekeeping"
        | "maintenance"
        | "fb"
        | "concierge"
        | "valet"
        | "spa"
        | "front_desk"
      request_category:
        | "housekeeping"
        | "maintenance"
        | "room_service"
        | "concierge"
        | "valet"
        | "spa"
        | "other"
      request_priority: "low" | "medium" | "high" | "urgent"
      request_status:
        | "new"
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
      room_status:
        | "available"
        | "occupied"
        | "cleaning"
        | "maintenance"
        | "out_of_order"
      stay_status: "upcoming" | "active" | "completed" | "cancelled"
    }
    CompositeTypes: {
      order_item_input: {
        menu_item_id: string | null
        name: string | null
        unit_price: number | null
        quantity: number | null
        notes: string | null
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
      app_role: ["guest", "staff", "front_desk", "manager", "super_admin"],
      booking_status: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
      ],
      department_type: [
        "housekeeping",
        "maintenance",
        "fb",
        "concierge",
        "valet",
        "spa",
        "front_desk",
      ],
      request_category: [
        "housekeeping",
        "maintenance",
        "room_service",
        "concierge",
        "valet",
        "spa",
        "other",
      ],
      request_priority: ["low", "medium", "high", "urgent"],
      request_status: [
        "new",
        "pending",
        "in_progress",
        "completed",
        "cancelled",
      ],
      room_status: [
        "available",
        "occupied",
        "cleaning",
        "maintenance",
        "out_of_order",
      ],
      stay_status: ["upcoming", "active", "completed", "cancelled"],
    },
  },
} as const

