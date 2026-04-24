export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string;
          code: string;
          created_at: string;
          description: string;
          icon: string | null;
          id: string;
          is_active: boolean;
          name: string;
          points_reward: number;
          requirement_type: string | null;
          requirement_value: number | null;
        };
        Insert: {
          category: string;
          code: string;
          created_at?: string;
          description: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          points_reward?: number;
          requirement_type?: string | null;
          requirement_value?: number | null;
        };
        Update: {
          category?: string;
          code?: string;
          created_at?: string;
          description?: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          points_reward?: number;
          requirement_type?: string | null;
          requirement_value?: number | null;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          points: number;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          points?: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          points?: number;
        };
        Relationships: [];
      };
      admin_access: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          invited_by: string | null;
          is_active: boolean | null;
          last_login: string | null;
          permissions: Json | null;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          invited_by?: string | null;
          is_active?: boolean | null;
          last_login?: string | null;
          permissions?: Json | null;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          invited_by?: string | null;
          is_active?: boolean | null;
          last_login?: string | null;
          permissions?: Json | null;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          action: string;
          admin_user_id: string;
          created_at: string | null;
          details: Json | null;
          id: string;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action: string;
          admin_user_id: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action?: string;
          admin_user_id?: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [];
      };
      adoption_bulk_imports: {
        Row: {
          adoption_center_id: string;
          completed_at: string | null;
          created_at: string;
          error_count: number;
          errors: Json | null;
          filename: string | null;
          id: string;
          status: string;
          success_count: number;
          total_rows: number;
          uploaded_by: string;
        };
        Insert: {
          adoption_center_id: string;
          completed_at?: string | null;
          created_at?: string;
          error_count?: number;
          errors?: Json | null;
          filename?: string | null;
          id?: string;
          status?: string;
          success_count?: number;
          total_rows?: number;
          uploaded_by: string;
        };
        Update: {
          adoption_center_id?: string;
          completed_at?: string | null;
          created_at?: string;
          error_count?: number;
          errors?: Json | null;
          filename?: string | null;
          id?: string;
          status?: string;
          success_count?: number;
          total_rows?: number;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'adoption_bulk_imports_adoption_center_id_fkey';
            columns: ['adoption_center_id'];
            isOneToOne: false;
            referencedRelation: 'adoption_centers';
            referencedColumns: ['id'];
          },
        ];
      };
      adoption_centers: {
        Row: {
          accepts_donations: boolean;
          address: string | null;
          animal_types: string[] | null;
          banner_url: string | null;
          capacity: number | null;
          commune: string;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          donation_percentage: number;
          id: string;
          latitude: number | null;
          legal_name: string;
          logo_url: string | null;
          longitude: number | null;
          mission: string | null;
          region: string | null;
          rut: string | null;
          slug: string | null;
          social_media: Json | null;
          status: string;
          total_donations_clp: number;
          total_pets_adopted: number;
          total_pets_in_care: number;
          type: string;
          updated_at: string;
          user_id: string;
          verification_doc_url: string | null;
          verified: boolean;
          verified_at: string | null;
          website: string | null;
        };
        Insert: {
          accepts_donations?: boolean;
          address?: string | null;
          animal_types?: string[] | null;
          banner_url?: string | null;
          capacity?: number | null;
          commune: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          donation_percentage?: number;
          id?: string;
          latitude?: number | null;
          legal_name: string;
          logo_url?: string | null;
          longitude?: number | null;
          mission?: string | null;
          region?: string | null;
          rut?: string | null;
          slug?: string | null;
          social_media?: Json | null;
          status?: string;
          total_donations_clp?: number;
          total_pets_adopted?: number;
          total_pets_in_care?: number;
          type?: string;
          updated_at?: string;
          user_id: string;
          verification_doc_url?: string | null;
          verified?: boolean;
          verified_at?: string | null;
          website?: string | null;
        };
        Update: {
          accepts_donations?: boolean;
          address?: string | null;
          animal_types?: string[] | null;
          banner_url?: string | null;
          capacity?: number | null;
          commune?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          donation_percentage?: number;
          id?: string;
          latitude?: number | null;
          legal_name?: string;
          logo_url?: string | null;
          longitude?: number | null;
          mission?: string | null;
          region?: string | null;
          rut?: string | null;
          slug?: string | null;
          social_media?: Json | null;
          status?: string;
          total_donations_clp?: number;
          total_pets_adopted?: number;
          total_pets_in_care?: number;
          type?: string;
          updated_at?: string;
          user_id?: string;
          verification_doc_url?: string | null;
          verified?: boolean;
          verified_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      adoption_interests: {
        Row: {
          adoption_post_id: string;
          created_at: string;
          id: string;
          interested_user_id: string;
          message: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          adoption_post_id: string;
          created_at?: string;
          id?: string;
          interested_user_id: string;
          message?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          adoption_post_id?: string;
          created_at?: string;
          id?: string;
          interested_user_id?: string;
          message?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'adoption_interests_adoption_post_id_fkey';
            columns: ['adoption_post_id'];
            isOneToOne: false;
            referencedRelation: 'adoption_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      adoption_messages: {
        Row: {
          adoption_interest_id: string;
          created_at: string;
          id: string;
          message: string;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          adoption_interest_id: string;
          created_at?: string;
          id?: string;
          message: string;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          adoption_interest_id?: string;
          created_at?: string;
          id?: string;
          message?: string;
          read_at?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'adoption_messages_adoption_interest_id_fkey';
            columns: ['adoption_interest_id'];
            isOneToOne: false;
            referencedRelation: 'adoption_interests';
            referencedColumns: ['id'];
          },
        ];
      };
      adoption_posts: {
        Row: {
          age_months: number | null;
          age_years: number | null;
          breed: string | null;
          created_at: string;
          description: string;
          gender: string | null;
          good_with_cats: boolean | null;
          good_with_dogs: boolean | null;
          good_with_kids: boolean | null;
          health_status: string | null;
          id: string;
          interests_count: number | null;
          location: string;
          pet_name: string;
          photos: string[] | null;
          reason_for_adoption: string | null;
          size: string | null;
          species: string;
          status: string;
          temperament: string[] | null;
          updated_at: string;
          user_id: string;
          views_count: number | null;
        };
        Insert: {
          age_months?: number | null;
          age_years?: number | null;
          breed?: string | null;
          created_at?: string;
          description: string;
          gender?: string | null;
          good_with_cats?: boolean | null;
          good_with_dogs?: boolean | null;
          good_with_kids?: boolean | null;
          health_status?: string | null;
          id?: string;
          interests_count?: number | null;
          location: string;
          pet_name: string;
          photos?: string[] | null;
          reason_for_adoption?: string | null;
          size?: string | null;
          species: string;
          status?: string;
          temperament?: string[] | null;
          updated_at?: string;
          user_id: string;
          views_count?: number | null;
        };
        Update: {
          age_months?: number | null;
          age_years?: number | null;
          breed?: string | null;
          created_at?: string;
          description?: string;
          gender?: string | null;
          good_with_cats?: boolean | null;
          good_with_dogs?: boolean | null;
          good_with_kids?: boolean | null;
          health_status?: string | null;
          id?: string;
          interests_count?: number | null;
          location?: string;
          pet_name?: string;
          photos?: string[] | null;
          reason_for_adoption?: string | null;
          size?: string | null;
          species?: string;
          status?: string;
          temperament?: string[] | null;
          updated_at?: string;
          user_id?: string;
          views_count?: number | null;
        };
        Relationships: [];
      };
      adoption_shelters: {
        Row: {
          address: string | null;
          ai_description: string | null;
          ai_processed_at: string | null;
          animal_types: string[] | null;
          city: string | null;
          claimed_by_adoption_center_id: string | null;
          commune: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          description: string | null;
          formality_level: string | null;
          id: string;
          is_active: boolean | null;
          is_verified: boolean | null;
          latitude: number | null;
          longitude: number | null;
          name: string;
          pet_sizes: string[] | null;
          social_media: Json | null;
          source: string | null;
          specialties: string[] | null;
          type: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          ai_description?: string | null;
          ai_processed_at?: string | null;
          animal_types?: string[] | null;
          city?: string | null;
          claimed_by_adoption_center_id?: string | null;
          commune?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          formality_level?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          pet_sizes?: string[] | null;
          social_media?: Json | null;
          source?: string | null;
          specialties?: string[] | null;
          type?: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          ai_description?: string | null;
          ai_processed_at?: string | null;
          animal_types?: string[] | null;
          city?: string | null;
          claimed_by_adoption_center_id?: string | null;
          commune?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          formality_level?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          pet_sizes?: string[] | null;
          social_media?: Json | null;
          source?: string | null;
          specialties?: string[] | null;
          type?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'adoption_shelters_claimed_by_adoption_center_id_fkey';
            columns: ['claimed_by_adoption_center_id'];
            isOneToOne: false;
            referencedRelation: 'adoption_centers';
            referencedColumns: ['id'];
          },
        ];
      };
      advertisements: {
        Row: {
          clicks_count: number;
          created_at: string;
          description: string | null;
          end_date: string;
          id: string;
          image_url: string | null;
          impressions_count: number;
          is_active: boolean;
          notes: string | null;
          partner_id: string | null;
          placement: string;
          priority: number;
          start_date: string;
          target_url: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          clicks_count?: number;
          created_at?: string;
          description?: string | null;
          end_date: string;
          id?: string;
          image_url?: string | null;
          impressions_count?: number;
          is_active?: boolean;
          notes?: string | null;
          partner_id?: string | null;
          placement?: string;
          priority?: number;
          start_date?: string;
          target_url: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          clicks_count?: number;
          created_at?: string;
          description?: string | null;
          end_date?: string;
          id?: string;
          image_url?: string | null;
          impressions_count?: number;
          is_active?: boolean;
          notes?: string | null;
          partner_id?: string | null;
          placement?: string;
          priority?: number;
          start_date?: string;
          target_url?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'advertisements_partner_id_fkey';
            columns: ['partner_id'];
            isOneToOne: false;
            referencedRelation: 'paw_companys';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_cache: {
        Row: {
          cache_key: string;
          created_at: string;
          expires_at: string;
          function_name: string;
          hit_count: number;
          id: string;
          result: Json;
        };
        Insert: {
          cache_key: string;
          created_at?: string;
          expires_at: string;
          function_name: string;
          hit_count?: number;
          id?: string;
          result: Json;
        };
        Update: {
          cache_key?: string;
          created_at?: string;
          expires_at?: string;
          function_name?: string;
          hit_count?: number;
          id?: string;
          result?: Json;
        };
        Relationships: [];
      };
      ai_request_quota: {
        Row: {
          count: number;
          reset_at: string;
          user_id: string;
        };
        Insert: {
          count?: number;
          reset_at?: string;
          user_id: string;
        };
        Update: {
          count?: number;
          reset_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          calls_today: number | null;
          calls_total: number | null;
          id: string;
          last_called_at: string | null;
          last_reset_date: string | null;
          skill_name: string;
          user_id: string;
        };
        Insert: {
          calls_today?: number | null;
          calls_total?: number | null;
          id?: string;
          last_called_at?: string | null;
          last_reset_date?: string | null;
          skill_name: string;
          user_id: string;
        };
        Update: {
          calls_today?: number | null;
          calls_total?: number | null;
          id?: string;
          last_called_at?: string | null;
          last_reset_date?: string | null;
          skill_name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          created_at: string | null;
          duration_ms: number | null;
          event_name: string;
          event_type: string;
          id: string;
          metadata: Json | null;
          session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          duration_ms?: number | null;
          event_name: string;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          duration_ms?: number | null;
          event_name?: string;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          appointment_type: string;
          created_at: string;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          location: string | null;
          notes: string | null;
          pet_id: string;
          provider_name: string | null;
          reminder_sent: boolean | null;
          scheduled_date: string;
          status: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          appointment_type: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          location?: string | null;
          notes?: string | null;
          pet_id: string;
          provider_name?: string | null;
          reminder_sent?: boolean | null;
          scheduled_date: string;
          status?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          appointment_type?: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          location?: string | null;
          notes?: string | null;
          pet_id?: string;
          provider_name?: string | null;
          reminder_sent?: boolean | null;
          scheduled_date?: string;
          status?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointments_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_snapshots: {
        Row: {
          active_pets: number;
          auto_fixes_applied: Json;
          created_at: string;
          error_logs_24h: number;
          error_logs_total: number;
          health_score: number;
          id: string;
          needs_human_attention: Json;
          orphan_pets: number;
          premium_users: number;
          providers_without_slug: number;
          raw_metrics: Json | null;
          snapshot_date: string;
          total_bookings: number;
          total_users: number;
          unique_error_patterns: number;
          verified_providers: number;
        };
        Insert: {
          active_pets?: number;
          auto_fixes_applied?: Json;
          created_at?: string;
          error_logs_24h?: number;
          error_logs_total?: number;
          health_score: number;
          id?: string;
          needs_human_attention?: Json;
          orphan_pets?: number;
          premium_users?: number;
          providers_without_slug?: number;
          raw_metrics?: Json | null;
          snapshot_date?: string;
          total_bookings?: number;
          total_users?: number;
          unique_error_patterns?: number;
          verified_providers?: number;
        };
        Update: {
          active_pets?: number;
          auto_fixes_applied?: Json;
          created_at?: string;
          error_logs_24h?: number;
          error_logs_total?: number;
          health_score?: number;
          id?: string;
          needs_human_attention?: Json;
          orphan_pets?: number;
          premium_users?: number;
          providers_without_slug?: number;
          raw_metrics?: Json | null;
          snapshot_date?: string;
          total_bookings?: number;
          total_users?: number;
          unique_error_patterns?: number;
          verified_providers?: number;
        };
        Relationships: [];
      };
      auth_audit_log: {
        Row: {
          created_at: string;
          details: Json | null;
          email: string | null;
          event_type: string;
          id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          details?: Json | null;
          email?: string | null;
          event_type: string;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          details?: Json | null;
          email?: string | null;
          event_type?: string;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      balance_transactions: {
        Row: {
          amount_clp: number;
          created_at: string;
          id: string;
          notes: string | null;
          order_item_id: string | null;
          processed_at: string | null;
          provider_id: string;
          release_date: string | null;
          status: string;
          transaction_type: string;
        };
        Insert: {
          amount_clp: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          order_item_id?: string | null;
          processed_at?: string | null;
          provider_id: string;
          release_date?: string | null;
          status?: string;
          transaction_type: string;
        };
        Update: {
          amount_clp?: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          order_item_id?: string | null;
          processed_at?: string | null;
          provider_id?: string;
          release_date?: string | null;
          status?: string;
          transaction_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'balance_transactions_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
        ];
      };
      bereavement_chat_messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          pet_id: string | null;
          role: string;
          safety_flag: boolean | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          pet_id?: string | null;
          role: string;
          safety_flag?: boolean | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          pet_id?: string | null;
          role?: string;
          safety_flag?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bereavement_chat_messages_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      bereavement_safety_logs: {
        Row: {
          created_at: string | null;
          detected_phrase: string | null;
          flag_type: string;
          id: string;
          resources_provided: string[] | null;
          reviewed: boolean | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          detected_phrase?: string | null;
          flag_type: string;
          id?: string;
          resources_provided?: string[] | null;
          reviewed?: boolean | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          detected_phrase?: string | null;
          flag_type?: string;
          id?: string;
          resources_provided?: string[] | null;
          reviewed?: boolean | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      booking_events: {
        Row: {
          actor_id: string | null;
          actor_role: string | null;
          booking_id: string;
          booking_type: string;
          created_at: string;
          event_type: string;
          id: string;
          metadata: Json | null;
          new_status: string | null;
          previous_status: string | null;
        };
        Insert: {
          actor_id?: string | null;
          actor_role?: string | null;
          booking_id: string;
          booking_type: string;
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          new_status?: string | null;
          previous_status?: string | null;
        };
        Update: {
          actor_id?: string | null;
          actor_role?: string | null;
          booking_id?: string;
          booking_type?: string;
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          new_status?: string | null;
          previous_status?: string | null;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          booked_at: string | null;
          cancelled_at: string | null;
          completed_at: string | null;
          confirmed_at: string | null;
          id: string;
          notes: string | null;
          payment_reference: string | null;
          payment_status: string;
          pet_id: string | null;
          provider_id: string;
          service_type: string;
          slot_id: string | null;
          status: string;
          total_price: number;
          user_id: string;
        };
        Insert: {
          booked_at?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          confirmed_at?: string | null;
          id?: string;
          notes?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          pet_id?: string | null;
          provider_id: string;
          service_type: string;
          slot_id?: string | null;
          status?: string;
          total_price: number;
          user_id: string;
        };
        Update: {
          booked_at?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          confirmed_at?: string | null;
          id?: string;
          notes?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          pet_id?: string | null;
          provider_id?: string;
          service_type?: string;
          slot_id?: string | null;
          status?: string;
          total_price?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_slot_id_fkey';
            columns: ['slot_id'];
            isOneToOne: false;
            referencedRelation: 'service_slots';
            referencedColumns: ['id'];
          },
        ];
      };
      cart_items: {
        Row: {
          address: string | null;
          created_at: string;
          duration_minutes: number;
          id: string;
          latitude: number | null;
          longitude: number | null;
          pet_ids: string[];
          provider_id: string;
          scheduled_date: string;
          service_details: Json | null;
          service_type: string;
          special_instructions: string | null;
          unit_price_clp: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          pet_ids: string[];
          provider_id: string;
          scheduled_date: string;
          service_details?: Json | null;
          service_type: string;
          special_instructions?: string | null;
          unit_price_clp: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          pet_ids?: string[];
          provider_id?: string;
          scheduled_date?: string;
          service_details?: Json | null;
          service_type?: string;
          special_instructions?: string | null;
          unit_price_clp?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      clinic_vet_seats: {
        Row: {
          accepted_at: string | null;
          id: string;
          invited_at: string;
          invited_by: string | null;
          invited_email: string | null;
          invited_token: string;
          parent_provider_id: string;
          removed_at: string | null;
          role: string;
          seat_user_id: string | null;
          status: string;
        };
        Insert: {
          accepted_at?: string | null;
          id?: string;
          invited_at?: string;
          invited_by?: string | null;
          invited_email?: string | null;
          invited_token?: string;
          parent_provider_id: string;
          removed_at?: string | null;
          role?: string;
          seat_user_id?: string | null;
          status?: string;
        };
        Update: {
          accepted_at?: string | null;
          id?: string;
          invited_at?: string;
          invited_by?: string | null;
          invited_email?: string | null;
          invited_token?: string;
          parent_provider_id?: string;
          removed_at?: string | null;
          role?: string;
          seat_user_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clinic_vet_seats_parent_provider_id_fkey';
            columns: ['parent_provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clinic_vet_seats_parent_provider_id_fkey';
            columns: ['parent_provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      community_group_members: {
        Row: {
          group_id: string;
          joined_at: string | null;
          role: string | null;
          user_id: string;
        };
        Insert: {
          group_id: string;
          joined_at?: string | null;
          role?: string | null;
          user_id: string;
        };
        Update: {
          group_id?: string;
          joined_at?: string | null;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'community_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      community_group_messages: {
        Row: {
          content: string;
          created_at: string | null;
          group_id: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          group_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          group_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'community_group_messages_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'community_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_group_messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_group_messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      community_groups: {
        Row: {
          category: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          group_type: string | null;
          id: string;
          is_public: boolean | null;
          member_count: number | null;
          name: string;
          slug: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          group_type?: string | null;
          id?: string;
          is_public?: boolean | null;
          member_count?: number | null;
          name: string;
          slug: string;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          group_type?: string | null;
          id?: string;
          is_public?: boolean | null;
          member_count?: number | null;
          name?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_groups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_groups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      comprehensive_medical_records_deprecated_20260424: {
        Row: {
          date: string | null;
          id: string;
          notes: string | null;
          patient_id: string | null;
        };
        Insert: {
          date?: string | null;
          id?: string;
          notes?: string | null;
          patient_id?: string | null;
        };
        Update: {
          date?: string | null;
          id?: string;
          notes?: string | null;
          patient_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'comprehensive_medical_records_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comprehensive_medical_records_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      consultation_templates: {
        Row: {
          category: string;
          created_at: string | null;
          id: string;
          is_system: boolean | null;
          name: string;
          provider_id: string | null;
          template_body: Json;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          id?: string;
          is_system?: boolean | null;
          name: string;
          provider_id?: string | null;
          template_body?: Json;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          id?: string;
          is_system?: boolean | null;
          name?: string;
          provider_id?: string | null;
          template_body?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'consultation_templates_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'consultation_templates_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      content_reports: {
        Row: {
          admin_notes: string | null;
          comment_id: string | null;
          created_at: string | null;
          id: string;
          post_id: string | null;
          reason: string;
          reporter_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
        };
        Insert: {
          admin_notes?: string | null;
          comment_id?: string | null;
          created_at?: string | null;
          id?: string;
          post_id?: string | null;
          reason: string;
          reporter_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
        };
        Update: {
          admin_notes?: string | null;
          comment_id?: string | null;
          created_at?: string | null;
          id?: string;
          post_id?: string | null;
          reason?: string;
          reporter_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'content_reports_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          last_message_at: string | null;
          participant1_id: string;
          participant2_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          participant1_id: string;
          participant2_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          participant1_id?: string;
          participant2_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_challenges: {
        Row: {
          challenge_type: string;
          created_at: string;
          description: string;
          id: string;
          points: number;
          target_value: number;
          title: string;
          valid_date: string;
        };
        Insert: {
          challenge_type: string;
          created_at?: string;
          description: string;
          id?: string;
          points?: number;
          target_value: number;
          title: string;
          valid_date: string;
        };
        Update: {
          challenge_type?: string;
          created_at?: string;
          description?: string;
          id?: string;
          points?: number;
          target_value?: number;
          title?: string;
          valid_date?: string;
        };
        Relationships: [];
      };
      device_tokens: {
        Row: {
          app_version: string | null;
          created_at: string;
          device_name: string | null;
          enabled: boolean;
          id: string;
          last_seen_at: string;
          platform: string;
          token: string;
          user_id: string;
        };
        Insert: {
          app_version?: string | null;
          created_at?: string;
          device_name?: string | null;
          enabled?: boolean;
          id?: string;
          last_seen_at?: string;
          platform: string;
          token: string;
          user_id: string;
        };
        Update: {
          app_version?: string | null;
          created_at?: string;
          device_name?: string | null;
          enabled?: boolean;
          id?: string;
          last_seen_at?: string;
          platform?: string;
          token?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      dog_walker_profiles: {
        Row: {
          available_hours: Json;
          bio: string | null;
          certifications: Json | null;
          coverage_zones: Json;
          created_at: string;
          experience_years: number | null;
          id: string;
          is_active: boolean;
          is_verified: boolean;
          max_dogs: number;
          photos: string[] | null;
          price_per_hour: number;
          price_per_walk: number;
          rating: number | null;
          services: Json | null;
          total_reviews: number | null;
          total_walks: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          available_hours: Json;
          bio?: string | null;
          certifications?: Json | null;
          coverage_zones: Json;
          created_at?: string;
          experience_years?: number | null;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          max_dogs?: number;
          photos?: string[] | null;
          price_per_hour: number;
          price_per_walk: number;
          rating?: number | null;
          services?: Json | null;
          total_reviews?: number | null;
          total_walks?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          available_hours?: Json;
          bio?: string | null;
          certifications?: Json | null;
          coverage_zones?: Json;
          created_at?: string;
          experience_years?: number | null;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          max_dogs?: number;
          photos?: string[] | null;
          price_per_hour?: number;
          price_per_walk?: number;
          rating?: number | null;
          services?: Json | null;
          total_reviews?: number | null;
          total_walks?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      dogsitter_bookings: {
        Row: {
          canceled_at: string | null;
          canceled_by: string | null;
          cancellation_reason: string | null;
          confirmed_at: string | null;
          created_at: string;
          dogsitter_id: string;
          drop_off_address: string;
          drop_off_latitude: number | null;
          drop_off_longitude: number | null;
          end_date: string;
          google_event_id: string | null;
          id: string;
          owner_id: string;
          payment_status: string;
          pet_ids: string[];
          platform_fee_amount: number | null;
          provider_payout_amount: number | null;
          reminder_24h_sent: boolean | null;
          reminder_2h_sent: boolean | null;
          service_type: string;
          special_instructions: string | null;
          start_date: string;
          status: string;
          stripe_payment_intent_id: string | null;
          total_price: number;
          updated_at: string;
        };
        Insert: {
          canceled_at?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          dogsitter_id: string;
          drop_off_address: string;
          drop_off_latitude?: number | null;
          drop_off_longitude?: number | null;
          end_date: string;
          google_event_id?: string | null;
          id?: string;
          owner_id: string;
          payment_status?: string;
          pet_ids: string[];
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          reminder_24h_sent?: boolean | null;
          reminder_2h_sent?: boolean | null;
          service_type: string;
          special_instructions?: string | null;
          start_date: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          total_price: number;
          updated_at?: string;
        };
        Update: {
          canceled_at?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          dogsitter_id?: string;
          drop_off_address?: string;
          drop_off_latitude?: number | null;
          drop_off_longitude?: number | null;
          end_date?: string;
          google_event_id?: string | null;
          id?: string;
          owner_id?: string;
          payment_status?: string;
          pet_ids?: string[];
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          reminder_24h_sent?: boolean | null;
          reminder_2h_sent?: boolean | null;
          service_type?: string;
          special_instructions?: string | null;
          start_date?: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          total_price?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      dogsitter_messages: {
        Row: {
          booking_id: string;
          created_at: string;
          id: string;
          message: string;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          booking_id: string;
          created_at?: string;
          id?: string;
          message: string;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          booking_id?: string;
          created_at?: string;
          id?: string;
          message?: string;
          read_at?: string | null;
          sender_id?: string;
        };
        Relationships: [];
      };
      dogsitter_profiles: {
        Row: {
          accepts_puppies: boolean | null;
          accepts_senior_dogs: boolean | null;
          amenities: Json | null;
          available_hours: Json;
          bio: string | null;
          certifications: Json | null;
          coverage_zones: Json;
          created_at: string;
          experience_years: number | null;
          has_yard: boolean | null;
          home_type: string | null;
          id: string;
          is_active: boolean;
          is_verified: boolean;
          max_dogs: number;
          photos: string[] | null;
          price_per_day: number;
          price_per_night: number;
          rating: number | null;
          services: Json | null;
          total_bookings: number | null;
          total_reviews: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          accepts_puppies?: boolean | null;
          accepts_senior_dogs?: boolean | null;
          amenities?: Json | null;
          available_hours: Json;
          bio?: string | null;
          certifications?: Json | null;
          coverage_zones: Json;
          created_at?: string;
          experience_years?: number | null;
          has_yard?: boolean | null;
          home_type?: string | null;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          max_dogs?: number;
          photos?: string[] | null;
          price_per_day: number;
          price_per_night: number;
          rating?: number | null;
          services?: Json | null;
          total_bookings?: number | null;
          total_reviews?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          accepts_puppies?: boolean | null;
          accepts_senior_dogs?: boolean | null;
          amenities?: Json | null;
          available_hours?: Json;
          bio?: string | null;
          certifications?: Json | null;
          coverage_zones?: Json;
          created_at?: string;
          experience_years?: number | null;
          has_yard?: boolean | null;
          home_type?: string | null;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          max_dogs?: number;
          photos?: string[] | null;
          price_per_day?: number;
          price_per_night?: number;
          rating?: number | null;
          services?: Json | null;
          total_bookings?: number | null;
          total_reviews?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      dogsitter_reports: {
        Row: {
          activities: Json | null;
          behavior_notes: string | null;
          booking_id: string;
          created_at: string;
          daily_notes: Json | null;
          feeding_times: Json | null;
          health_observations: string | null;
          id: string;
          photos: string[] | null;
        };
        Insert: {
          activities?: Json | null;
          behavior_notes?: string | null;
          booking_id: string;
          created_at?: string;
          daily_notes?: Json | null;
          feeding_times?: Json | null;
          health_observations?: string | null;
          id?: string;
          photos?: string[] | null;
        };
        Update: {
          activities?: Json | null;
          behavior_notes?: string | null;
          booking_id?: string;
          created_at?: string;
          daily_notes?: Json | null;
          feeding_times?: Json | null;
          health_observations?: string | null;
          id?: string;
          photos?: string[] | null;
        };
        Relationships: [];
      };
      dogsitter_reviews: {
        Row: {
          booking_id: string;
          comment: string | null;
          created_at: string;
          dogsitter_id: string;
          helpful_count: number | null;
          id: string;
          is_verified: boolean | null;
          owner_id: string;
          photos: string[] | null;
          provider_response: string | null;
          provider_response_date: string | null;
          rating: number;
          updated_at: string | null;
        };
        Insert: {
          booking_id: string;
          comment?: string | null;
          created_at?: string;
          dogsitter_id: string;
          helpful_count?: number | null;
          id?: string;
          is_verified?: boolean | null;
          owner_id: string;
          photos?: string[] | null;
          provider_response?: string | null;
          provider_response_date?: string | null;
          rating: number;
          updated_at?: string | null;
        };
        Update: {
          booking_id?: string;
          comment?: string | null;
          created_at?: string;
          dogsitter_id?: string;
          helpful_count?: number | null;
          id?: string;
          is_verified?: boolean | null;
          owner_id?: string;
          photos?: string[] | null;
          provider_response?: string | null;
          provider_response_date?: string | null;
          rating?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      donations: {
        Row: {
          amount_clp: number;
          beneficiary_adoption_center_id: string | null;
          beneficiary_type: string;
          cancelled_at: string | null;
          commerce_order: string | null;
          created_at: string;
          donor_name: string | null;
          email_contact: string | null;
          feedback_id: string | null;
          frequency: string;
          id: string;
          is_public: boolean;
          message: string | null;
          next_charge_at: string | null;
          paid_at: string | null;
          payment_provider: string;
          payment_provider_id: string | null;
          source: string | null;
          status: string;
          subscription_id: string | null;
          thanked_at: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount_clp: number;
          beneficiary_adoption_center_id?: string | null;
          beneficiary_type?: string;
          cancelled_at?: string | null;
          commerce_order?: string | null;
          created_at?: string;
          donor_name?: string | null;
          email_contact?: string | null;
          feedback_id?: string | null;
          frequency?: string;
          id?: string;
          is_public?: boolean;
          message?: string | null;
          next_charge_at?: string | null;
          paid_at?: string | null;
          payment_provider?: string;
          payment_provider_id?: string | null;
          source?: string | null;
          status?: string;
          subscription_id?: string | null;
          thanked_at?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          amount_clp?: number;
          beneficiary_adoption_center_id?: string | null;
          beneficiary_type?: string;
          cancelled_at?: string | null;
          commerce_order?: string | null;
          created_at?: string;
          donor_name?: string | null;
          email_contact?: string | null;
          feedback_id?: string | null;
          frequency?: string;
          id?: string;
          is_public?: boolean;
          message?: string | null;
          next_charge_at?: string | null;
          paid_at?: string | null;
          payment_provider?: string;
          payment_provider_id?: string | null;
          source?: string | null;
          status?: string;
          subscription_id?: string | null;
          thanked_at?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'donations_beneficiary_adoption_center_id_fkey';
            columns: ['beneficiary_adoption_center_id'];
            isOneToOne: false;
            referencedRelation: 'adoption_centers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'donations_feedback_id_fkey';
            columns: ['feedback_id'];
            isOneToOne: false;
            referencedRelation: 'feedback_in_app';
            referencedColumns: ['id'];
          },
        ];
      };
      error_logs: {
        Row: {
          context: Json | null;
          created_at: string | null;
          id: string;
          message: string;
          resolved: boolean | null;
          resolved_at: string | null;
          resolved_by: string | null;
          severity: string;
          source: string;
          stack_trace: string | null;
          user_id: string | null;
        };
        Insert: {
          context?: Json | null;
          created_at?: string | null;
          id?: string;
          message: string;
          resolved?: boolean | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          source: string;
          stack_trace?: string | null;
          user_id?: string | null;
        };
        Update: {
          context?: Json | null;
          created_at?: string | null;
          id?: string;
          message?: string;
          resolved?: boolean | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          source?: string;
          stack_trace?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      export_jobs: {
        Row: {
          completed_at: string | null;
          download_count: number | null;
          error_message: string | null;
          expires_at: string | null;
          export_type: string;
          file_hash_sha256: string | null;
          file_path: string | null;
          file_size_bytes: number | null;
          filters: Json;
          id: string;
          last_downloaded_at: string | null;
          progress_pct: number | null;
          requested_at: string | null;
          requested_by: string;
          rows_total: number | null;
          sheets_count: number | null;
          started_at: string | null;
          status: string;
        };
        Insert: {
          completed_at?: string | null;
          download_count?: number | null;
          error_message?: string | null;
          expires_at?: string | null;
          export_type: string;
          file_hash_sha256?: string | null;
          file_path?: string | null;
          file_size_bytes?: number | null;
          filters?: Json;
          id?: string;
          last_downloaded_at?: string | null;
          progress_pct?: number | null;
          requested_at?: string | null;
          requested_by: string;
          rows_total?: number | null;
          sheets_count?: number | null;
          started_at?: string | null;
          status?: string;
        };
        Update: {
          completed_at?: string | null;
          download_count?: number | null;
          error_message?: string | null;
          expires_at?: string | null;
          export_type?: string;
          file_hash_sha256?: string | null;
          file_path?: string | null;
          file_size_bytes?: number | null;
          filters?: Json;
          id?: string;
          last_downloaded_at?: string | null;
          progress_pct?: number | null;
          requested_at?: string | null;
          requested_by?: string;
          rows_total?: number | null;
          sheets_count?: number | null;
          started_at?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      external_calendar_events: {
        Row: {
          google_calendar_id: string;
          google_event_id: string;
          id: string;
          last_synced_at: string;
          source_id: string;
          source_type: string;
          user_id: string;
        };
        Insert: {
          google_calendar_id: string;
          google_event_id: string;
          id?: string;
          last_synced_at?: string;
          source_id: string;
          source_type: string;
          user_id: string;
        };
        Update: {
          google_calendar_id?: string;
          google_event_id?: string;
          id?: string;
          last_synced_at?: string;
          source_id?: string;
          source_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      feature_usage: {
        Row: {
          feature: string;
          id: string;
          last_used_at: string | null;
          usage_count: number;
          usage_month: string;
          user_id: string;
        };
        Insert: {
          feature: string;
          id?: string;
          last_used_at?: string | null;
          usage_count?: number;
          usage_month?: string;
          user_id: string;
        };
        Update: {
          feature?: string;
          id?: string;
          last_used_at?: string | null;
          usage_count?: number;
          usage_month?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      feedback_in_app: {
        Row: {
          admin_liked: boolean | null;
          admin_notes: string | null;
          admin_responded_at: string | null;
          admin_response: string | null;
          ai_category: string | null;
          ai_classified_at: string | null;
          ai_sentiment: string | null;
          ai_suggested_response: string | null;
          ai_summary: string | null;
          ai_tags: string[] | null;
          ai_urgency: string | null;
          app_rating: number | null;
          created_at: string | null;
          description: string;
          id: string;
          paw_points_awarded: number | null;
          role: string | null;
          route: string | null;
          status: string | null;
          type: string;
          updated_at: string | null;
          user_display_name: string | null;
          user_id: string;
          would_pay: string | null;
        };
        Insert: {
          admin_liked?: boolean | null;
          admin_notes?: string | null;
          admin_responded_at?: string | null;
          admin_response?: string | null;
          ai_category?: string | null;
          ai_classified_at?: string | null;
          ai_sentiment?: string | null;
          ai_suggested_response?: string | null;
          ai_summary?: string | null;
          ai_tags?: string[] | null;
          ai_urgency?: string | null;
          app_rating?: number | null;
          created_at?: string | null;
          description: string;
          id?: string;
          paw_points_awarded?: number | null;
          role?: string | null;
          route?: string | null;
          status?: string | null;
          type: string;
          updated_at?: string | null;
          user_display_name?: string | null;
          user_id: string;
          would_pay?: string | null;
        };
        Update: {
          admin_liked?: boolean | null;
          admin_notes?: string | null;
          admin_responded_at?: string | null;
          admin_response?: string | null;
          ai_category?: string | null;
          ai_classified_at?: string | null;
          ai_sentiment?: string | null;
          ai_suggested_response?: string | null;
          ai_summary?: string | null;
          ai_tags?: string[] | null;
          ai_urgency?: string | null;
          app_rating?: number | null;
          created_at?: string | null;
          description?: string;
          id?: string;
          paw_points_awarded?: number | null;
          role?: string | null;
          route?: string | null;
          status?: string | null;
          type?: string;
          updated_at?: string | null;
          user_display_name?: string | null;
          user_id?: string;
          would_pay?: string | null;
        };
        Relationships: [];
      };
      google_calendar_tokens: {
        Row: {
          access_token: string;
          calendar_id: string | null;
          created_at: string;
          expires_at: string;
          google_email: string | null;
          refresh_token: string;
          revoked_at: string | null;
          scope: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token: string;
          calendar_id?: string | null;
          created_at?: string;
          expires_at: string;
          google_email?: string | null;
          refresh_token: string;
          revoked_at?: string | null;
          scope?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string;
          calendar_id?: string | null;
          created_at?: string;
          expires_at?: string;
          google_email?: string | null;
          refresh_token?: string;
          revoked_at?: string | null;
          scope?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      groomer_profiles: {
        Row: {
          accepts_cats: boolean | null;
          accepts_dogs: boolean | null;
          accepts_long_hair: boolean | null;
          address: string | null;
          avg_rating: number | null;
          base_price_clp: number | null;
          bio: string | null;
          business_name: string | null;
          city: string | null;
          commune: string | null;
          created_at: string | null;
          experience_years: number | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          mobile_service: boolean | null;
          service_areas: string[] | null;
          services_offered: string[] | null;
          status: string | null;
          total_reviews: number | null;
          total_services: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          accepts_cats?: boolean | null;
          accepts_dogs?: boolean | null;
          accepts_long_hair?: boolean | null;
          address?: string | null;
          avg_rating?: number | null;
          base_price_clp?: number | null;
          bio?: string | null;
          business_name?: string | null;
          city?: string | null;
          commune?: string | null;
          created_at?: string | null;
          experience_years?: number | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          mobile_service?: boolean | null;
          service_areas?: string[] | null;
          services_offered?: string[] | null;
          status?: string | null;
          total_reviews?: number | null;
          total_services?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          accepts_cats?: boolean | null;
          accepts_dogs?: boolean | null;
          accepts_long_hair?: boolean | null;
          address?: string | null;
          avg_rating?: number | null;
          base_price_clp?: number | null;
          bio?: string | null;
          business_name?: string | null;
          city?: string | null;
          commune?: string | null;
          created_at?: string | null;
          experience_years?: number | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          mobile_service?: boolean | null;
          service_areas?: string[] | null;
          services_offered?: string[] | null;
          status?: string | null;
          total_reviews?: number | null;
          total_services?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'groomer_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'groomer_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      guardian_levels: {
        Row: {
          badge_icon: string | null;
          bonus_multiplier: number | null;
          created_at: string;
          description: string | null;
          id: string;
          level_name: string;
          level_number: number;
          max_points: number;
          min_points: number;
        };
        Insert: {
          badge_icon?: string | null;
          bonus_multiplier?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          level_name: string;
          level_number: number;
          max_points: number;
          min_points?: number;
        };
        Update: {
          badge_icon?: string | null;
          bonus_multiplier?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          level_name?: string;
          level_number?: number;
          max_points?: number;
          min_points?: number;
        };
        Relationships: [];
      };
      ip_request_quota: {
        Row: {
          count: number;
          ip: string;
          scope: string;
          updated_at: string;
          window_start: string;
        };
        Insert: {
          count?: number;
          ip: string;
          scope?: string;
          updated_at?: string;
          window_start?: string;
        };
        Update: {
          count?: number;
          ip?: string;
          scope?: string;
          updated_at?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      lost_pets: {
        Row: {
          breed: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          description: string;
          found_at: string | null;
          found_by: string | null;
          id: string;
          is_active: boolean | null;
          last_seen_date: string;
          last_seen_location: string;
          latitude: number | null;
          longitude: number | null;
          pet_id: string | null;
          pet_name: string;
          photo_url: string | null;
          report_type: string;
          reporter_id: string;
          reward_amount: number | null;
          reward_offered: boolean | null;
          species: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          breed?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description: string;
          found_at?: string | null;
          found_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_seen_date: string;
          last_seen_location: string;
          latitude?: number | null;
          longitude?: number | null;
          pet_id?: string | null;
          pet_name: string;
          photo_url?: string | null;
          report_type: string;
          reporter_id: string;
          reward_amount?: number | null;
          reward_offered?: boolean | null;
          species: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          breed?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description?: string;
          found_at?: string | null;
          found_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_seen_date?: string;
          last_seen_location?: string;
          latitude?: number | null;
          longitude?: number | null;
          pet_id?: string | null;
          pet_name?: string;
          photo_url?: string | null;
          report_type?: string;
          reporter_id?: string;
          reward_amount?: number | null;
          reward_offered?: boolean | null;
          species?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lost_pets_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lost_pets_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lost_pets_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      medical_documents: {
        Row: {
          created_at: string | null;
          file_size: number | null;
          file_url: string;
          id: string;
          issued_at: string | null;
          mime_type: string | null;
          notes: string | null;
          owner_id: string;
          pet_id: string;
          title: string;
          type: string;
          uploaded_by_role: string | null;
        };
        Insert: {
          created_at?: string | null;
          file_size?: number | null;
          file_url: string;
          id?: string;
          issued_at?: string | null;
          mime_type?: string | null;
          notes?: string | null;
          owner_id: string;
          pet_id: string;
          title: string;
          type: string;
          uploaded_by_role?: string | null;
        };
        Update: {
          created_at?: string | null;
          file_size?: number | null;
          file_url?: string;
          id?: string;
          issued_at?: string | null;
          mime_type?: string | null;
          notes?: string | null;
          owner_id?: string;
          pet_id?: string;
          title?: string;
          type?: string;
          uploaded_by_role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'medical_documents_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      medical_records: {
        Row: {
          antiparasitic_type: string | null;
          batch_number: string | null;
          booking_id: string | null;
          booking_type: string | null;
          clinic_name: string | null;
          created_at: string;
          date: string;
          description: string | null;
          diagnosis: string | null;
          document_url: string | null;
          id: string;
          next_checkup_date: string | null;
          next_date: string | null;
          notes: string | null;
          owner_id: string;
          pet_id: string;
          product_brand: string | null;
          reason: string | null;
          record_type: string;
          recorded_at: string | null;
          serial_number: string | null;
          title: string;
          treatment: Json | null;
          updated_at: string;
          vet_name: string | null;
          veterinarian_name: string | null;
          visit_date: string | null;
        };
        Insert: {
          antiparasitic_type?: string | null;
          batch_number?: string | null;
          booking_id?: string | null;
          booking_type?: string | null;
          clinic_name?: string | null;
          created_at?: string;
          date: string;
          description?: string | null;
          diagnosis?: string | null;
          document_url?: string | null;
          id?: string;
          next_checkup_date?: string | null;
          next_date?: string | null;
          notes?: string | null;
          owner_id: string;
          pet_id: string;
          product_brand?: string | null;
          reason?: string | null;
          record_type: string;
          recorded_at?: string | null;
          serial_number?: string | null;
          title: string;
          treatment?: Json | null;
          updated_at?: string;
          vet_name?: string | null;
          veterinarian_name?: string | null;
          visit_date?: string | null;
        };
        Update: {
          antiparasitic_type?: string | null;
          batch_number?: string | null;
          booking_id?: string | null;
          booking_type?: string | null;
          clinic_name?: string | null;
          created_at?: string;
          date?: string;
          description?: string | null;
          diagnosis?: string | null;
          document_url?: string | null;
          id?: string;
          next_checkup_date?: string | null;
          next_date?: string | null;
          notes?: string | null;
          owner_id?: string;
          pet_id?: string;
          product_brand?: string | null;
          reason?: string | null;
          record_type?: string;
          recorded_at?: string | null;
          serial_number?: string | null;
          title?: string;
          treatment?: Json | null;
          updated_at?: string;
          vet_name?: string | null;
          veterinarian_name?: string | null;
          visit_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'medical_records_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'vet_bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medical_records_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medical_records_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medical_records_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      medical_share_tokens: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          is_revoked: boolean | null;
          last_accessed_at: string | null;
          owner_id: string;
          pet_id: string;
          target_provider_id: string | null;
          token: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          is_revoked?: boolean | null;
          last_accessed_at?: string | null;
          owner_id: string;
          pet_id: string;
          target_provider_id?: string | null;
          token: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          is_revoked?: boolean | null;
          last_accessed_at?: string | null;
          owner_id?: string;
          pet_id?: string;
          target_provider_id?: string | null;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'medical_share_tokens_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medical_share_tokens_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medical_share_tokens_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medical_share_tokens_target_provider_id_fkey';
            columns: ['target_provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medical_share_tokens_target_provider_id_fkey';
            columns: ['target_provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      memorial_events: {
        Row: {
          content: string | null;
          created_at: string | null;
          event_type: string;
          id: string;
          media_url: string | null;
          metadata: Json | null;
          owner_id: string;
          pet_id: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string | null;
          event_type: string;
          id?: string;
          media_url?: string | null;
          metadata?: Json | null;
          owner_id: string;
          pet_id: string;
        };
        Update: {
          content?: string | null;
          created_at?: string | null;
          event_type?: string;
          id?: string;
          media_url?: string | null;
          metadata?: Json | null;
          owner_id?: string;
          pet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memorial_events_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      missions: {
        Row: {
          action_type: string;
          code: string;
          created_at: string;
          description: string;
          end_date: string | null;
          id: string;
          is_active: boolean;
          mission_type: string;
          name: string;
          points_reward: number;
          start_date: string | null;
          target_count: number;
        };
        Insert: {
          action_type: string;
          code: string;
          created_at?: string;
          description: string;
          end_date?: string | null;
          id?: string;
          is_active?: boolean;
          mission_type: string;
          name: string;
          points_reward?: number;
          start_date?: string | null;
          target_count?: number;
        };
        Update: {
          action_type?: string;
          code?: string;
          created_at?: string;
          description?: string;
          end_date?: string | null;
          id?: string;
          is_active?: boolean;
          mission_type?: string;
          name?: string;
          points_reward?: number;
          start_date?: string | null;
          target_count?: number;
        };
        Relationships: [];
      };
      nose_print_test_sessions: {
        Row: {
          avg_quality_score: number | null;
          created_at: string;
          embedding_generated: boolean | null;
          id: string;
          notes: string | null;
          num_frames_captured: number;
          num_frames_uploaded: number;
          num_valid_frames: number | null;
          owner_email: string | null;
          owner_location: string | null;
          owner_name: string;
          pet_age_months: number | null;
          pet_breed: string | null;
          pet_name: string;
          pet_sex: string | null;
          pet_species: string;
          photo_urls: Json;
          processed_at: string | null;
          processing_status: string;
          protocol_version: string;
          screen_resolution: string | null;
          user_agent: string | null;
        };
        Insert: {
          avg_quality_score?: number | null;
          created_at?: string;
          embedding_generated?: boolean | null;
          id?: string;
          notes?: string | null;
          num_frames_captured?: number;
          num_frames_uploaded?: number;
          num_valid_frames?: number | null;
          owner_email?: string | null;
          owner_location?: string | null;
          owner_name: string;
          pet_age_months?: number | null;
          pet_breed?: string | null;
          pet_name: string;
          pet_sex?: string | null;
          pet_species: string;
          photo_urls?: Json;
          processed_at?: string | null;
          processing_status?: string;
          protocol_version?: string;
          screen_resolution?: string | null;
          user_agent?: string | null;
        };
        Update: {
          avg_quality_score?: number | null;
          created_at?: string;
          embedding_generated?: boolean | null;
          id?: string;
          notes?: string | null;
          num_frames_captured?: number;
          num_frames_uploaded?: number;
          num_valid_frames?: number | null;
          owner_email?: string | null;
          owner_location?: string | null;
          owner_name?: string;
          pet_age_months?: number | null;
          pet_breed?: string | null;
          pet_name?: string;
          pet_sex?: string | null;
          pet_species?: string;
          photo_urls?: Json;
          processed_at?: string | null;
          processing_status?: string;
          protocol_version?: string;
          screen_resolution?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      notification_attempts: {
        Row: {
          attempted_at: string;
          booking_id: string | null;
          booking_type: string | null;
          channel: string;
          delivered_at: string | null;
          error_message: string | null;
          external_id: string | null;
          id: string;
          metadata: Json | null;
          read_at: string | null;
          recipient_contact: string | null;
          recipient_id: string | null;
          reminder_type: string;
          status: string;
        };
        Insert: {
          attempted_at?: string;
          booking_id?: string | null;
          booking_type?: string | null;
          channel: string;
          delivered_at?: string | null;
          error_message?: string | null;
          external_id?: string | null;
          id?: string;
          metadata?: Json | null;
          read_at?: string | null;
          recipient_contact?: string | null;
          recipient_id?: string | null;
          reminder_type: string;
          status: string;
        };
        Update: {
          attempted_at?: string;
          booking_id?: string | null;
          booking_type?: string | null;
          channel?: string;
          delivered_at?: string | null;
          error_message?: string | null;
          external_id?: string | null;
          id?: string;
          metadata?: Json | null;
          read_at?: string | null;
          recipient_contact?: string | null;
          recipient_id?: string | null;
          reminder_type?: string;
          status?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          created_at: string | null;
          email_enabled: boolean | null;
          id: string;
          marketing_notifications: boolean | null;
          push_enabled: boolean | null;
          reminder_notifications: boolean | null;
          social_notifications: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          marketing_notifications?: boolean | null;
          push_enabled?: boolean | null;
          reminder_notifications?: boolean | null;
          social_notifications?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          marketing_notifications?: boolean | null;
          push_enabled?: boolean | null;
          reminder_notifications?: boolean | null;
          social_notifications?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          action_url: string | null;
          body: string;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          reference_id: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          body: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          reference_id?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          body?: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          reference_id?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          address: string | null;
          booking_created: boolean | null;
          booking_id: string | null;
          created_at: string;
          duration_minutes: number;
          id: string;
          latitude: number | null;
          longitude: number | null;
          order_id: string;
          pet_ids: string[];
          platform_fee_clp: number;
          provider_amount_clp: number;
          provider_id: string;
          scheduled_date: string;
          service_details: Json | null;
          service_type: string;
          special_instructions: string | null;
          unit_price_clp: number;
        };
        Insert: {
          address?: string | null;
          booking_created?: boolean | null;
          booking_id?: string | null;
          created_at?: string;
          duration_minutes: number;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          order_id: string;
          pet_ids: string[];
          platform_fee_clp: number;
          provider_amount_clp: number;
          provider_id: string;
          scheduled_date: string;
          service_details?: Json | null;
          service_type: string;
          special_instructions?: string | null;
          unit_price_clp: number;
        };
        Update: {
          address?: string | null;
          booking_created?: boolean | null;
          booking_id?: string | null;
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          order_id?: string;
          pet_ids?: string[];
          platform_fee_clp?: number;
          provider_amount_clp?: number;
          provider_id?: string;
          scheduled_date?: string;
          service_details?: Json | null;
          service_type?: string;
          special_instructions?: string | null;
          unit_price_clp?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string;
          id: string;
          order_number: string;
          paid_at: string | null;
          payment_method: string;
          payment_status: string;
          platform_fee_clp: number;
          subtotal_clp: number;
          total_clp: number;
          updated_at: string;
          user_id: string;
          webpay_order_id: string | null;
          webpay_response: Json | null;
          webpay_token: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_number: string;
          paid_at?: string | null;
          payment_method?: string;
          payment_status?: string;
          platform_fee_clp: number;
          subtotal_clp: number;
          total_clp: number;
          updated_at?: string;
          user_id: string;
          webpay_order_id?: string | null;
          webpay_response?: Json | null;
          webpay_token?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_number?: string;
          paid_at?: string | null;
          payment_method?: string;
          payment_status?: string;
          platform_fee_clp?: number;
          subtotal_clp?: number;
          total_clp?: number;
          updated_at?: string;
          user_id?: string;
          webpay_order_id?: string | null;
          webpay_response?: Json | null;
          webpay_token?: string | null;
        };
        Relationships: [];
      };
      owner_audio_notes: {
        Row: {
          audio_mime_type: string | null;
          audio_url: string;
          created_at: string;
          duration_seconds: number | null;
          error_message: string | null;
          event_at: string;
          id: string;
          location_name: string | null;
          owner_id: string;
          pet_id: string;
          processing_status: Database['public']['Enums']['audio_note_processing_status'];
          retry_count: number;
          reviewed_at: string | null;
          size_bytes: number | null;
          structured_at: string | null;
          structured_data: Json | null;
          timeline_event_id: string | null;
          transcribed_at: string | null;
          transcript: string | null;
          updated_at: string;
        };
        Insert: {
          audio_mime_type?: string | null;
          audio_url: string;
          created_at?: string;
          duration_seconds?: number | null;
          error_message?: string | null;
          event_at: string;
          id?: string;
          location_name?: string | null;
          owner_id: string;
          pet_id: string;
          processing_status?: Database['public']['Enums']['audio_note_processing_status'];
          retry_count?: number;
          reviewed_at?: string | null;
          size_bytes?: number | null;
          structured_at?: string | null;
          structured_data?: Json | null;
          timeline_event_id?: string | null;
          transcribed_at?: string | null;
          transcript?: string | null;
          updated_at?: string;
        };
        Update: {
          audio_mime_type?: string | null;
          audio_url?: string;
          created_at?: string;
          duration_seconds?: number | null;
          error_message?: string | null;
          event_at?: string;
          id?: string;
          location_name?: string | null;
          owner_id?: string;
          pet_id?: string;
          processing_status?: Database['public']['Enums']['audio_note_processing_status'];
          retry_count?: number;
          reviewed_at?: string | null;
          size_bytes?: number | null;
          structured_at?: string | null;
          structured_data?: Json | null;
          timeline_event_id?: string | null;
          transcribed_at?: string | null;
          transcript?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'owner_audio_notes_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'owner_audio_notes_timeline_event_id_fkey';
            columns: ['timeline_event_id'];
            isOneToOne: false;
            referencedRelation: 'pet_timeline_events';
            referencedColumns: ['id'];
          },
        ];
      };
      partner_submissions: {
        Row: {
          categoria: string;
          ciudad: string | null;
          comuna: string | null;
          created_at: string | null;
          descripcion: string | null;
          direccion: string | null;
          email: string;
          horario: string | null;
          id: string;
          instagram: string | null;
          nombre_contacto: string;
          nombre_negocio: string;
          notas_admin: string | null;
          servicios_ofrecidos: string[] | null;
          status: string | null;
          telefono: string | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          categoria: string;
          ciudad?: string | null;
          comuna?: string | null;
          created_at?: string | null;
          descripcion?: string | null;
          direccion?: string | null;
          email: string;
          horario?: string | null;
          id?: string;
          instagram?: string | null;
          nombre_contacto: string;
          nombre_negocio: string;
          notas_admin?: string | null;
          servicios_ofrecidos?: string[] | null;
          status?: string | null;
          telefono?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          categoria?: string;
          ciudad?: string | null;
          comuna?: string | null;
          created_at?: string | null;
          descripcion?: string | null;
          direccion?: string | null;
          email?: string;
          horario?: string | null;
          id?: string;
          instagram?: string | null;
          nombre_contacto?: string;
          nombre_negocio?: string;
          notas_admin?: string | null;
          servicios_ofrecidos?: string[] | null;
          status?: string | null;
          telefono?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      partners: {
        Row: {
          ad_image_url: string | null;
          ad_link: string;
          ad_text: string;
          address: string | null;
          brand_name: string;
          category: string;
          city: string | null;
          clicks: number | null;
          commune: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string | null;
          end_date: string | null;
          id: string;
          impressions: number | null;
          is_active: boolean | null;
          latitude: number | null;
          longitude: number | null;
          placement: string;
          priority: number | null;
          social_media: Json | null;
          start_date: string | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          ad_image_url?: string | null;
          ad_link: string;
          ad_text: string;
          address?: string | null;
          brand_name: string;
          category: string;
          city?: string | null;
          clicks?: number | null;
          commune?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          impressions?: number | null;
          is_active?: boolean | null;
          latitude?: number | null;
          longitude?: number | null;
          placement: string;
          priority?: number | null;
          social_media?: Json | null;
          start_date?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          ad_image_url?: string | null;
          ad_link?: string;
          ad_text?: string;
          address?: string | null;
          brand_name?: string;
          category?: string;
          city?: string | null;
          clicks?: number | null;
          commune?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          impressions?: number | null;
          is_active?: boolean | null;
          latitude?: number | null;
          longitude?: number | null;
          placement?: string;
          priority?: number | null;
          social_media?: Json | null;
          start_date?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      paw_badges: {
        Row: {
          badge_key: string;
          category: string;
          created_at: string;
          description: string;
          icon: string | null;
          id: string;
          name: string;
          points_bonus: number | null;
          rarity: string | null;
          unlock_condition: string;
          unlock_value: number | null;
        };
        Insert: {
          badge_key: string;
          category: string;
          created_at?: string;
          description: string;
          icon?: string | null;
          id?: string;
          name: string;
          points_bonus?: number | null;
          rarity?: string | null;
          unlock_condition: string;
          unlock_value?: number | null;
        };
        Update: {
          badge_key?: string;
          category?: string;
          created_at?: string;
          description?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          points_bonus?: number | null;
          rarity?: string | null;
          unlock_condition?: string;
          unlock_value?: number | null;
        };
        Relationships: [];
      };
      paw_card_collections: {
        Row: {
          collected_at: string | null;
          collector_id: string;
          id: string;
          pet_id: string;
        };
        Insert: {
          collected_at?: string | null;
          collector_id: string;
          id?: string;
          pet_id: string;
        };
        Update: {
          collected_at?: string | null;
          collector_id?: string;
          id?: string;
          pet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'paw_card_collections_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      paw_companys: {
        Row: {
          contact_email: string | null;
          created_at: string;
          description: string | null;
          featured: boolean;
          id: string;
          is_active: boolean;
          is_founder: boolean;
          logo_url: string | null;
          monthly_clp: number | null;
          name: string;
          notes: string | null;
          partnership_type: string;
          paw_member_discount: string | null;
          slug: string;
          started_at: string | null;
          status: string;
          tier: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          contact_email?: string | null;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          is_active?: boolean;
          is_founder?: boolean;
          logo_url?: string | null;
          monthly_clp?: number | null;
          name: string;
          notes?: string | null;
          partnership_type?: string;
          paw_member_discount?: string | null;
          slug: string;
          started_at?: string | null;
          status?: string;
          tier?: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          contact_email?: string | null;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          is_active?: boolean;
          is_founder?: boolean;
          logo_url?: string | null;
          monthly_clp?: number | null;
          name?: string;
          notes?: string | null;
          partnership_type?: string;
          paw_member_discount?: string | null;
          slug?: string;
          started_at?: string | null;
          status?: string;
          tier?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      paw_game_monthly_rankings: {
        Row: {
          created_at: string | null;
          id: string;
          month: number;
          rank: number;
          total_points: number;
          user_id: string;
          year: number;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          month: number;
          rank: number;
          total_points?: number;
          user_id: string;
          year: number;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          month?: number;
          rank?: number;
          total_points?: number;
          user_id?: string;
          year?: number;
        };
        Relationships: [];
      };
      paw_missions: {
        Row: {
          achievement_title: string;
          category: string;
          created_at: string | null;
          description: string;
          icon: string;
          id: string;
          is_active: boolean | null;
          requirement_type: string;
          requirement_value: Json;
          sort_order: number | null;
          title: string;
        };
        Insert: {
          achievement_title: string;
          category: string;
          created_at?: string | null;
          description: string;
          icon: string;
          id: string;
          is_active?: boolean | null;
          requirement_type: string;
          requirement_value: Json;
          sort_order?: number | null;
          title: string;
        };
        Update: {
          achievement_title?: string;
          category?: string;
          created_at?: string | null;
          description?: string;
          icon?: string;
          id?: string;
          is_active?: boolean | null;
          requirement_type?: string;
          requirement_value?: Json;
          sort_order?: number | null;
          title?: string;
        };
        Relationships: [];
      };
      paw_point_transactions: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          points_amount: number;
          source_id: string | null;
          source_type: string;
          transaction_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          points_amount: number;
          source_id?: string | null;
          source_type: string;
          transaction_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          points_amount?: number;
          source_id?: string | null;
          source_type?: string;
          transaction_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      paw_shop_rewards: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          discount_percentage: number | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          partner_name: string | null;
          points_cost: number;
          service_type: string | null;
          stock: number | null;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          discount_percentage?: number | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          partner_name?: string | null;
          points_cost: number;
          service_type?: string | null;
          stock?: number | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          discount_percentage?: number | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          partner_name?: string | null;
          points_cost?: number;
          service_type?: string | null;
          stock?: number | null;
        };
        Relationships: [];
      };
      paw_voices: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          contact_email: string | null;
          created_at: string;
          featured: boolean;
          followers_estimated: number | null;
          handle: string | null;
          id: string;
          is_founder: boolean;
          name: string;
          notes: string | null;
          platform: string;
          profile_url: string | null;
          slug: string;
          speciality: string | null;
          started_at: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          contact_email?: string | null;
          created_at?: string;
          featured?: boolean;
          followers_estimated?: number | null;
          handle?: string | null;
          id?: string;
          is_founder?: boolean;
          name: string;
          notes?: string | null;
          platform?: string;
          profile_url?: string | null;
          slug: string;
          speciality?: string | null;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          contact_email?: string | null;
          created_at?: string;
          featured?: boolean;
          followers_estimated?: number | null;
          handle?: string | null;
          id?: string;
          is_founder?: boolean;
          name?: string;
          notes?: string | null;
          platform?: string;
          profile_url?: string | null;
          slug?: string;
          speciality?: string | null;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          error_message: string | null;
          flow_token: string;
          outcome: string | null;
          payload_summary: Json;
          processed_at: string | null;
          received_at: string;
          status_code: number;
        };
        Insert: {
          error_message?: string | null;
          flow_token: string;
          outcome?: string | null;
          payload_summary?: Json;
          processed_at?: string | null;
          received_at?: string;
          status_code: number;
        };
        Update: {
          error_message?: string | null;
          flow_token?: string;
          outcome?: string | null;
          payload_summary?: Json;
          processed_at?: string | null;
          received_at?: string;
          status_code?: number;
        };
        Relationships: [];
      };
      payment_history: {
        Row: {
          amount: number;
          commission: number | null;
          completed_at: string | null;
          created_at: string | null;
          description: string;
          id: string;
          net_amount: number;
          payment_method: string | null;
          payment_reference: string | null;
          payment_type: string;
          reference_id: string | null;
          refunded_at: string | null;
          status: string;
          user_id: string;
          webpay_response: Json | null;
        };
        Insert: {
          amount: number;
          commission?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          description: string;
          id?: string;
          net_amount: number;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_type: string;
          reference_id?: string | null;
          refunded_at?: string | null;
          status?: string;
          user_id: string;
          webpay_response?: Json | null;
        };
        Update: {
          amount?: number;
          commission?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          description?: string;
          id?: string;
          net_amount?: number;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_type?: string;
          reference_id?: string | null;
          refunded_at?: string | null;
          status?: string;
          user_id?: string;
          webpay_response?: Json | null;
        };
        Relationships: [];
      };
      payment_reminders_log: {
        Row: {
          amount: number;
          booking_id: string;
          channel: string;
          id: string;
          owner_id: string | null;
          provider_id: string;
          sent_at: string;
        };
        Insert: {
          amount: number;
          booking_id: string;
          channel?: string;
          id?: string;
          owner_id?: string | null;
          provider_id: string;
          sent_at?: string;
        };
        Update: {
          amount?: number;
          booking_id?: string;
          channel?: string;
          id?: string;
          owner_id?: string | null;
          provider_id?: string;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_reminders_log_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'vet_bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_reminders_log_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_reminders_log_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_request_quota: {
        Row: {
          count: number;
          updated_at: string;
          user_id: string;
          window_start: string;
        };
        Insert: {
          count?: number;
          updated_at?: string;
          user_id: string;
          window_start?: string;
        };
        Update: {
          count?: number;
          updated_at?: string;
          user_id?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      pending_reviews: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          expires_at: string;
          id: string;
          notification_sent_at: string | null;
          pet_id: string | null;
          target_type: string;
          target_user_id: string;
          transaction_id: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          notification_sent_at?: string | null;
          pet_id?: string | null;
          target_type?: string;
          target_user_id: string;
          transaction_id: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          notification_sent_at?: string | null;
          pet_id?: string | null;
          target_type?: string;
          target_user_id?: string;
          transaction_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pending_reviews_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      periodic_reports: {
        Row: {
          content_jsonb: Json;
          created_at: string | null;
          id: string;
          pdf_url: string | null;
          period_end: string;
          period_start: string;
          report_type: string;
          sent_email_at: string | null;
          sent_push_at: string | null;
          user_id: string;
          viewed_at: string | null;
        };
        Insert: {
          content_jsonb?: Json;
          created_at?: string | null;
          id?: string;
          pdf_url?: string | null;
          period_end: string;
          period_start: string;
          report_type: string;
          sent_email_at?: string | null;
          sent_push_at?: string | null;
          user_id: string;
          viewed_at?: string | null;
        };
        Update: {
          content_jsonb?: Json;
          created_at?: string | null;
          id?: string;
          pdf_url?: string | null;
          period_end?: string;
          period_start?: string;
          report_type?: string;
          sent_email_at?: string | null;
          sent_push_at?: string | null;
          user_id?: string;
          viewed_at?: string | null;
        };
        Relationships: [];
      };
      pet_activities: {
        Row: {
          activity_type: string;
          cheers_count: number;
          created_at: string;
          id: string;
          metadata: Json;
          owner_id: string;
          pet_id: string;
          title: string;
        };
        Insert: {
          activity_type: string;
          cheers_count?: number;
          created_at?: string;
          id?: string;
          metadata?: Json;
          owner_id: string;
          pet_id: string;
          title: string;
        };
        Update: {
          activity_type?: string;
          cheers_count?: number;
          created_at?: string;
          id?: string;
          metadata?: Json;
          owner_id?: string;
          pet_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pet_activities_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      pet_activity_cheers: {
        Row: {
          activity_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pet_activity_cheers_activity_id_fkey';
            columns: ['activity_id'];
            isOneToOne: false;
            referencedRelation: 'pet_activities';
            referencedColumns: ['id'];
          },
        ];
      };
      pet_co_owners: {
        Row: {
          accepted_at: string | null;
          id: string;
          invitation_token: string | null;
          invited_at: string;
          invited_by: string | null;
          invited_email: string | null;
          permissions: string[];
          pet_id: string;
          role: string;
          status: string;
          user_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          id?: string;
          invitation_token?: string | null;
          invited_at?: string;
          invited_by?: string | null;
          invited_email?: string | null;
          permissions?: string[];
          pet_id: string;
          role?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          accepted_at?: string | null;
          id?: string;
          invitation_token?: string | null;
          invited_at?: string;
          invited_by?: string | null;
          invited_email?: string | null;
          permissions?: string[];
          pet_id?: string;
          role?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pet_co_owners_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      pet_documents: {
        Row: {
          created_at: string;
          document_name: string;
          document_type: string;
          document_url: string;
          expiry_date: string | null;
          id: string;
          issued_date: string | null;
          issuer: string | null;
          notes: string | null;
          pet_id: string;
          reminder_days_before: number | null;
          reminder_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          document_name: string;
          document_type: string;
          document_url: string;
          expiry_date?: string | null;
          id?: string;
          issued_date?: string | null;
          issuer?: string | null;
          notes?: string | null;
          pet_id: string;
          reminder_days_before?: number | null;
          reminder_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          document_name?: string;
          document_type?: string;
          document_url?: string;
          expiry_date?: string | null;
          id?: string;
          issued_date?: string | null;
          issuer?: string | null;
          notes?: string | null;
          pet_id?: string;
          reminder_days_before?: number | null;
          reminder_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pet_documents_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      pet_id_cards: {
        Row: {
          card_number: string;
          created_at: string;
          default_qr_mode: string;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          issued_at: string;
          metadata: Json;
          pdf_url: string | null;
          pet_id: string;
          png_url: string | null;
          svg_url: string | null;
          updated_at: string;
          version: number;
          wallet_pass_url: string | null;
        };
        Insert: {
          card_number: string;
          created_at?: string;
          default_qr_mode?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          issued_at?: string;
          metadata?: Json;
          pdf_url?: string | null;
          pet_id: string;
          png_url?: string | null;
          svg_url?: string | null;
          updated_at?: string;
          version?: number;
          wallet_pass_url?: string | null;
        };
        Update: {
          card_number?: string;
          created_at?: string;
          default_qr_mode?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          issued_at?: string;
          metadata?: Json;
          pdf_url?: string | null;
          pet_id?: string;
          png_url?: string | null;
          svg_url?: string | null;
          updated_at?: string;
          version?: number;
          wallet_pass_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pet_id_cards_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      pet_paw_progress: {
        Row: {
          activity_score: number | null;
          created_at: string;
          happiness_score: number | null;
          health_score: number | null;
          id: string;
          last_vet_date: string | null;
          last_walk_date: string | null;
          pet_id: string;
          social_score: number | null;
          total_vet_visits: number | null;
          total_walks: number | null;
          updated_at: string;
          vaccines_up_to_date: boolean | null;
        };
        Insert: {
          activity_score?: number | null;
          created_at?: string;
          happiness_score?: number | null;
          health_score?: number | null;
          id?: string;
          last_vet_date?: string | null;
          last_walk_date?: string | null;
          pet_id: string;
          social_score?: number | null;
          total_vet_visits?: number | null;
          total_walks?: number | null;
          updated_at?: string;
          vaccines_up_to_date?: boolean | null;
        };
        Update: {
          activity_score?: number | null;
          created_at?: string;
          happiness_score?: number | null;
          health_score?: number | null;
          id?: string;
          last_vet_date?: string | null;
          last_walk_date?: string | null;
          pet_id?: string;
          social_score?: number | null;
          total_vet_visits?: number | null;
          total_walks?: number | null;
          updated_at?: string;
          vaccines_up_to_date?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pet_paw_progress_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: true;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      pet_reminders: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          description: string | null;
          due_date: string;
          id: string;
          is_completed: boolean | null;
          is_recurring: boolean | null;
          owner_id: string;
          pet_id: string;
          recurrence_interval: string | null;
          title: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date: string;
          id?: string;
          is_completed?: boolean | null;
          is_recurring?: boolean | null;
          owner_id: string;
          pet_id: string;
          recurrence_interval?: string | null;
          title: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string;
          id?: string;
          is_completed?: boolean | null;
          is_recurring?: boolean | null;
          owner_id?: string;
          pet_id?: string;
          recurrence_interval?: string | null;
          title?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pet_reminders_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pet_reminders_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pet_reminders_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      pet_routines: {
        Row: {
          category: string;
          created_at: string;
          days_of_week: number[];
          description: string | null;
          duration_minutes: number | null;
          ends_on: string | null;
          icon: string | null;
          id: string;
          is_active: boolean;
          notify_before_minutes: number | null;
          notify_channels: string[] | null;
          owner_id: string;
          pet_id: string;
          starts_on: string;
          time_of_day: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          days_of_week: number[];
          description?: string | null;
          duration_minutes?: number | null;
          ends_on?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          notify_before_minutes?: number | null;
          notify_channels?: string[] | null;
          owner_id: string;
          pet_id: string;
          starts_on?: string;
          time_of_day: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          days_of_week?: number[];
          description?: string | null;
          duration_minutes?: number | null;
          ends_on?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          notify_before_minutes?: number | null;
          notify_channels?: string[] | null;
          owner_id?: string;
          pet_id?: string;
          starts_on?: string;
          time_of_day?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pet_routines_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      pet_timeline_events: {
        Row: {
          category: Database['public']['Enums']['timeline_category'];
          created_at: string;
          data: Json | null;
          description: string | null;
          event_at: string;
          id: string;
          is_milestone: boolean;
          is_user_reported: boolean;
          location_geojson: Json | null;
          media_urls: Json | null;
          pet_id: string;
          recorded_at: string;
          recorded_by: string | null;
          related_record_id: string | null;
          related_record_table: string | null;
          source: Database['public']['Enums']['timeline_event_source'];
          title: string;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          category: Database['public']['Enums']['timeline_category'];
          created_at?: string;
          data?: Json | null;
          description?: string | null;
          event_at: string;
          id?: string;
          is_milestone?: boolean;
          is_user_reported?: boolean;
          location_geojson?: Json | null;
          media_urls?: Json | null;
          pet_id: string;
          recorded_at?: string;
          recorded_by?: string | null;
          related_record_id?: string | null;
          related_record_table?: string | null;
          source?: Database['public']['Enums']['timeline_event_source'];
          title: string;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          category?: Database['public']['Enums']['timeline_category'];
          created_at?: string;
          data?: Json | null;
          description?: string | null;
          event_at?: string;
          id?: string;
          is_milestone?: boolean;
          is_user_reported?: boolean;
          location_geojson?: Json | null;
          media_urls?: Json | null;
          pet_id?: string;
          recorded_at?: string;
          recorded_by?: string | null;
          related_record_id?: string | null;
          related_record_table?: string | null;
          source?: Database['public']['Enums']['timeline_event_source'];
          title?: string;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pet_timeline_events_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      pet_vet_links: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          owner_id: string;
          pet_id: string;
          provider_id: string;
          responded_at: string | null;
          revoked_at: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          owner_id: string;
          pet_id: string;
          provider_id: string;
          responded_at?: string | null;
          revoked_at?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          owner_id?: string;
          pet_id?: string;
          provider_id?: string;
          responded_at?: string | null;
          revoked_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pet_vet_links_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pet_vet_links_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pet_vet_links_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pet_vet_links_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pet_vet_links_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      pets: {
        Row: {
          activity_level: string | null;
          adoption_date: string | null;
          allergies: string[] | null;
          allergies_environmental: string[] | null;
          allergies_food: string[] | null;
          allergies_medication: string[] | null;
          behavior_notes: string | null;
          bio: string | null;
          birth_date: string | null;
          blood_type: string | null;
          breed: string | null;
          chip_registry: string | null;
          chronic_conditions: string[] | null;
          chronic_conditions_detail: Json | null;
          cohabitation_children: boolean | null;
          cohabitation_pets: number | null;
          color: string | null;
          created_at: string;
          created_by_shelter_id: string | null;
          created_by_vet_id: string | null;
          current_medications: Json | null;
          diet_brand: string | null;
          diet_frequency: string | null;
          diet_type: string | null;
          emergency_vet_name: string | null;
          emergency_vet_phone: string | null;
          gender: string | null;
          holo_pattern: string;
          id: string;
          insurance_policy: string | null;
          insurance_provider: string | null;
          is_adopted: boolean | null;
          is_public: boolean | null;
          last_vet_visit: string | null;
          lifecycle_status: string;
          living_environment: string | null;
          medical_notes: string | null;
          memorial_message: string | null;
          memorial_photo_url: string | null;
          memorial_remembrance_enabled: boolean | null;
          memorial_undo_until: string | null;
          memorial_visibility: string | null;
          microchip_number: string | null;
          name: string;
          neutered: boolean | null;
          neutered_date: string | null;
          owner_id: string | null;
          owner_invitation_accepted_at: string | null;
          owner_invitation_sent_at: string | null;
          owner_invitation_token: string | null;
          passed_away_at: string | null;
          passed_away_cause: string | null;
          passed_away_registered_at: string | null;
          paw_card_id: string;
          pending_owner_email: string | null;
          pending_owner_name: string | null;
          personality: string[] | null;
          photo_url: string | null;
          preferred_clinic: string | null;
          qr_token: string | null;
          shelter_adopted_at: string | null;
          shelter_intake_at: string | null;
          shelter_notes: string | null;
          shelter_source_label: string | null;
          size: string | null;
          special_needs: string | null;
          species: string;
          updated_at: string;
          vaccination_status: string | null;
          weight: number | null;
          weight_history: Json | null;
        };
        Insert: {
          activity_level?: string | null;
          adoption_date?: string | null;
          allergies?: string[] | null;
          allergies_environmental?: string[] | null;
          allergies_food?: string[] | null;
          allergies_medication?: string[] | null;
          behavior_notes?: string | null;
          bio?: string | null;
          birth_date?: string | null;
          blood_type?: string | null;
          breed?: string | null;
          chip_registry?: string | null;
          chronic_conditions?: string[] | null;
          chronic_conditions_detail?: Json | null;
          cohabitation_children?: boolean | null;
          cohabitation_pets?: number | null;
          color?: string | null;
          created_at?: string;
          created_by_shelter_id?: string | null;
          created_by_vet_id?: string | null;
          current_medications?: Json | null;
          diet_brand?: string | null;
          diet_frequency?: string | null;
          diet_type?: string | null;
          emergency_vet_name?: string | null;
          emergency_vet_phone?: string | null;
          gender?: string | null;
          holo_pattern?: string;
          id?: string;
          insurance_policy?: string | null;
          insurance_provider?: string | null;
          is_adopted?: boolean | null;
          is_public?: boolean | null;
          last_vet_visit?: string | null;
          lifecycle_status?: string;
          living_environment?: string | null;
          medical_notes?: string | null;
          memorial_message?: string | null;
          memorial_photo_url?: string | null;
          memorial_remembrance_enabled?: boolean | null;
          memorial_undo_until?: string | null;
          memorial_visibility?: string | null;
          microchip_number?: string | null;
          name: string;
          neutered?: boolean | null;
          neutered_date?: string | null;
          owner_id?: string | null;
          owner_invitation_accepted_at?: string | null;
          owner_invitation_sent_at?: string | null;
          owner_invitation_token?: string | null;
          passed_away_at?: string | null;
          passed_away_cause?: string | null;
          passed_away_registered_at?: string | null;
          paw_card_id: string;
          pending_owner_email?: string | null;
          pending_owner_name?: string | null;
          personality?: string[] | null;
          photo_url?: string | null;
          preferred_clinic?: string | null;
          qr_token?: string | null;
          shelter_adopted_at?: string | null;
          shelter_intake_at?: string | null;
          shelter_notes?: string | null;
          shelter_source_label?: string | null;
          size?: string | null;
          special_needs?: string | null;
          species: string;
          updated_at?: string;
          vaccination_status?: string | null;
          weight?: number | null;
          weight_history?: Json | null;
        };
        Update: {
          activity_level?: string | null;
          adoption_date?: string | null;
          allergies?: string[] | null;
          allergies_environmental?: string[] | null;
          allergies_food?: string[] | null;
          allergies_medication?: string[] | null;
          behavior_notes?: string | null;
          bio?: string | null;
          birth_date?: string | null;
          blood_type?: string | null;
          breed?: string | null;
          chip_registry?: string | null;
          chronic_conditions?: string[] | null;
          chronic_conditions_detail?: Json | null;
          cohabitation_children?: boolean | null;
          cohabitation_pets?: number | null;
          color?: string | null;
          created_at?: string;
          created_by_shelter_id?: string | null;
          created_by_vet_id?: string | null;
          current_medications?: Json | null;
          diet_brand?: string | null;
          diet_frequency?: string | null;
          diet_type?: string | null;
          emergency_vet_name?: string | null;
          emergency_vet_phone?: string | null;
          gender?: string | null;
          holo_pattern?: string;
          id?: string;
          insurance_policy?: string | null;
          insurance_provider?: string | null;
          is_adopted?: boolean | null;
          is_public?: boolean | null;
          last_vet_visit?: string | null;
          lifecycle_status?: string;
          living_environment?: string | null;
          medical_notes?: string | null;
          memorial_message?: string | null;
          memorial_photo_url?: string | null;
          memorial_remembrance_enabled?: boolean | null;
          memorial_undo_until?: string | null;
          memorial_visibility?: string | null;
          microchip_number?: string | null;
          name?: string;
          neutered?: boolean | null;
          neutered_date?: string | null;
          owner_id?: string | null;
          owner_invitation_accepted_at?: string | null;
          owner_invitation_sent_at?: string | null;
          owner_invitation_token?: string | null;
          passed_away_at?: string | null;
          passed_away_cause?: string | null;
          passed_away_registered_at?: string | null;
          paw_card_id?: string;
          pending_owner_email?: string | null;
          pending_owner_name?: string | null;
          personality?: string[] | null;
          photo_url?: string | null;
          preferred_clinic?: string | null;
          qr_token?: string | null;
          shelter_adopted_at?: string | null;
          shelter_intake_at?: string | null;
          shelter_notes?: string | null;
          shelter_source_label?: string | null;
          size?: string | null;
          special_needs?: string | null;
          species?: string;
          updated_at?: string;
          vaccination_status?: string | null;
          weight?: number | null;
          weight_history?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pets_created_by_shelter_id_fkey';
            columns: ['created_by_shelter_id'];
            isOneToOne: false;
            referencedRelation: 'adoption_centers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pets_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pets_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      pitch_applications: {
        Row: {
          admin_notes: string | null;
          approved_entity_id: string | null;
          approved_entity_table: string | null;
          contact_email: string;
          contact_name: string;
          contact_phone: string | null;
          created_at: string;
          id: string;
          kind: string;
          message: string | null;
          organization_name: string | null;
          payload: Json | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          source_url: string | null;
          status: string;
          updated_at: string;
          user_agent: string | null;
          website: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          approved_entity_id?: string | null;
          approved_entity_table?: string | null;
          contact_email: string;
          contact_name: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          message?: string | null;
          organization_name?: string | null;
          payload?: Json | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_url?: string | null;
          status?: string;
          updated_at?: string;
          user_agent?: string | null;
          website?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          approved_entity_id?: string | null;
          approved_entity_table?: string | null;
          contact_email?: string;
          contact_name?: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          message?: string | null;
          organization_name?: string | null;
          payload?: Json | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_url?: string | null;
          status?: string;
          updated_at?: string;
          user_agent?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      places: {
        Row: {
          address: string;
          amenities: string[] | null;
          created_at: string;
          description: string | null;
          id: string;
          is_verified: boolean | null;
          latitude: number;
          longitude: number;
          name: string;
          opening_hours: Json | null;
          phone: string | null;
          photos: string[] | null;
          place_type: string;
          price_range: string | null;
          rating: number | null;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address: string;
          amenities?: string[] | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_verified?: boolean | null;
          latitude: number;
          longitude: number;
          name: string;
          opening_hours?: Json | null;
          phone?: string | null;
          photos?: string[] | null;
          place_type: string;
          price_range?: string | null;
          rating?: number | null;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address?: string;
          amenities?: string[] | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_verified?: boolean | null;
          latitude?: number;
          longitude?: number;
          name?: string;
          opening_hours?: Json | null;
          phone?: string | null;
          photos?: string[] | null;
          place_type?: string;
          price_range?: string | null;
          rating?: number | null;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      platform_config: {
        Row: {
          config_key: string;
          config_value: Json;
          created_at: string;
          description: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          config_key: string;
          config_value: Json;
          created_at?: string;
          description?: string | null;
          id?: string;
          updated_at?: string;
        };
        Update: {
          config_key?: string;
          config_value?: Json;
          created_at?: string;
          description?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      points_history_deprecated_20260424: {
        Row: {
          action_id: string | null;
          action_type: string;
          created_at: string;
          description: string | null;
          id: string;
          points: number;
          user_id: string;
        };
        Insert: {
          action_id?: string | null;
          action_type: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          points: number;
          user_id: string;
        };
        Update: {
          action_id?: string | null;
          action_type?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          points?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      post_adoption_checkins: {
        Row: {
          created_at: string;
          error_message: string | null;
          id: string;
          milestone_days: number;
          owner_email: string;
          owner_id: string | null;
          pet_id: string;
          responded_at: string | null;
          response_notes: string | null;
          response_score: number | null;
          scheduled_at: string;
          sent_at: string | null;
          shelter_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          milestone_days: number;
          owner_email: string;
          owner_id?: string | null;
          pet_id: string;
          responded_at?: string | null;
          response_notes?: string | null;
          response_score?: number | null;
          scheduled_at: string;
          sent_at?: string | null;
          shelter_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          milestone_days?: number;
          owner_email?: string;
          owner_id?: string | null;
          pet_id?: string;
          responded_at?: string | null;
          response_notes?: string | null;
          response_score?: number | null;
          scheduled_at?: string;
          sent_at?: string | null;
          shelter_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_adoption_checkins_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_adoption_checkins_shelter_id_fkey';
            columns: ['shelter_id'];
            isOneToOne: false;
            referencedRelation: 'adoption_centers';
            referencedColumns: ['id'];
          },
        ];
      };
      post_comments: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          post_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          post_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          post_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_comments_user_id_profiles_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_comments_user_id_profiles_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      post_likes: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      post_saves: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_saves_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      posts: {
        Row: {
          comments_count: number | null;
          content: string;
          created_at: string | null;
          extra_data: Json | null;
          id: string;
          image_url: string | null;
          likes_count: number | null;
          pet_id: string | null;
          post_type: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          comments_count?: number | null;
          content: string;
          created_at?: string | null;
          extra_data?: Json | null;
          id?: string;
          image_url?: string | null;
          likes_count?: number | null;
          pet_id?: string | null;
          post_type?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          comments_count?: number | null;
          content?: string;
          created_at?: string | null;
          extra_data?: Json | null;
          id?: string;
          image_url?: string | null;
          likes_count?: number | null;
          pet_id?: string | null;
          post_type?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          active_title: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          is_admin: boolean;
          is_demo: boolean;
          is_grandfathered: boolean;
          is_premium: boolean | null;
          level: number;
          location: string | null;
          onboarding_completed_at: string | null;
          phone: string | null;
          plan_badge: string | null;
          plan_expires_at: string | null;
          plan_id: string | null;
          points: number;
          premium_end_date: string | null;
          premium_expires_at: string | null;
          premium_plan: string | null;
          premium_start_date: string | null;
          report_preferences: Json | null;
          sidebar_tutorial_progress: Json | null;
          total_adoptions: number;
          total_bookings: number;
          total_lost_pet_help: number;
          total_posts: number;
          total_reviews: number;
          updated_at: string;
          whatsapp_number: string | null;
          whatsapp_opted_in: boolean;
          whatsapp_opted_in_at: string | null;
        };
        Insert: {
          active_title?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          is_admin?: boolean;
          is_demo?: boolean;
          is_grandfathered?: boolean;
          is_premium?: boolean | null;
          level?: number;
          location?: string | null;
          onboarding_completed_at?: string | null;
          phone?: string | null;
          plan_badge?: string | null;
          plan_expires_at?: string | null;
          plan_id?: string | null;
          points?: number;
          premium_end_date?: string | null;
          premium_expires_at?: string | null;
          premium_plan?: string | null;
          premium_start_date?: string | null;
          report_preferences?: Json | null;
          sidebar_tutorial_progress?: Json | null;
          total_adoptions?: number;
          total_bookings?: number;
          total_lost_pet_help?: number;
          total_posts?: number;
          total_reviews?: number;
          updated_at?: string;
          whatsapp_number?: string | null;
          whatsapp_opted_in?: boolean;
          whatsapp_opted_in_at?: string | null;
        };
        Update: {
          active_title?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_admin?: boolean;
          is_demo?: boolean;
          is_grandfathered?: boolean;
          is_premium?: boolean | null;
          level?: number;
          location?: string | null;
          onboarding_completed_at?: string | null;
          phone?: string | null;
          plan_badge?: string | null;
          plan_expires_at?: string | null;
          plan_id?: string | null;
          points?: number;
          premium_end_date?: string | null;
          premium_expires_at?: string | null;
          premium_plan?: string | null;
          premium_start_date?: string | null;
          report_preferences?: Json | null;
          sidebar_tutorial_progress?: Json | null;
          total_adoptions?: number;
          total_bookings?: number;
          total_lost_pet_help?: number;
          total_posts?: number;
          total_reviews?: number;
          updated_at?: string;
          whatsapp_number?: string | null;
          whatsapp_opted_in?: boolean;
          whatsapp_opted_in_at?: string | null;
        };
        Relationships: [];
      };
      provider_availability: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          is_available: boolean;
          notes: string | null;
          provider_type: string;
          time_slots: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          is_available?: boolean;
          notes?: string | null;
          provider_type: string;
          time_slots: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          is_available?: boolean;
          notes?: string | null;
          provider_type?: string;
          time_slots?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      provider_availability_exceptions: {
        Row: {
          created_at: string;
          end_time: string | null;
          exception_date: string;
          exception_type: string;
          id: string;
          provider_id: string;
          reason: string | null;
          start_time: string | null;
        };
        Insert: {
          created_at?: string;
          end_time?: string | null;
          exception_date: string;
          exception_type: string;
          id?: string;
          provider_id: string;
          reason?: string | null;
          start_time?: string | null;
        };
        Update: {
          created_at?: string;
          end_time?: string | null;
          exception_date?: string;
          exception_type?: string;
          id?: string;
          provider_id?: string;
          reason?: string | null;
          start_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'provider_availability_exceptions_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'provider_availability_exceptions_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      provider_availability_rules: {
        Row: {
          buffer_minutes: number;
          capacity: number;
          created_at: string;
          day_of_week: number;
          end_time: string;
          id: string;
          is_active: boolean;
          is_emergency_slot: boolean;
          max_advance_days: number;
          min_lead_time_minutes: number;
          provider_id: string;
          service_type: string | null;
          slot_duration_minutes: number;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          buffer_minutes?: number;
          capacity?: number;
          created_at?: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          is_active?: boolean;
          is_emergency_slot?: boolean;
          max_advance_days?: number;
          min_lead_time_minutes?: number;
          provider_id: string;
          service_type?: string | null;
          slot_duration_minutes?: number;
          start_time: string;
          updated_at?: string;
        };
        Update: {
          buffer_minutes?: number;
          capacity?: number;
          created_at?: string;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_active?: boolean;
          is_emergency_slot?: boolean;
          max_advance_days?: number;
          min_lead_time_minutes?: number;
          provider_id?: string;
          service_type?: string | null;
          slot_duration_minutes?: number;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'provider_availability_rules_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'provider_availability_rules_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      provider_balances: {
        Row: {
          available_balance_clp: number;
          created_at: string;
          id: string;
          pending_balance_clp: number;
          provider_id: string;
          total_earned_clp: number;
          total_withdrawn_clp: number;
          updated_at: string;
        };
        Insert: {
          available_balance_clp?: number;
          created_at?: string;
          id?: string;
          pending_balance_clp?: number;
          provider_id: string;
          total_earned_clp?: number;
          total_withdrawn_clp?: number;
          updated_at?: string;
        };
        Update: {
          available_balance_clp?: number;
          created_at?: string;
          id?: string;
          pending_balance_clp?: number;
          provider_id?: string;
          total_earned_clp?: number;
          total_withdrawn_clp?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      provider_resources: {
        Row: {
          color: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          provider_id: string;
          type: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          provider_id: string;
          type?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          provider_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'provider_resources_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'provider_resources_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      provider_service_offerings: {
        Row: {
          accepted_pet_sizes: string[] | null;
          accepts_puppies: boolean | null;
          accepts_senior_pets: boolean | null;
          created_at: string;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          is_active: boolean | null;
          max_pets: number | null;
          price_base: number;
          price_per_additional_pet: number | null;
          price_unit: string | null;
          provider_id: string;
          requires_pre_check_in: boolean;
          service_type: string;
          services_included: Json | null;
          slug: string | null;
          specialties: Json | null;
          updated_at: string;
        };
        Insert: {
          accepted_pet_sizes?: string[] | null;
          accepts_puppies?: boolean | null;
          accepts_senior_pets?: boolean | null;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_active?: boolean | null;
          max_pets?: number | null;
          price_base: number;
          price_per_additional_pet?: number | null;
          price_unit?: string | null;
          provider_id: string;
          requires_pre_check_in?: boolean;
          service_type: string;
          services_included?: Json | null;
          slug?: string | null;
          specialties?: Json | null;
          updated_at?: string;
        };
        Update: {
          accepted_pet_sizes?: string[] | null;
          accepts_puppies?: boolean | null;
          accepts_senior_pets?: boolean | null;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_active?: boolean | null;
          max_pets?: number | null;
          price_base?: number;
          price_per_additional_pet?: number | null;
          price_unit?: string | null;
          provider_id?: string;
          requires_pre_check_in?: boolean;
          service_type?: string;
          services_included?: Json | null;
          slug?: string | null;
          specialties?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'provider_service_offerings_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'provider_service_offerings_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      provider_subscriptions: {
        Row: {
          billing_cycle: string | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan_id: string;
          price: number;
          provider_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          billing_cycle?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_id: string;
          price?: number;
          provider_id: string;
          status?: string;
          user_id: string;
        };
        Update: {
          billing_cycle?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_id?: string;
          price?: number;
          provider_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      provider_verifications: {
        Row: {
          created_at: string | null;
          credential_image_url: string | null;
          id: string;
          license_number: string;
          provider_id: string;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string | null;
        };
        Insert: {
          created_at?: string | null;
          credential_image_url?: string | null;
          id?: string;
          license_number: string;
          provider_id: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          credential_image_url?: string | null;
          id?: string;
          license_number?: string;
          provider_id?: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'provider_verifications_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'provider_verifications_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'provider_verifications_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'provider_verifications_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      review_helpful_votes: {
        Row: {
          created_at: string | null;
          id: string;
          review_id: string;
          review_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          review_id: string;
          review_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          review_id?: string;
          review_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      review_invitations: {
        Row: {
          client_email: string | null;
          client_name: string | null;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          invitation_token: string;
          is_used: boolean | null;
          provider_id: string;
        };
        Insert: {
          client_email?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          invitation_token: string;
          is_used?: boolean | null;
          provider_id: string;
        };
        Update: {
          client_email?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          invitation_token?: string;
          is_used?: boolean | null;
          provider_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_invitations_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_invitations_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      rewards: {
        Row: {
          created_at: string;
          description: string | null;
          expiry_days: number | null;
          id: string;
          is_active: boolean;
          name: string;
          partner_logo: string | null;
          partner_name: string | null;
          points_cost: number;
          reward_type: string;
          stock: number | null;
          terms: string | null;
          value: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          expiry_days?: number | null;
          id?: string;
          is_active?: boolean;
          name: string;
          partner_logo?: string | null;
          partner_name?: string | null;
          points_cost: number;
          reward_type: string;
          stock?: number | null;
          terms?: string | null;
          value?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          expiry_days?: number | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          partner_logo?: string | null;
          partner_name?: string | null;
          points_cost?: number;
          reward_type?: string;
          stock?: number | null;
          terms?: string | null;
          value?: string | null;
        };
        Relationships: [];
      };
      routine_completions: {
        Row: {
          completed_at: string;
          completed_date: string;
          id: string;
          notes: string | null;
          routine_id: string;
          skip_reason: string | null;
          skipped: boolean;
        };
        Insert: {
          completed_at?: string;
          completed_date: string;
          id?: string;
          notes?: string | null;
          routine_id: string;
          skip_reason?: string | null;
          skipped?: boolean;
        };
        Update: {
          completed_at?: string;
          completed_date?: string;
          id?: string;
          notes?: string | null;
          routine_id?: string;
          skip_reason?: string | null;
          skipped?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'routine_completions_routine_id_fkey';
            columns: ['routine_id'];
            isOneToOne: false;
            referencedRelation: 'pet_routines';
            referencedColumns: ['id'];
          },
        ];
      };
      service_promotions: {
        Row: {
          ai_moderation_score: Json | null;
          created_at: string;
          description: string;
          id: string;
          images: string[] | null;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          service_type: string;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_moderation_score?: Json | null;
          created_at?: string;
          description: string;
          id?: string;
          images?: string[] | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          service_type: string;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_moderation_score?: Json | null;
          created_at?: string;
          description?: string;
          id?: string;
          images?: string[] | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          service_type?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      service_providers: {
        Row: {
          accepts_cats: boolean | null;
          accepts_dogs: boolean | null;
          accepts_emergency: boolean | null;
          accepts_long_hair: boolean | null;
          address: string | null;
          available_hours: Json | null;
          avatar_url: string | null;
          avg_rating: number | null;
          base_price_clp: number | null;
          bio: string | null;
          business_name: string | null;
          certifications: Json | null;
          city: string | null;
          commune: string | null;
          coverage_radius_km: number | null;
          coverage_zones: Json | null;
          created_at: string;
          directory_views: number | null;
          display_name: string | null;
          emergency_available: boolean | null;
          emergency_phone: string | null;
          emergency_surcharge_pct: number | null;
          excellence_badge_at: string | null;
          experience_years: number | null;
          featured_until: string | null;
          id: string;
          is_demo: boolean;
          is_directory_visible: boolean | null;
          is_featured: boolean | null;
          is_verified: boolean | null;
          latitude: number | null;
          license_number: string | null;
          longitude: number | null;
          max_weekly_slots: number | null;
          mobile_service: boolean | null;
          opening_hours: Json | null;
          photos: string[] | null;
          plan_billing_cycle: string | null;
          plan_cancelled_at: string | null;
          plan_expires_at: string | null;
          plan_next_billing_at: string | null;
          plan_started_at: string | null;
          price_from: number | null;
          primary_service_type: string | null;
          provider_plan: string | null;
          provider_type: string | null;
          public_email: string | null;
          public_phone: string | null;
          rating: number | null;
          rejection_reason: string | null;
          service_areas: string[] | null;
          services_offered: string[] | null;
          slug: string | null;
          specialties: string[] | null;
          status: string | null;
          timezone: string;
          total_reviews: number | null;
          total_services_completed: number | null;
          updated_at: string;
          user_id: string;
          verification_documents: string[] | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          accepts_cats?: boolean | null;
          accepts_dogs?: boolean | null;
          accepts_emergency?: boolean | null;
          accepts_long_hair?: boolean | null;
          address?: string | null;
          available_hours?: Json | null;
          avatar_url?: string | null;
          avg_rating?: number | null;
          base_price_clp?: number | null;
          bio?: string | null;
          business_name?: string | null;
          certifications?: Json | null;
          city?: string | null;
          commune?: string | null;
          coverage_radius_km?: number | null;
          coverage_zones?: Json | null;
          created_at?: string;
          directory_views?: number | null;
          display_name?: string | null;
          emergency_available?: boolean | null;
          emergency_phone?: string | null;
          emergency_surcharge_pct?: number | null;
          excellence_badge_at?: string | null;
          experience_years?: number | null;
          featured_until?: string | null;
          id?: string;
          is_demo?: boolean;
          is_directory_visible?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          latitude?: number | null;
          license_number?: string | null;
          longitude?: number | null;
          max_weekly_slots?: number | null;
          mobile_service?: boolean | null;
          opening_hours?: Json | null;
          photos?: string[] | null;
          plan_billing_cycle?: string | null;
          plan_cancelled_at?: string | null;
          plan_expires_at?: string | null;
          plan_next_billing_at?: string | null;
          plan_started_at?: string | null;
          price_from?: number | null;
          primary_service_type?: string | null;
          provider_plan?: string | null;
          provider_type?: string | null;
          public_email?: string | null;
          public_phone?: string | null;
          rating?: number | null;
          rejection_reason?: string | null;
          service_areas?: string[] | null;
          services_offered?: string[] | null;
          slug?: string | null;
          specialties?: string[] | null;
          status?: string | null;
          timezone?: string;
          total_reviews?: number | null;
          total_services_completed?: number | null;
          updated_at?: string;
          user_id: string;
          verification_documents?: string[] | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          accepts_cats?: boolean | null;
          accepts_dogs?: boolean | null;
          accepts_emergency?: boolean | null;
          accepts_long_hair?: boolean | null;
          address?: string | null;
          available_hours?: Json | null;
          avatar_url?: string | null;
          avg_rating?: number | null;
          base_price_clp?: number | null;
          bio?: string | null;
          business_name?: string | null;
          certifications?: Json | null;
          city?: string | null;
          commune?: string | null;
          coverage_radius_km?: number | null;
          coverage_zones?: Json | null;
          created_at?: string;
          directory_views?: number | null;
          display_name?: string | null;
          emergency_available?: boolean | null;
          emergency_phone?: string | null;
          emergency_surcharge_pct?: number | null;
          excellence_badge_at?: string | null;
          experience_years?: number | null;
          featured_until?: string | null;
          id?: string;
          is_demo?: boolean;
          is_directory_visible?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          latitude?: number | null;
          license_number?: string | null;
          longitude?: number | null;
          max_weekly_slots?: number | null;
          mobile_service?: boolean | null;
          opening_hours?: Json | null;
          photos?: string[] | null;
          plan_billing_cycle?: string | null;
          plan_cancelled_at?: string | null;
          plan_expires_at?: string | null;
          plan_next_billing_at?: string | null;
          plan_started_at?: string | null;
          price_from?: number | null;
          primary_service_type?: string | null;
          provider_plan?: string | null;
          provider_type?: string | null;
          public_email?: string | null;
          public_phone?: string | null;
          rating?: number | null;
          rejection_reason?: string | null;
          service_areas?: string[] | null;
          services_offered?: string[] | null;
          slug?: string | null;
          specialties?: string[] | null;
          status?: string | null;
          timezone?: string;
          total_reviews?: number | null;
          total_services_completed?: number | null;
          updated_at?: string;
          user_id?: string;
          verification_documents?: string[] | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [];
      };
      service_reviews: {
        Row: {
          booking_id: string | null;
          comment: string | null;
          created_at: string | null;
          id: string;
          invitation_id: string | null;
          is_visible: boolean;
          provider_id: string;
          provider_responded_at: string | null;
          provider_response: string | null;
          rating: number;
          reviewer_id: string;
          service_type: string;
          title: string | null;
          updated_at: string | null;
          verification_type: string | null;
        };
        Insert: {
          booking_id?: string | null;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          invitation_id?: string | null;
          is_visible?: boolean;
          provider_id: string;
          provider_responded_at?: string | null;
          provider_response?: string | null;
          rating: number;
          reviewer_id: string;
          service_type: string;
          title?: string | null;
          updated_at?: string | null;
          verification_type?: string | null;
        };
        Update: {
          booking_id?: string | null;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          invitation_id?: string | null;
          is_visible?: boolean;
          provider_id?: string;
          provider_responded_at?: string | null;
          provider_response?: string | null;
          rating?: number;
          reviewer_id?: string;
          service_type?: string;
          title?: string | null;
          updated_at?: string | null;
          verification_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_reviews_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_reviews_invitation_id_fkey';
            columns: ['invitation_id'];
            isOneToOne: false;
            referencedRelation: 'review_invitations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_reviews_reviewer_id_profiles_fkey';
            columns: ['reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_reviews_reviewer_id_profiles_fkey';
            columns: ['reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      service_slots: {
        Row: {
          created_at: string | null;
          current_bookings: number;
          description: string | null;
          end_time: string;
          id: string;
          is_active: boolean;
          max_capacity: number;
          price: number;
          provider_id: string;
          service_type: string;
          slot_date: string;
          start_time: string;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          current_bookings?: number;
          description?: string | null;
          end_time: string;
          id?: string;
          is_active?: boolean;
          max_capacity?: number;
          price: number;
          provider_id: string;
          service_type: string;
          slot_date: string;
          start_time: string;
          title: string;
        };
        Update: {
          created_at?: string | null;
          current_bookings?: number;
          description?: string | null;
          end_time?: string;
          id?: string;
          is_active?: boolean;
          max_capacity?: number;
          price?: number;
          provider_id?: string;
          service_type?: string;
          slot_date?: string;
          start_time?: string;
          title?: string;
        };
        Relationships: [];
      };
      shared_walk_participants: {
        Row: {
          id: string;
          joined_at: string;
          pet_ids: string[];
          status: string;
          user_id: string;
          walk_id: string;
        };
        Insert: {
          id?: string;
          joined_at?: string;
          pet_ids: string[];
          status?: string;
          user_id: string;
          walk_id: string;
        };
        Update: {
          id?: string;
          joined_at?: string;
          pet_ids?: string[];
          status?: string;
          user_id?: string;
          walk_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shared_walk_participants_walk_id_fkey';
            columns: ['walk_id'];
            isOneToOne: false;
            referencedRelation: 'shared_walks';
            referencedColumns: ['id'];
          },
        ];
      };
      shared_walks: {
        Row: {
          created_at: string;
          description: string | null;
          estimated_duration: number;
          id: string;
          max_participants: number;
          meeting_point: string;
          organizer_id: string;
          requirements: string | null;
          scheduled_date: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          estimated_duration: number;
          id?: string;
          max_participants?: number;
          meeting_point: string;
          organizer_id: string;
          requirements?: string | null;
          scheduled_date: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          estimated_duration?: number;
          id?: string;
          max_participants?: number;
          meeting_point?: string;
          organizer_id?: string;
          requirements?: string | null;
          scheduled_date?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          auto_renew: boolean | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          created_at: string | null;
          end_date: string;
          id: string;
          order_type: string | null;
          payment_amount_clp: number | null;
          payment_provider_id: string | null;
          plan_type: string;
          start_date: string;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          auto_renew?: boolean | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          end_date: string;
          id?: string;
          order_type?: string | null;
          payment_amount_clp?: number | null;
          payment_provider_id?: string | null;
          plan_type: string;
          start_date: string;
          status?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          auto_renew?: boolean | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          end_date?: string;
          id?: string;
          order_type?: string | null;
          payment_amount_clp?: number | null;
          payment_provider_id?: string | null;
          plan_type?: string;
          start_date?: string;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      system_health_log: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          execution_time_ms: number | null;
          function_name: string;
          id: string;
          metadata: Json | null;
          status: string;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          function_name: string;
          id?: string;
          metadata?: Json | null;
          status: string;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          function_name?: string;
          id?: string;
          metadata?: Json | null;
          status?: string;
        };
        Relationships: [];
      };
      trainer_profiles: {
        Row: {
          available_hours: Json;
          bio: string | null;
          certifications: Json | null;
          coverage_zones: Json;
          created_at: string;
          experience_years: number | null;
          id: string;
          is_active: boolean;
          is_verified: boolean;
          photos: string[] | null;
          price_per_session: number;
          rating: number | null;
          session_duration: number | null;
          specialties: Json | null;
          total_reviews: number | null;
          total_sessions: number | null;
          training_methods: string[] | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          available_hours: Json;
          bio?: string | null;
          certifications?: Json | null;
          coverage_zones: Json;
          created_at?: string;
          experience_years?: number | null;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          photos?: string[] | null;
          price_per_session: number;
          rating?: number | null;
          session_duration?: number | null;
          specialties?: Json | null;
          total_reviews?: number | null;
          total_sessions?: number | null;
          training_methods?: string[] | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          available_hours?: Json;
          bio?: string | null;
          certifications?: Json | null;
          coverage_zones?: Json;
          created_at?: string;
          experience_years?: number | null;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          photos?: string[] | null;
          price_per_session?: number;
          rating?: number | null;
          session_duration?: number | null;
          specialties?: Json | null;
          total_reviews?: number | null;
          total_sessions?: number | null;
          training_methods?: string[] | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      training_bookings: {
        Row: {
          behavioral_goals: string | null;
          canceled_at: string | null;
          canceled_by: string | null;
          cancellation_reason: string | null;
          confirmed_at: string | null;
          created_at: string;
          duration_minutes: number;
          end_time: string | null;
          google_event_id: string | null;
          id: string;
          owner_id: string;
          payment_status: string;
          pet_id: string;
          platform_fee_amount: number | null;
          provider_payout_amount: number | null;
          reminder_24h_sent: boolean | null;
          reminder_2h_sent: boolean | null;
          scheduled_date: string;
          special_notes: string | null;
          start_time: string | null;
          status: string;
          stripe_payment_intent_id: string | null;
          total_price: number;
          trainer_id: string;
          training_address: string;
          training_latitude: number | null;
          training_longitude: number | null;
          training_type: string;
          updated_at: string;
        };
        Insert: {
          behavioral_goals?: string | null;
          canceled_at?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          duration_minutes?: number;
          end_time?: string | null;
          google_event_id?: string | null;
          id?: string;
          owner_id: string;
          payment_status?: string;
          pet_id: string;
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          reminder_24h_sent?: boolean | null;
          reminder_2h_sent?: boolean | null;
          scheduled_date: string;
          special_notes?: string | null;
          start_time?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          total_price: number;
          trainer_id: string;
          training_address: string;
          training_latitude?: number | null;
          training_longitude?: number | null;
          training_type: string;
          updated_at?: string;
        };
        Update: {
          behavioral_goals?: string | null;
          canceled_at?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          duration_minutes?: number;
          end_time?: string | null;
          google_event_id?: string | null;
          id?: string;
          owner_id?: string;
          payment_status?: string;
          pet_id?: string;
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          reminder_24h_sent?: boolean | null;
          reminder_2h_sent?: boolean | null;
          scheduled_date?: string;
          special_notes?: string | null;
          start_time?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          total_price?: number;
          trainer_id?: string;
          training_address?: string;
          training_latitude?: number | null;
          training_longitude?: number | null;
          training_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_training_pet';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      training_reports: {
        Row: {
          behavioral_observations: string | null;
          booking_id: string;
          created_at: string;
          exercises_completed: Json | null;
          homework_assigned: string | null;
          id: string;
          next_session_goals: string | null;
          photos: string[] | null;
          progress_notes: string | null;
        };
        Insert: {
          behavioral_observations?: string | null;
          booking_id: string;
          created_at?: string;
          exercises_completed?: Json | null;
          homework_assigned?: string | null;
          id?: string;
          next_session_goals?: string | null;
          photos?: string[] | null;
          progress_notes?: string | null;
        };
        Update: {
          behavioral_observations?: string | null;
          booking_id?: string;
          created_at?: string;
          exercises_completed?: Json | null;
          homework_assigned?: string | null;
          id?: string;
          next_session_goals?: string | null;
          photos?: string[] | null;
          progress_notes?: string | null;
        };
        Relationships: [];
      };
      training_reviews: {
        Row: {
          booking_id: string;
          comment: string | null;
          created_at: string;
          helpful_count: number | null;
          id: string;
          is_verified: boolean | null;
          owner_id: string;
          photos: string[] | null;
          provider_response: string | null;
          provider_response_date: string | null;
          rating: number;
          trainer_id: string;
          updated_at: string | null;
        };
        Insert: {
          booking_id: string;
          comment?: string | null;
          created_at?: string;
          helpful_count?: number | null;
          id?: string;
          is_verified?: boolean | null;
          owner_id: string;
          photos?: string[] | null;
          provider_response?: string | null;
          provider_response_date?: string | null;
          rating: number;
          trainer_id: string;
          updated_at?: string | null;
        };
        Update: {
          booking_id?: string;
          comment?: string | null;
          created_at?: string;
          helpful_count?: number | null;
          id?: string;
          is_verified?: boolean | null;
          owner_id?: string;
          photos?: string[] | null;
          provider_response?: string | null;
          provider_response_date?: string | null;
          rating?: number;
          trainer_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_training_booking';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'training_bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      user_achievements: {
        Row: {
          id: string;
          mission_id: string;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_achievements_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'paw_missions';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activities: {
        Row: {
          activity_id: string;
          completed_at: string;
          id: string;
          notes: string | null;
          pet_id: string | null;
          photo_url: string | null;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          completed_at?: string;
          id?: string;
          notes?: string | null;
          pet_id?: string | null;
          photo_url?: string | null;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          completed_at?: string;
          id?: string;
          notes?: string | null;
          pet_id?: string | null;
          photo_url?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activities_activity_id_fkey';
            columns: ['activity_id'];
            isOneToOne: false;
            referencedRelation: 'activities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activities_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      user_blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
          id: string;
          reason: string | null;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
          id?: string;
          reason?: string | null;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
          id?: string;
          reason?: string | null;
        };
        Relationships: [];
      };
      user_challenges: {
        Row: {
          challenge_id: string;
          completed: boolean;
          completed_at: string | null;
          current_value: number;
          id: string;
          user_id: string;
        };
        Insert: {
          challenge_id: string;
          completed?: boolean;
          completed_at?: string | null;
          current_value?: number;
          id?: string;
          user_id: string;
        };
        Update: {
          challenge_id?: string;
          completed?: boolean;
          completed_at?: string | null;
          current_value?: number;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_challenges_challenge_id_fkey';
            columns: ['challenge_id'];
            isOneToOne: false;
            referencedRelation: 'daily_challenges';
            referencedColumns: ['id'];
          },
        ];
      };
      user_follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      user_guardian_progress: {
        Row: {
          created_at: string;
          current_level: number;
          current_level_points: number;
          id: string;
          last_activity_date: string | null;
          streak_days: number | null;
          total_paw_points: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_level?: number;
          current_level_points?: number;
          id?: string;
          last_activity_date?: string | null;
          streak_days?: number | null;
          total_paw_points?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_level?: number;
          current_level_points?: number;
          id?: string;
          last_activity_date?: string | null;
          streak_days?: number | null;
          total_paw_points?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_mission_progress: {
        Row: {
          assigned_date: string;
          completed_at: string | null;
          created_at: string;
          current_progress: number | null;
          expires_at: string | null;
          id: string;
          is_completed: boolean | null;
          mission_id: string;
          user_id: string;
        };
        Insert: {
          assigned_date?: string;
          completed_at?: string | null;
          created_at?: string;
          current_progress?: number | null;
          expires_at?: string | null;
          id?: string;
          is_completed?: boolean | null;
          mission_id: string;
          user_id: string;
        };
        Update: {
          assigned_date?: string;
          completed_at?: string | null;
          created_at?: string;
          current_progress?: number | null;
          expires_at?: string | null;
          id?: string;
          is_completed?: boolean | null;
          mission_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_missions: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          expires_at: string | null;
          id: string;
          mission_id: string;
          progress: number;
          started_at: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          expires_at?: string | null;
          id?: string;
          mission_id: string;
          progress?: number;
          started_at?: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          expires_at?: string | null;
          id?: string;
          mission_id?: string;
          progress?: number;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_missions_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
        ];
      };
      user_notification_prefs: {
        Row: {
          daily_digest_email: boolean;
          daily_digest_in_app: boolean;
          daily_digest_push: boolean;
          gamification_in_app: boolean;
          gamification_push: boolean;
          marketing_email: boolean;
          marketing_push: boolean;
          pet_reminders_email: boolean;
          pet_reminders_push: boolean;
          social_in_app: boolean;
          social_push: boolean;
          transactional_email: boolean;
          transactional_push: boolean;
          updated_at: string;
          user_id: string;
          weekly_digest_email: boolean;
          weekly_digest_push: boolean;
        };
        Insert: {
          daily_digest_email?: boolean;
          daily_digest_in_app?: boolean;
          daily_digest_push?: boolean;
          gamification_in_app?: boolean;
          gamification_push?: boolean;
          marketing_email?: boolean;
          marketing_push?: boolean;
          pet_reminders_email?: boolean;
          pet_reminders_push?: boolean;
          social_in_app?: boolean;
          social_push?: boolean;
          transactional_email?: boolean;
          transactional_push?: boolean;
          updated_at?: string;
          user_id: string;
          weekly_digest_email?: boolean;
          weekly_digest_push?: boolean;
        };
        Update: {
          daily_digest_email?: boolean;
          daily_digest_in_app?: boolean;
          daily_digest_push?: boolean;
          gamification_in_app?: boolean;
          gamification_push?: boolean;
          marketing_email?: boolean;
          marketing_push?: boolean;
          pet_reminders_email?: boolean;
          pet_reminders_push?: boolean;
          social_in_app?: boolean;
          social_push?: boolean;
          transactional_email?: boolean;
          transactional_push?: boolean;
          updated_at?: string;
          user_id?: string;
          weekly_digest_email?: boolean;
          weekly_digest_push?: boolean;
        };
        Relationships: [];
      };
      user_paw_badges: {
        Row: {
          badge_id: string;
          earned_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          badge_id: string;
          earned_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          badge_id?: string;
          earned_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_paw_badges_badge_id_fkey';
            columns: ['badge_id'];
            isOneToOne: false;
            referencedRelation: 'paw_badges';
            referencedColumns: ['id'];
          },
        ];
      };
      user_reports: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          report_type: string;
          reported_id: string;
          reporter_id: string;
          resolution_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          report_type: string;
          reported_id: string;
          reporter_id: string;
          resolution_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          report_type?: string;
          reported_id?: string;
          reporter_id?: string;
          resolution_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      user_rewards: {
        Row: {
          code: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          redeemed_at: string;
          reward_id: string;
          used: boolean;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          redeemed_at?: string;
          reward_id: string;
          used?: boolean;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          redeemed_at?: string;
          reward_id?: string;
          used?: boolean;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_rewards_reward_id_fkey';
            columns: ['reward_id'];
            isOneToOne: false;
            referencedRelation: 'rewards';
            referencedColumns: ['id'];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          user_id?: string;
        };
        Relationships: [];
      };
      user_routes: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          current_checkpoint: number;
          id: string;
          route_id: string;
          started_at: string;
          total_progress: number;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          current_checkpoint?: number;
          id?: string;
          route_id: string;
          started_at?: string;
          total_progress?: number;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          current_checkpoint?: number;
          id?: string;
          route_id?: string;
          started_at?: string;
          total_progress?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_routes_route_id_fkey';
            columns: ['route_id'];
            isOneToOne: false;
            referencedRelation: 'virtual_routes_deprecated_20260424';
            referencedColumns: ['id'];
          },
        ];
      };
      user_shop_redemptions: {
        Row: {
          expires_at: string | null;
          id: string;
          points_spent: number;
          redeemed_at: string;
          redemption_code: string | null;
          reward_id: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          expires_at?: string | null;
          id?: string;
          points_spent: number;
          redeemed_at?: string;
          redemption_code?: string | null;
          reward_id: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          expires_at?: string | null;
          id?: string;
          points_spent?: number;
          redeemed_at?: string;
          redemption_code?: string | null;
          reward_id?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_shop_redemptions_reward_id_fkey';
            columns: ['reward_id'];
            isOneToOne: false;
            referencedRelation: 'paw_shop_rewards';
            referencedColumns: ['id'];
          },
        ];
      };
      user_stats: {
        Row: {
          followers_count: number | null;
          following_count: number | null;
          level: number | null;
          pets_count: number | null;
          posts_count: number | null;
          total_points: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          followers_count?: number | null;
          following_count?: number | null;
          level?: number | null;
          pets_count?: number | null;
          posts_count?: number | null;
          total_points?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          followers_count?: number | null;
          following_count?: number | null;
          level?: number | null;
          pets_count?: number | null;
          posts_count?: number | null;
          total_points?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_stats_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_stats_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles_public';
            referencedColumns: ['id'];
          },
        ];
      };
      vaccination_protocols: {
        Row: {
          applies_from_age_months: number;
          created_at: string | null;
          frequency_months: number;
          id: string;
          is_mandatory: boolean | null;
          species: string;
          vaccine_name: string;
        };
        Insert: {
          applies_from_age_months?: number;
          created_at?: string | null;
          frequency_months: number;
          id?: string;
          is_mandatory?: boolean | null;
          species: string;
          vaccine_name: string;
        };
        Update: {
          applies_from_age_months?: number;
          created_at?: string | null;
          frequency_months?: number;
          id?: string;
          is_mandatory?: boolean | null;
          species?: string;
          vaccine_name?: string;
        };
        Relationships: [];
      };
      vaccine_schedule_doses: {
        Row: {
          apply_at_age_weeks: number | null;
          booster_after_age_weeks: number | null;
          category: string;
          created_at: string;
          dose_number: number;
          frequency_months: number | null;
          id: string;
          is_booster: boolean;
          is_mandatory: boolean;
          notes: string | null;
          species: string;
          vaccine_name: string;
        };
        Insert: {
          apply_at_age_weeks?: number | null;
          booster_after_age_weeks?: number | null;
          category: string;
          created_at?: string;
          dose_number?: number;
          frequency_months?: number | null;
          id?: string;
          is_booster?: boolean;
          is_mandatory?: boolean;
          notes?: string | null;
          species: string;
          vaccine_name: string;
        };
        Update: {
          apply_at_age_weeks?: number | null;
          booster_after_age_weeks?: number | null;
          category?: string;
          created_at?: string;
          dose_number?: number;
          frequency_months?: number | null;
          id?: string;
          is_booster?: boolean;
          is_mandatory?: boolean;
          notes?: string | null;
          species?: string;
          vaccine_name?: string;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          created_at: string;
          document_urls: string[] | null;
          documents: Json | null;
          id: string;
          notes: string | null;
          requested_role: Database['public']['Enums']['app_role'];
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          document_urls?: string[] | null;
          documents?: Json | null;
          id?: string;
          notes?: string | null;
          requested_role: Database['public']['Enums']['app_role'];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          document_urls?: string[] | null;
          documents?: Json | null;
          id?: string;
          notes?: string | null;
          requested_role?: Database['public']['Enums']['app_role'];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      vet_bookings: {
        Row: {
          canceled_at: string | null;
          canceled_by: string | null;
          cancellation_reason: string | null;
          commission_amount_clp: number | null;
          commission_calculated_at: string | null;
          commission_rate: number | null;
          confirmation_mode: string | null;
          confirmed_at: string | null;
          created_at: string;
          end_time: string | null;
          follow_up_booking_id: string | null;
          google_event_id: string | null;
          id: string;
          is_emergency: boolean;
          owner_id: string;
          payment_status: string;
          pet_id: string;
          platform_fee_amount: number | null;
          private_notes: string | null;
          provider_payout_amount: number | null;
          reminder_24h_sent: boolean | null;
          reminder_2h_sent: boolean | null;
          rescheduled_from: string | null;
          resource_id: string | null;
          scheduled_date: string;
          service_provider_id: string | null;
          service_type: string;
          slot_duration_minutes: number | null;
          start_time: string | null;
          started_at: string | null;
          status: string;
          stripe_payment_intent_id: string | null;
          symptoms: string | null;
          total_price: number | null;
          updated_at: string;
          vet_id: string | null;
          visit_address: string | null;
          visit_latitude: number | null;
          visit_longitude: number | null;
        };
        Insert: {
          canceled_at?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          commission_amount_clp?: number | null;
          commission_calculated_at?: string | null;
          commission_rate?: number | null;
          confirmation_mode?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          end_time?: string | null;
          follow_up_booking_id?: string | null;
          google_event_id?: string | null;
          id?: string;
          is_emergency?: boolean;
          owner_id: string;
          payment_status?: string;
          pet_id: string;
          platform_fee_amount?: number | null;
          private_notes?: string | null;
          provider_payout_amount?: number | null;
          reminder_24h_sent?: boolean | null;
          reminder_2h_sent?: boolean | null;
          rescheduled_from?: string | null;
          resource_id?: string | null;
          scheduled_date: string;
          service_provider_id?: string | null;
          service_type: string;
          slot_duration_minutes?: number | null;
          start_time?: string | null;
          started_at?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          symptoms?: string | null;
          total_price?: number | null;
          updated_at?: string;
          vet_id?: string | null;
          visit_address?: string | null;
          visit_latitude?: number | null;
          visit_longitude?: number | null;
        };
        Update: {
          canceled_at?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          commission_amount_clp?: number | null;
          commission_calculated_at?: string | null;
          commission_rate?: number | null;
          confirmation_mode?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          end_time?: string | null;
          follow_up_booking_id?: string | null;
          google_event_id?: string | null;
          id?: string;
          is_emergency?: boolean;
          owner_id?: string;
          payment_status?: string;
          pet_id?: string;
          platform_fee_amount?: number | null;
          private_notes?: string | null;
          provider_payout_amount?: number | null;
          reminder_24h_sent?: boolean | null;
          reminder_2h_sent?: boolean | null;
          rescheduled_from?: string | null;
          resource_id?: string | null;
          scheduled_date?: string;
          service_provider_id?: string | null;
          service_type?: string;
          slot_duration_minutes?: number | null;
          start_time?: string | null;
          started_at?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          symptoms?: string | null;
          total_price?: number | null;
          updated_at?: string;
          vet_id?: string | null;
          visit_address?: string | null;
          visit_latitude?: number | null;
          visit_longitude?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vet_bookings_follow_up_booking_id_fkey';
            columns: ['follow_up_booking_id'];
            isOneToOne: false;
            referencedRelation: 'vet_bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_bookings_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_bookings_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'provider_resources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_bookings_service_provider_id_fkey';
            columns: ['service_provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_bookings_service_provider_id_fkey';
            columns: ['service_provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      vet_clinical_notes: {
        Row: {
          alternative_offered: boolean | null;
          alternatives_discussed: string | null;
          booking_id: string | null;
          consultation_date: string | null;
          created_at: string;
          description: string | null;
          followup_date: string | null;
          followup_reason: string | null;
          followup_required: boolean | null;
          id: string;
          note_type: string;
          pet_id: string;
          provider_id: string;
          raw_transcript: string | null;
          recorded_at: string | null;
          share_token_id: string | null;
          source: string | null;
          title: string;
        };
        Insert: {
          alternative_offered?: boolean | null;
          alternatives_discussed?: string | null;
          booking_id?: string | null;
          consultation_date?: string | null;
          created_at?: string;
          description?: string | null;
          followup_date?: string | null;
          followup_reason?: string | null;
          followup_required?: boolean | null;
          id?: string;
          note_type: string;
          pet_id: string;
          provider_id: string;
          raw_transcript?: string | null;
          recorded_at?: string | null;
          share_token_id?: string | null;
          source?: string | null;
          title: string;
        };
        Update: {
          alternative_offered?: boolean | null;
          alternatives_discussed?: string | null;
          booking_id?: string | null;
          consultation_date?: string | null;
          created_at?: string;
          description?: string | null;
          followup_date?: string | null;
          followup_reason?: string | null;
          followup_required?: boolean | null;
          id?: string;
          note_type?: string;
          pet_id?: string;
          provider_id?: string;
          raw_transcript?: string | null;
          recorded_at?: string | null;
          share_token_id?: string | null;
          source?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vet_clinical_notes_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'vet_bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_clinical_notes_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_clinical_notes_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_clinical_notes_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_clinical_notes_share_token_id_fkey';
            columns: ['share_token_id'];
            isOneToOne: false;
            referencedRelation: 'medical_share_tokens';
            referencedColumns: ['id'];
          },
        ];
      };
      vet_documents: {
        Row: {
          booking_id: string;
          created_at: string;
          description: string | null;
          document_type: string;
          document_url: string;
          id: string;
          pet_id: string;
        };
        Insert: {
          booking_id: string;
          created_at?: string;
          description?: string | null;
          document_type: string;
          document_url: string;
          id?: string;
          pet_id: string;
        };
        Update: {
          booking_id?: string;
          created_at?: string;
          description?: string | null;
          document_type?: string;
          document_url?: string;
          id?: string;
          pet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vet_documents_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'vet_bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_documents_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      vet_pet_relationships_deprecated_20260424: {
        Row: {
          created_at: string | null;
          expires_at: string | null;
          granted_at: string | null;
          granted_by: string | null;
          id: string;
          notes: string | null;
          pet_id: string;
          relationship_type: Database['public']['Enums']['vet_pet_relationship_type'];
          revoked_at: string | null;
          revoked_by: string | null;
          updated_at: string | null;
          vet_id: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string | null;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          notes?: string | null;
          pet_id: string;
          relationship_type?: Database['public']['Enums']['vet_pet_relationship_type'];
          revoked_at?: string | null;
          revoked_by?: string | null;
          updated_at?: string | null;
          vet_id: string;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string | null;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          notes?: string | null;
          pet_id?: string;
          relationship_type?: Database['public']['Enums']['vet_pet_relationship_type'];
          revoked_at?: string | null;
          revoked_by?: string | null;
          updated_at?: string | null;
          vet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vet_pet_relationships_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      vet_profiles: {
        Row: {
          available_hours: Json;
          bio: string | null;
          certifications: Json | null;
          consultation_fee: number;
          coverage_zones: Json;
          created_at: string;
          emergency_available: boolean;
          emergency_fee: number | null;
          id: string;
          is_active: boolean;
          is_verified: boolean;
          license_number: string;
          photos: string[] | null;
          rating: number | null;
          services: Json;
          specialties: Json | null;
          total_reviews: number | null;
          total_visits: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          available_hours: Json;
          bio?: string | null;
          certifications?: Json | null;
          consultation_fee: number;
          coverage_zones: Json;
          created_at?: string;
          emergency_available?: boolean;
          emergency_fee?: number | null;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          license_number: string;
          photos?: string[] | null;
          rating?: number | null;
          services: Json;
          specialties?: Json | null;
          total_reviews?: number | null;
          total_visits?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          available_hours?: Json;
          bio?: string | null;
          certifications?: Json | null;
          consultation_fee?: number;
          coverage_zones?: Json;
          created_at?: string;
          emergency_available?: boolean;
          emergency_fee?: number | null;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          license_number?: string;
          photos?: string[] | null;
          rating?: number | null;
          services?: Json;
          specialties?: Json | null;
          total_reviews?: number | null;
          total_visits?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      vet_quick_notes: {
        Row: {
          color: string | null;
          content: string;
          created_at: string | null;
          id: string;
          pet_id: string;
          provider_id: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          content: string;
          created_at?: string | null;
          id?: string;
          pet_id: string;
          provider_id: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          pet_id?: string;
          provider_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vet_quick_notes_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_quick_notes_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_quick_notes_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      vet_reference_prices: {
        Row: {
          comuna: string;
          created_at: string | null;
          id: string;
          notes: string | null;
          price_max: number;
          price_min: number;
          service_label: string;
          service_type: string;
          source: string | null;
          species: string | null;
        };
        Insert: {
          comuna: string;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          price_max: number;
          price_min: number;
          service_label: string;
          service_type: string;
          source?: string | null;
          species?: string | null;
        };
        Update: {
          comuna?: string;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          price_max?: number;
          price_min?: number;
          service_label?: string;
          service_type?: string;
          source?: string | null;
          species?: string | null;
        };
        Relationships: [];
      };
      vet_reviews: {
        Row: {
          booking_id: string;
          comment: string | null;
          created_at: string;
          helpful_count: number | null;
          id: string;
          is_verified: boolean | null;
          owner_id: string;
          photos: string[] | null;
          provider_response: string | null;
          provider_response_date: string | null;
          rating: number;
          updated_at: string | null;
          vet_id: string;
        };
        Insert: {
          booking_id: string;
          comment?: string | null;
          created_at?: string;
          helpful_count?: number | null;
          id?: string;
          is_verified?: boolean | null;
          owner_id: string;
          photos?: string[] | null;
          provider_response?: string | null;
          provider_response_date?: string | null;
          rating: number;
          updated_at?: string | null;
          vet_id: string;
        };
        Update: {
          booking_id?: string;
          comment?: string | null;
          created_at?: string;
          helpful_count?: number | null;
          id?: string;
          is_verified?: boolean | null;
          owner_id?: string;
          photos?: string[] | null;
          provider_response?: string | null;
          provider_response_date?: string | null;
          rating?: number;
          updated_at?: string | null;
          vet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vet_reviews_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'vet_bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      vet_service_prices: {
        Row: {
          created_at: string | null;
          id: string;
          is_estimate: boolean | null;
          notes: string | null;
          price_clp: number;
          provider_id: string;
          service_type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_estimate?: boolean | null;
          notes?: string | null;
          price_clp: number;
          provider_id: string;
          service_type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_estimate?: boolean | null;
          notes?: string | null;
          price_clp?: number;
          provider_id?: string;
          service_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vet_service_prices_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_service_prices_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      vet_verification_results: {
        Row: {
          admin_notes: string | null;
          admin_override: boolean | null;
          auto_approved: boolean | null;
          confidence_score: number;
          created_at: string | null;
          document_quality: string | null;
          extracted_license: string | null;
          extracted_name: string | null;
          id: string;
          name_match_score: number | null;
          provider_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          admin_override?: boolean | null;
          auto_approved?: boolean | null;
          confidence_score: number;
          created_at?: string | null;
          document_quality?: string | null;
          extracted_license?: string | null;
          extracted_name?: string | null;
          id?: string;
          name_match_score?: number | null;
          provider_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          admin_override?: boolean | null;
          auto_approved?: boolean | null;
          confidence_score?: number;
          created_at?: string | null;
          document_quality?: string | null;
          extracted_license?: string | null;
          extracted_name?: string | null;
          id?: string;
          name_match_score?: number | null;
          provider_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vet_verification_results_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vet_verification_results_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      vet_visits: {
        Row: {
          booking_id: string;
          diagnosis: string | null;
          id: string;
          next_visit_recommendation: string | null;
          notes: string | null;
          prescriptions: Json | null;
          treatment: string | null;
          visited_at: string;
        };
        Insert: {
          booking_id: string;
          diagnosis?: string | null;
          id?: string;
          next_visit_recommendation?: string | null;
          notes?: string | null;
          prescriptions?: Json | null;
          treatment?: string | null;
          visited_at?: string;
        };
        Update: {
          booking_id?: string;
          diagnosis?: string | null;
          id?: string;
          next_visit_recommendation?: string | null;
          notes?: string | null;
          prescriptions?: Json | null;
          treatment?: string | null;
          visited_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vet_visits_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'vet_bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      virtual_routes_deprecated_20260424: {
        Row: {
          checkpoints: Json;
          created_at: string;
          description: string | null;
          difficulty: string;
          id: string;
          image_url: string | null;
          name: string;
          points: number;
          rewards: Json | null;
          total_distance: number;
        };
        Insert: {
          checkpoints: Json;
          created_at?: string;
          description?: string | null;
          difficulty?: string;
          id?: string;
          image_url?: string | null;
          name: string;
          points?: number;
          rewards?: Json | null;
          total_distance: number;
        };
        Update: {
          checkpoints?: Json;
          created_at?: string;
          description?: string | null;
          difficulty?: string;
          id?: string;
          image_url?: string | null;
          name?: string;
          points?: number;
          rewards?: Json | null;
          total_distance?: number;
        };
        Relationships: [];
      };
      walk_bookings: {
        Row: {
          canceled_at: string | null;
          canceled_by: string | null;
          cancellation_reason: string | null;
          confirmed_at: string | null;
          created_at: string;
          duration_minutes: number;
          end_time: string | null;
          google_event_id: string | null;
          id: string;
          owner_id: string;
          payment_status: string;
          pet_ids: string[];
          pickup_address: string;
          pickup_latitude: number | null;
          pickup_longitude: number | null;
          platform_fee_amount: number | null;
          provider_payout_amount: number | null;
          reminder_24h_sent: boolean | null;
          reminder_2h_sent: boolean | null;
          scheduled_date: string;
          service_type: string;
          special_instructions: string | null;
          start_time: string | null;
          status: string;
          stripe_payment_intent_id: string | null;
          total_price: number;
          updated_at: string;
          walker_id: string;
        };
        Insert: {
          canceled_at?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          duration_minutes: number;
          end_time?: string | null;
          google_event_id?: string | null;
          id?: string;
          owner_id: string;
          payment_status?: string;
          pet_ids: string[];
          pickup_address: string;
          pickup_latitude?: number | null;
          pickup_longitude?: number | null;
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          reminder_24h_sent?: boolean | null;
          reminder_2h_sent?: boolean | null;
          scheduled_date: string;
          service_type: string;
          special_instructions?: string | null;
          start_time?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          total_price: number;
          updated_at?: string;
          walker_id: string;
        };
        Update: {
          canceled_at?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          duration_minutes?: number;
          end_time?: string | null;
          google_event_id?: string | null;
          id?: string;
          owner_id?: string;
          payment_status?: string;
          pet_ids?: string[];
          pickup_address?: string;
          pickup_latitude?: number | null;
          pickup_longitude?: number | null;
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          reminder_24h_sent?: boolean | null;
          reminder_2h_sent?: boolean | null;
          scheduled_date?: string;
          service_type?: string;
          special_instructions?: string | null;
          start_time?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          total_price?: number;
          updated_at?: string;
          walker_id?: string;
        };
        Relationships: [];
      };
      walk_reports: {
        Row: {
          activities: Json | null;
          behavior_notes: string | null;
          booking_id: string;
          created_at: string;
          health_observations: string | null;
          id: string;
          photos: string[] | null;
        };
        Insert: {
          activities?: Json | null;
          behavior_notes?: string | null;
          booking_id: string;
          created_at?: string;
          health_observations?: string | null;
          id?: string;
          photos?: string[] | null;
        };
        Update: {
          activities?: Json | null;
          behavior_notes?: string | null;
          booking_id?: string;
          created_at?: string;
          health_observations?: string | null;
          id?: string;
          photos?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'walk_reports_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'walk_bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      walk_reviews: {
        Row: {
          booking_id: string;
          comment: string | null;
          created_at: string;
          helpful_count: number | null;
          id: string;
          is_verified: boolean | null;
          owner_id: string;
          photos: string[] | null;
          provider_response: string | null;
          provider_response_date: string | null;
          rating: number;
          updated_at: string | null;
          walker_id: string;
        };
        Insert: {
          booking_id: string;
          comment?: string | null;
          created_at?: string;
          helpful_count?: number | null;
          id?: string;
          is_verified?: boolean | null;
          owner_id: string;
          photos?: string[] | null;
          provider_response?: string | null;
          provider_response_date?: string | null;
          rating: number;
          updated_at?: string | null;
          walker_id: string;
        };
        Update: {
          booking_id?: string;
          comment?: string | null;
          created_at?: string;
          helpful_count?: number | null;
          id?: string;
          is_verified?: boolean | null;
          owner_id?: string;
          photos?: string[] | null;
          provider_response?: string | null;
          provider_response_date?: string | null;
          rating?: number;
          updated_at?: string | null;
          walker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'walk_reviews_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'walk_bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      walk_routes: {
        Row: {
          booking_id: string;
          created_at: string;
          duration_minutes: number | null;
          finished_at: string | null;
          id: string;
          route_points: Json;
          started_at: string;
          total_distance: number | null;
        };
        Insert: {
          booking_id: string;
          created_at?: string;
          duration_minutes?: number | null;
          finished_at?: string | null;
          id?: string;
          route_points: Json;
          started_at?: string;
          total_distance?: number | null;
        };
        Update: {
          booking_id?: string;
          created_at?: string;
          duration_minutes?: number | null;
          finished_at?: string | null;
          id?: string;
          route_points?: Json;
          started_at?: string;
          total_distance?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'walk_routes_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'walk_bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      whatsapp_message_log: {
        Row: {
          created_at: string;
          error_message: string | null;
          id: string;
          meta_message_id: string | null;
          recipient_phone: string;
          related_appointment_id: string | null;
          related_reminder_id: string | null;
          status: string;
          template_name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          meta_message_id?: string | null;
          recipient_phone: string;
          related_appointment_id?: string | null;
          related_reminder_id?: string | null;
          status: string;
          template_name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          meta_message_id?: string | null;
          recipient_phone?: string;
          related_appointment_id?: string | null;
          related_reminder_id?: string | null;
          status?: string;
          template_name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'whatsapp_message_log_related_reminder_id_fkey';
            columns: ['related_reminder_id'];
            isOneToOne: false;
            referencedRelation: 'pet_reminders';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      all_bookings_view: {
        Row: {
          booking_type: string | null;
          canceled_at: string | null;
          cancellation_reason: string | null;
          confirmed_at: string | null;
          created_at: string | null;
          end_time: string | null;
          google_event_id: string | null;
          id: string | null;
          is_emergency: boolean | null;
          owner_id: string | null;
          payment_status: string | null;
          pet_id: string | null;
          pet_ids: string[] | null;
          provider_id: string | null;
          reminder_24h_sent: boolean | null;
          reminder_2h_sent: boolean | null;
          scheduled_date: string | null;
          service_type: string | null;
          start_time: string | null;
          status: string | null;
          total_price: number | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      clinic_active_seats_view: {
        Row: {
          accepted_at: string | null;
          id: string | null;
          invited_at: string | null;
          parent_provider_id: string | null;
          role: string | null;
          seat_avatar_url: string | null;
          seat_display_name: string | null;
          seat_email: string | null;
          seat_user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'clinic_vet_seats_parent_provider_id_fkey';
            columns: ['parent_provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_with_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clinic_vet_seats_parent_provider_id_fkey';
            columns: ['parent_provider_id'];
            isOneToOne: false;
            referencedRelation: 'service_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles_public: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          display_name: string | null;
          id: string | null;
          is_demo: boolean | null;
          is_premium: boolean | null;
          level: number | null;
          plan_id: string | null;
          points: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          id?: string | null;
          is_demo?: boolean | null;
          is_premium?: boolean | null;
          level?: number | null;
          plan_id?: string | null;
          points?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          id?: string | null;
          is_demo?: boolean | null;
          is_premium?: boolean | null;
          level?: number | null;
          plan_id?: string | null;
          points?: number | null;
        };
        Relationships: [];
      };
      providers_with_services: {
        Row: {
          accepts_emergency: boolean | null;
          available_hours: Json | null;
          avatar_url: string | null;
          bio: string | null;
          certifications: Json | null;
          city: string | null;
          commune: string | null;
          coverage_radius_km: number | null;
          created_at: string | null;
          display_name: string | null;
          experience_years: number | null;
          id: string | null;
          is_verified: boolean | null;
          latitude: number | null;
          longitude: number | null;
          photos: string[] | null;
          rating: number | null;
          services: Json | null;
          status: string | null;
          total_reviews: number | null;
          total_services_completed: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          accepts_emergency?: boolean | null;
          available_hours?: Json | null;
          avatar_url?: string | null;
          bio?: string | null;
          certifications?: Json | null;
          city?: string | null;
          commune?: string | null;
          coverage_radius_km?: number | null;
          created_at?: string | null;
          display_name?: string | null;
          experience_years?: number | null;
          id?: string | null;
          is_verified?: boolean | null;
          latitude?: number | null;
          longitude?: number | null;
          photos?: string[] | null;
          rating?: number | null;
          services?: never;
          status?: string | null;
          total_reviews?: number | null;
          total_services_completed?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          accepts_emergency?: boolean | null;
          available_hours?: Json | null;
          avatar_url?: string | null;
          bio?: string | null;
          certifications?: Json | null;
          city?: string | null;
          commune?: string | null;
          coverage_radius_km?: number | null;
          created_at?: string | null;
          display_name?: string | null;
          experience_years?: number | null;
          id?: string | null;
          is_verified?: boolean | null;
          latitude?: number | null;
          longitude?: number | null;
          photos?: string[] | null;
          rating?: number | null;
          services?: never;
          status?: string | null;
          total_reviews?: number | null;
          total_services_completed?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      v_all_bookings: {
        Row: {
          canceled_at: string | null;
          canceled_by: string | null;
          cancellation_reason: string | null;
          commission_amount_clp: number | null;
          commission_rate: number | null;
          confirmation_mode: string | null;
          confirmed_at: string | null;
          created_at: string | null;
          duration_minutes: number | null;
          end_time: string | null;
          follow_up_booking_id: string | null;
          google_event_id: string | null;
          id: string | null;
          is_emergency: boolean | null;
          kind: string | null;
          notes_owner: string | null;
          notes_private_provider: string | null;
          owner_id: string | null;
          payment_status: string | null;
          pet_ids: string[] | null;
          price_clp: number | null;
          reminder_24h_sent: boolean | null;
          reminder_2h_sent: boolean | null;
          rescheduled_from: string | null;
          scheduled_at: string | null;
          service_provider_id: string | null;
          service_type: string | null;
          start_time: string | null;
          started_at: string | null;
          status: string | null;
          updated_at: string | null;
          vet_id: string | null;
        };
        Relationships: [];
      };
      vet_prices_by_comuna: {
        Row: {
          comuna: string | null;
          max_price: number | null;
          median_price: number | null;
          min_price: number | null;
          p25_price: number | null;
          p75_price: number | null;
          sample_size: number | null;
          service_type: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      _get_service_role_key: { Args: never; Returns: string };
      accept_clinic_seat_invitation: {
        Args: { p_token: string };
        Returns: {
          parent_provider_id: string;
          role: string;
          seat_id: string;
        }[];
      };
      accept_co_owner_invitation: {
        Args: { p_token: string; p_user_id: string };
        Returns: Json;
      };
      activate_owner_service:
        | {
            Args: {
              p_base_commune: string;
              p_bio: string;
              p_price_from: number;
              p_service_areas: string[];
              p_service_type: string;
            };
            Returns: string;
          }
        | {
            Args: {
              p_availability_rules?: Json;
              p_base_commune: string;
              p_bio: string;
              p_price_from: number;
              p_service_areas: string[];
              p_service_type: string;
            };
            Returns: string;
          };
      add_provider_service: {
        Args: {
          p_description?: string;
          p_max_pets?: number;
          p_price_base: number;
          p_price_unit?: string;
          p_service_type: string;
          p_specialties?: Json;
          p_user_id: string;
        };
        Returns: string;
      };
      admin_award_feedback_points: {
        Args: { p_feedback_id: string; p_points: number; p_user_id: string };
        Returns: boolean;
      };
      admin_delete_all_ghost_users: { Args: never; Returns: Json };
      admin_delete_ghost_user: { Args: { p_user_id: string }; Returns: Json };
      admin_list_ghost_users: {
        Args: never;
        Returns: {
          created_at: string;
          display_name: string;
          email: string;
          id: string;
          invited_at: string;
          pets_count: number;
        }[];
      };
      admin_recalculate_commission: {
        Args: { p_booking_id: string };
        Returns: {
          amount_clp: number;
          booking_id: string;
          plan: string;
          rate: number;
        }[];
      };
      admin_recalculate_excellence_badge: {
        Args: { p_provider_id: string };
        Returns: {
          five_star_reviewers: number;
          has_badge: boolean;
          provider_id: string;
        }[];
      };
      apply_premium: {
        Args: {
          p_amount_clp: number;
          p_plan: string;
          p_provider_id: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      approve_pitch_application: {
        Args: { p_application_id: string; p_notes?: string };
        Returns: Json;
      };
      approve_verification_request: {
        Args: {
          p_request_id: string;
          p_reviewer_id: string;
          p_role: string;
          p_status: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      archive_pet_memorial: {
        Args: {
          p_cause?: string;
          p_message?: string;
          p_passed_away_at: string;
          p_pet_id: string;
        };
        Returns: boolean;
      };
      assert_demo_user: { Args: { target_user_id: string }; Returns: undefined };
      auto_cancel_stale_pending_bookings: {
        Args: never;
        Returns: {
          cancelled_count: number;
        }[];
      };
      auto_claim_co_owner_by_email: {
        Args: { p_email: string; p_user_id: string };
        Returns: number;
      };
      auto_claim_pets_by_email: {
        Args: { p_email: string; p_user_id: string };
        Returns: Json;
      };
      auto_fix_benign_errors: { Args: never; Returns: Json };
      auto_fix_orphan_slugs: { Args: never; Returns: Json };
      auto_fix_stale_verification_requests: { Args: never; Returns: Json };
      award_paw_points: {
        Args: {
          p_description?: string;
          p_points: number;
          p_source_id?: string;
          p_source_type: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      award_points: {
        Args: {
          p_action_id?: string;
          p_action_type: string;
          p_description?: string;
          p_points: number;
          p_user_id: string;
        };
        Returns: undefined;
      };
      award_points_atomic: {
        Args: {
          p_action: string;
          p_points: number;
          p_transaction_type?: string;
          p_user_id: string;
        };
        Returns: {
          awarded: boolean;
          points: number;
        }[];
      };
      calc_level_from_points: { Args: { p_points: number }; Returns: number };
      calculate_booking_commission: {
        Args: { p_booking_id: string };
        Returns: {
          amount_clp: number;
          booking_id: string;
          plan: string;
          rate: number;
        }[];
      };
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number };
        Returns: number;
      };
      calculate_level: { Args: { points: number }; Returns: number };
      calculate_platform_fee: { Args: { amount_clp: number }; Returns: number };
      can_add_pet: { Args: { p_user_id: string }; Returns: Json };
      check_and_increment_ai_quota: {
        Args: { p_limit?: number; p_user_id: string; p_window_seconds?: number };
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_in_seconds: number;
        }[];
      };
      check_and_increment_ip_quota: {
        Args: {
          p_ip: string;
          p_limit?: number;
          p_scope?: string;
          p_window_seconds?: number;
        };
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_in_seconds: number;
        }[];
      };
      check_and_increment_payment_quota: {
        Args: { p_limit?: number; p_user_id: string; p_window_seconds?: number };
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_in_seconds: number;
        }[];
      };
      check_contact_exists: {
        Args: { p_email?: string; p_phone?: string };
        Returns: Json;
      };
      claim_pet_by_invitation: {
        Args: { p_invitation_token: string; p_user_id: string };
        Returns: Json;
      };
      cleanup_zombie_device_tokens: { Args: never; Returns: Json };
      count_users_without_profile: { Args: never; Returns: number };
      downgrade_expired_vet_plans: { Args: never; Returns: Json };
      expire_premium_trials: { Args: never; Returns: number };
      generate_default_display_name: { Args: never; Returns: string };
      generate_medical_share_token: { Args: never; Returns: string };
      generate_order_number: { Args: never; Returns: string };
      generate_pet_id_card_number: { Args: never; Returns: string };
      generate_provider_slug: {
        Args: { provider_name: string };
        Returns: string;
      };
      get_ad_for_placement: {
        Args: { p_placement: string };
        Returns: {
          description: string;
          id: string;
          image_url: string;
          partner_id: string;
          placement: string;
          target_url: string;
          title: string;
        }[];
      };
      get_available_slots: {
        Args: {
          p_provider_id: string;
          p_service_type?: string;
          p_target_date: string;
        };
        Returns: {
          booked_count: number;
          capacity: number;
          end_time: string;
          is_available: boolean;
          slot_date: string;
          start_time: string;
        }[];
      };
      get_donations_goal_progress: {
        Args: never;
        Returns: {
          donors_month: number;
          donors_total: number;
          month_clp: number;
          percent: number;
        }[];
      };
      get_donations_public_stats: {
        Args: never;
        Returns: {
          donors_month: number;
          donors_total: number;
          first_donation_at: string;
          month_clp: number;
          total_clp: number;
        }[];
      };
      get_follow_count: {
        Args: { count_type: string; user_id: string };
        Returns: number;
      };
      get_follow_status: {
        Args: { p_target_id: string; p_viewer_id: string };
        Returns: Json;
      };
      get_leads_clinicas: {
        Args: {
          p_busqueda?: string;
          p_comuna?: string;
          p_es_cadena?: boolean;
          p_estado?: string;
          p_prioridad?: string;
          p_tamano?: string;
        };
        Returns: Json;
      };
      get_leads_clinicas_stats: { Args: never; Returns: Json };
      get_leads_vets: {
        Args: {
          p_busqueda?: string;
          p_comuna?: string;
          p_estado?: string;
          p_fuente?: string;
          p_prioridad?: string;
        };
        Returns: Json;
      };
      get_leads_vets_stats: { Args: never; Returns: Json };
      get_medical_summary_data:
        | { Args: { p_pet_id: string }; Returns: Json }
        | { Args: { p_mode?: string; p_pet_id: string }; Returns: Json };
      get_mission_progress: { Args: { p_user_id: string }; Returns: Json };
      get_my_donation_stats: {
        Args: never;
        Returns: {
          donation_count: number;
          first_donation_at: string;
          last_donation_at: string;
          month_clp: number;
          total_clp: number;
        }[];
      };
      get_or_create_service_provider: {
        Args: { p_bio?: string; p_display_name?: string; p_user_id: string };
        Returns: string;
      };
      get_paw_card_ranking: {
        Args: { result_limit?: number };
        Returns: {
          collectorCount: number;
          holoPattern: string;
          ownerName: string;
          pawCardId: string;
          petId: string;
          petName: string;
          photoUrl: string;
          species: string;
        }[];
      };
      get_paw_member_discounts: {
        Args: never;
        Returns: {
          description: string;
          id: string;
          logo_url: string;
          name: string;
          partnership_type: string;
          paw_member_discount: string;
          slug: string;
          website: string;
        }[];
      };
      get_provider_dashboard_stats: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      get_public_donations: {
        Args: { p_limit?: number };
        Returns: {
          amount_clp: number;
          donor_name: string;
          id: string;
          message: string;
          paid_at: string;
        }[];
      };
      get_user_donor_badge: {
        Args: { p_user_id: string };
        Returns: {
          donation_count: number;
          first_donation_at: string;
          tier: string;
        }[];
      };
      get_user_id_by_email: { Args: { p_email: string }; Returns: string };
      has_role: {
        Args: {
          _role: Database['public']['Enums']['app_role'];
          _user_id: string;
        };
        Returns: boolean;
      };
      increment_partner_clicks: {
        Args: { partner_id: string };
        Returns: undefined;
      };
      increment_partner_impressions: {
        Args: { partner_id: string };
        Returns: undefined;
      };
      increment_provider_views: {
        Args: { provider_slug: string };
        Returns: undefined;
      };
      is_active_admin: { Args: { check_user_id: string }; Returns: boolean };
      is_admin_user: { Args: { check_user_id: string }; Returns: boolean };
      is_mutual_follow: {
        Args: { user1_id: string; user2_id: string };
        Returns: boolean;
      };
      is_pet_owner: { Args: { pet_uuid: string }; Returns: boolean };
      is_super_admin: { Args: { check_user_id: string }; Returns: boolean };
      is_user_blocked: {
        Args: { blocked_id: string; blocker_id: string };
        Returns: boolean;
      };
      is_valid_share_token: {
        Args: { p_token: string };
        Returns: {
          owner_id: string;
          pet_id: string;
        }[];
      };
      pets_with_co_ownership: {
        Args: { check_user_id: string };
        Returns: string[];
      };
      points_for_next_level: {
        Args: { current_level: number };
        Returns: number;
      };
      registrar_contacto_clinica: {
        Args: {
          p_canal: string;
          p_lead_id: string;
          p_notas?: string;
          p_template?: string;
        };
        Returns: undefined;
      };
      registrar_contacto_lead: {
        Args: {
          p_canal: string;
          p_lead_id: string;
          p_notas?: string;
          p_template?: string;
        };
        Returns: undefined;
      };
      resolve_pet_identity: {
        Args: { p_input: string; p_input_type?: string };
        Returns: {
          confidence: number;
          match_type: string;
          pet_id: string;
        }[];
      };
      rpc_activation_funnel_30d: {
        Args: never;
        Returns: {
          captured_at: string;
          retained: number;
          signups: number;
          with_action: number;
          with_pet: number;
        }[];
      };
      rpc_adoption_funnel: {
        Args: never;
        Returns: {
          active_shelters: number;
          captured_at: string;
          pets_in_transfer: number;
          pets_loaded_by_shelters: number;
          pets_transferred: number;
          shelters_with_transfers: number;
        }[];
      };
      rpc_applied_migrations: {
        Args: never;
        Returns: {
          inserted_at: string;
          name: string;
          statements_count: number;
          version: string;
        }[];
      };
      rpc_comuna_demand_supply: {
        Args: never;
        Returns: {
          comuna: string;
          gap_ratio: number;
          owners_count: number;
          pets_count: number;
          vets_count: number;
        }[];
      };
      rpc_create_booking: {
        Args: {
          p_confirmation_mode?: string;
          p_end_time: string;
          p_is_emergency?: boolean;
          p_notes?: string;
          p_pet_id: string;
          p_provider_id: string;
          p_scheduled_date: string;
          p_service_type: string;
          p_start_time: string;
        };
        Returns: string;
      };
      rpc_donations_30d_clp: { Args: never; Returns: number };
      rpc_get_available_slots_range: {
        Args: {
          p_date_from: string;
          p_date_to: string;
          p_is_emergency?: boolean;
          p_provider_id: string;
          p_service_type?: string;
        };
        Returns: {
          available: boolean;
          booked: number;
          capacity: number;
          slot_date: string;
          slot_end: string;
          slot_start: string;
        }[];
      };
      rpc_mau_owners_30d: { Args: never; Returns: number };
      rpc_mrr_b2b_clp: { Args: never; Returns: number };
      rpc_mrr_timeseries: {
        Args: never;
        Returns: {
          mrr_clp: number;
          new_paying_this_week: number;
          paying_vets: number;
          week_start: string;
        }[];
      };
      rpc_north_star_snapshot: {
        Args: never;
        Returns: {
          captured_at: string;
          donations_30d_clp: number;
          mau_owners_30d: number;
          mrr_b2b_clp: number;
          nsm_30d: number;
          paw_members: number;
          vets_paying_total: number;
        }[];
      };
      rpc_nsm_30d: { Args: never; Returns: number };
      rpc_paw_members_count: { Args: never; Returns: number };
      rpc_pdf_funnel: {
        Args: never;
        Returns: {
          captured_at: string;
          owners_share_opened: number;
          owners_shared: number;
          owners_with_filled_ficha: number;
          owners_with_pet: number;
        }[];
      };
      rpc_pet_health_summary: {
        Args: never;
        Returns: {
          has_microchip: boolean;
          has_photo: boolean;
          has_weight: boolean;
          holo_pattern: string;
          last_vet_visit: string;
          overdue_count: number;
          pet_id: string;
          pet_name: string;
          photo_url: string;
          species: string;
          upcoming_count: number;
          vaccines_up_to_date: boolean;
        }[];
      };
      rpc_user_care_streak: {
        Args: { p_user_id?: string };
        Returns: {
          actions_last_7d: number;
          current_streak_days: number;
          last_active_date: string;
          longest_streak_days: number;
        }[];
      };
      rpc_vets_at_churn_risk: {
        Args: never;
        Returns: {
          commune: string;
          contact_email: string;
          days_since_login: number;
          days_since_registration: number;
          display_name: string;
          last_login: string;
          patients_linked: number;
          provider_id: string;
          provider_plan: string;
          public_phone: string;
          registered_at: string;
          risk_level: string;
          status: string;
          user_id: string;
        }[];
      };
      rpc_vets_paying_breakdown: {
        Args: never;
        Returns: {
          clinic_starter_count: number;
          premium_count: number;
          pro_max_count: number;
          total_paying: number;
        }[];
      };
      run_daily_auto_fixers: { Args: never; Returns: Json };
      run_leads_dedup_check: { Args: never; Returns: Json };
      send_pending_review_pushes: { Args: never; Returns: Json };
      submit_feedback_rating: {
        Args: { p_feedback_id: string; p_rating?: number; p_would_pay?: string };
        Returns: boolean;
      };
      to_cl_date: { Args: { ts: string }; Returns: string };
      track_ad_click: { Args: { p_ad_id: string }; Returns: undefined };
      track_ad_impression: { Args: { p_ad_id: string }; Returns: undefined };
      transition_booking: {
        Args: {
          p_booking_id: string;
          p_booking_type: string;
          p_metadata?: Json;
          p_new_status: string;
        };
        Returns: Json;
      };
      update_lead_clinica_estado: {
        Args: { p_estado: string; p_lead_id: string; p_notas?: string };
        Returns: undefined;
      };
      update_lead_vet_estado: {
        Args: { p_estado: string; p_lead_id: string; p_notas?: string };
        Returns: undefined;
      };
      upsert_lead_vet: { Args: { p_data: Json }; Returns: string };
      user_can_receive_notification: {
        Args: { p_category: string; p_channel: string; p_user_id: string };
        Returns: boolean;
      };
      user_owns_pet: {
        Args: { check_pet_id: string; check_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: 'admin' | 'veterinarian' | 'dog_walker' | 'user' | 'dogsitter' | 'trainer';
      audio_note_processing_status:
        | 'pending'
        | 'transcribing'
        | 'structuring'
        | 'review'
        | 'done'
        | 'failed'
        | 'rejected';
      provider_status: 'pending' | 'approved' | 'rejected' | 'suspended';
      service_type: 'dog_walker' | 'dogsitter' | 'veterinarian' | 'trainer' | 'grooming';
      timeline_category:
        | 'health'
        | 'weight'
        | 'nutrition'
        | 'hygiene'
        | 'activity'
        | 'social'
        | 'purchases'
        | 'home'
        | 'milestone'
        | 'legal';
      timeline_event_source:
        | 'manual'
        | 'audio'
        | 'auto_trigger'
        | 'ocr'
        | 'vet_note'
        | 'shelter_transfer'
        | 'partner_integration'
        | 'import'
        | 'system';
      vet_pet_relationship_type: 'primary_vet' | 'consulting' | 'emergency' | 'specialist';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['admin', 'veterinarian', 'dog_walker', 'user', 'dogsitter', 'trainer'],
      audio_note_processing_status: [
        'pending',
        'transcribing',
        'structuring',
        'review',
        'done',
        'failed',
        'rejected',
      ],
      provider_status: ['pending', 'approved', 'rejected', 'suspended'],
      service_type: ['dog_walker', 'dogsitter', 'veterinarian', 'trainer', 'grooming'],
      timeline_category: [
        'health',
        'weight',
        'nutrition',
        'hygiene',
        'activity',
        'social',
        'purchases',
        'home',
        'milestone',
        'legal',
      ],
      timeline_event_source: [
        'manual',
        'audio',
        'auto_trigger',
        'ocr',
        'vet_note',
        'shelter_transfer',
        'partner_integration',
        'import',
        'system',
      ],
      vet_pet_relationship_type: ['primary_vet', 'consulting', 'emergency', 'specialist'],
    },
  },
} as const;
