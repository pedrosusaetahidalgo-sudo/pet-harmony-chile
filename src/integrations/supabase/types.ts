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
        ];
      };
      comprehensive_medical_records: {
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
          created_at: string;
          dogsitter_id: string;
          drop_off_address: string;
          drop_off_latitude: number | null;
          drop_off_longitude: number | null;
          end_date: string;
          id: string;
          owner_id: string;
          payment_status: string;
          pet_ids: string[];
          platform_fee_amount: number | null;
          provider_payout_amount: number | null;
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
          created_at?: string;
          dogsitter_id: string;
          drop_off_address: string;
          drop_off_latitude?: number | null;
          drop_off_longitude?: number | null;
          end_date: string;
          id?: string;
          owner_id: string;
          payment_status?: string;
          pet_ids: string[];
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
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
          created_at?: string;
          dogsitter_id?: string;
          drop_off_address?: string;
          drop_off_latitude?: number | null;
          drop_off_longitude?: number | null;
          end_date?: string;
          id?: string;
          owner_id?: string;
          payment_status?: string;
          pet_ids?: string[];
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
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
      google_calendar_tokens: {
        Row: {
          access_token: string;
          calendar_id: string | null;
          created_at: string;
          expires_at: string;
          google_email: string | null;
          refresh_token: string;
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
          reason: string | null;
          record_type: string;
          title: string;
          treatment: Json | null;
          updated_at: string;
          vet_name: string | null;
          veterinarian_name: string | null;
          visit_date: string | null;
        };
        Insert: {
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
          reason?: string | null;
          record_type: string;
          title: string;
          treatment?: Json | null;
          updated_at?: string;
          vet_name?: string | null;
          veterinarian_name?: string | null;
          visit_date?: string | null;
        };
        Update: {
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
          reason?: string | null;
          record_type?: string;
          title?: string;
          treatment?: Json | null;
          updated_at?: string;
          vet_name?: string | null;
          veterinarian_name?: string | null;
          visit_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'medical_records_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
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
      partner_submissions: {
        Row: {
          id: string;
          categoria: string;
          nombre_negocio: string;
          nombre_contacto: string;
          email: string;
          telefono: string | null;
          website: string | null;
          instagram: string | null;
          direccion: string | null;
          comuna: string | null;
          ciudad: string | null;
          descripcion: string | null;
          servicios_ofrecidos: string[] | null;
          horario: string | null;
          status: string | null;
          notas_admin: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          categoria: string;
          nombre_negocio: string;
          nombre_contacto: string;
          email: string;
          telefono?: string | null;
          website?: string | null;
          instagram?: string | null;
          direccion?: string | null;
          comuna?: string | null;
          ciudad?: string | null;
          descripcion?: string | null;
          servicios_ofrecidos?: string[] | null;
          horario?: string | null;
          status?: string | null;
          notas_admin?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          categoria?: string;
          nombre_negocio?: string;
          nombre_contacto?: string;
          email?: string;
          telefono?: string | null;
          website?: string | null;
          instagram?: string | null;
          direccion?: string | null;
          comuna?: string | null;
          ciudad?: string | null;
          descripcion?: string | null;
          servicios_ofrecidos?: string[] | null;
          horario?: string | null;
          status?: string | null;
          notas_admin?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      partners: {
        Row: {
          ad_image_url: string | null;
          ad_link: string;
          ad_text: string;
          brand_name: string;
          category: string;
          clicks: number | null;
          created_at: string | null;
          end_date: string | null;
          id: string;
          impressions: number | null;
          is_active: boolean | null;
          placement: string;
          priority: number | null;
          start_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          ad_image_url?: string | null;
          ad_link: string;
          ad_text: string;
          brand_name: string;
          category: string;
          clicks?: number | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          impressions?: number | null;
          is_active?: boolean | null;
          placement: string;
          priority?: number | null;
          start_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          ad_image_url?: string | null;
          ad_link?: string;
          ad_text?: string;
          brand_name?: string;
          category?: string;
          clicks?: number | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          impressions?: number | null;
          is_active?: boolean | null;
          placement?: string;
          priority?: number | null;
          start_date?: string | null;
          updated_at?: string | null;
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
          category: string;
          created_at: string;
          description: string;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          mission_type: string;
          points_reward: number;
          required_level: number | null;
          story_chapter: number | null;
          target_action: string;
          target_count: number;
          title: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          mission_type: string;
          points_reward?: number;
          required_level?: number | null;
          story_chapter?: number | null;
          target_action: string;
          target_count?: number;
          title: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          mission_type?: string;
          points_reward?: number;
          required_level?: number | null;
          story_chapter?: number | null;
          target_action?: string;
          target_count?: number;
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
          id: string;
          pet_id: string;
          owner_id: string;
          category: string;
          title: string;
          description: string | null;
          icon: string | null;
          days_of_week: number[];
          time_of_day: string;
          duration_minutes: number | null;
          notify_before_minutes: number;
          notify_channels: string[];
          is_active: boolean;
          starts_on: string;
          ends_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pet_id: string;
          owner_id: string;
          category: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          days_of_week: number[];
          time_of_day: string;
          duration_minutes?: number | null;
          notify_before_minutes?: number;
          notify_channels?: string[];
          is_active?: boolean;
          starts_on?: string;
          ends_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pet_id?: string;
          owner_id?: string;
          category?: string;
          title?: string;
          description?: string | null;
          icon?: string | null;
          days_of_week?: number[];
          time_of_day?: string;
          duration_minutes?: number | null;
          notify_before_minutes?: number;
          notify_channels?: string[];
          is_active?: boolean;
          starts_on?: string;
          ends_on?: string | null;
          created_at?: string;
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
      routine_completions: {
        Row: {
          id: string;
          routine_id: string;
          completed_date: string;
          completed_at: string;
          notes: string | null;
          skipped: boolean;
          skip_reason: string | null;
        };
        Insert: {
          id?: string;
          routine_id: string;
          completed_date: string;
          completed_at?: string;
          notes?: string | null;
          skipped?: boolean;
          skip_reason?: string | null;
        };
        Update: {
          id?: string;
          routine_id?: string;
          completed_date?: string;
          completed_at?: string;
          notes?: string | null;
          skipped?: boolean;
          skip_reason?: string | null;
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
          created_by_vet_id: string | null;
          current_medications: Json | null;
          diet_brand: string | null;
          diet_frequency: string | null;
          diet_type: string | null;
          emergency_vet_name: string | null;
          emergency_vet_phone: string | null;
          gender: string | null;
          holo_pattern: string | null;
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
          paw_card_id: string | null;
          passed_away_at: string | null;
          passed_away_cause: string | null;
          passed_away_registered_at: string | null;
          pending_owner_email: string | null;
          personality: string[] | null;
          photo_url: string | null;
          preferred_clinic: string | null;
          qr_token: string | null;
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
          created_by_vet_id?: string | null;
          current_medications?: Json | null;
          diet_brand?: string | null;
          diet_frequency?: string | null;
          diet_type?: string | null;
          emergency_vet_name?: string | null;
          emergency_vet_phone?: string | null;
          gender?: string | null;
          holo_pattern?: string | null;
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
          paw_card_id?: string | null;
          passed_away_at?: string | null;
          passed_away_cause?: string | null;
          passed_away_registered_at?: string | null;
          pending_owner_email?: string | null;
          personality?: string[] | null;
          photo_url?: string | null;
          preferred_clinic?: string | null;
          qr_token?: string | null;
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
          created_by_vet_id?: string | null;
          current_medications?: Json | null;
          diet_brand?: string | null;
          diet_frequency?: string | null;
          diet_type?: string | null;
          emergency_vet_name?: string | null;
          emergency_vet_phone?: string | null;
          gender?: string | null;
          holo_pattern?: string | null;
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
          owner_id?: string;
          owner_invitation_accepted_at?: string | null;
          owner_invitation_sent_at?: string | null;
          owner_invitation_token?: string | null;
          paw_card_id?: string | null;
          passed_away_at?: string | null;
          passed_away_cause?: string | null;
          passed_away_registered_at?: string | null;
          pending_owner_email?: string | null;
          personality?: string[] | null;
          photo_url?: string | null;
          preferred_clinic?: string | null;
          qr_token?: string | null;
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
            foreignKeyName: 'pets_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
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
      points_history: {
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
      provider_service_offerings: {
        Row: {
          accepted_pet_sizes: string[] | null;
          accepts_puppies: boolean | null;
          accepts_senior_pets: boolean | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          max_pets: number | null;
          price_base: number;
          price_per_additional_pet: number | null;
          price_unit: string | null;
          provider_id: string;
          service_type: string;
          services_included: Json | null;
          specialties: Json | null;
          updated_at: string;
        };
        Insert: {
          accepted_pet_sizes?: string[] | null;
          accepts_puppies?: boolean | null;
          accepts_senior_pets?: boolean | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_pets?: number | null;
          price_base: number;
          price_per_additional_pet?: number | null;
          price_unit?: string | null;
          provider_id: string;
          service_type: string;
          services_included?: Json | null;
          specialties?: Json | null;
          updated_at?: string;
        };
        Update: {
          accepted_pet_sizes?: string[] | null;
          accepts_puppies?: boolean | null;
          accepts_senior_pets?: boolean | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_pets?: number | null;
          price_base?: number;
          price_per_additional_pet?: number | null;
          price_unit?: string | null;
          provider_id?: string;
          service_type?: string;
          services_included?: Json | null;
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
          accepts_emergency: boolean | null;
          address: string | null;
          available_hours: Json | null;
          avatar_url: string | null;
          avg_rating: number | null;
          bio: string | null;
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
          experience_years: number | null;
          id: string;
          is_demo: boolean;
          is_directory_visible: boolean | null;
          is_featured: boolean | null;
          is_verified: boolean | null;
          latitude: number | null;
          license_number: string | null;
          longitude: number | null;
          max_weekly_slots: number | null;
          opening_hours: Json | null;
          photos: string[] | null;
          price_from: number | null;
          provider_plan: string | null;
          provider_type: string | null;
          public_email: string | null;
          public_phone: string | null;
          rating: number | null;
          rejection_reason: string | null;
          service_areas: string[] | null;
          slug: string | null;
          specialties: string[] | null;
          status: string | null;
          total_reviews: number | null;
          total_services_completed: number | null;
          updated_at: string;
          user_id: string;
          verification_documents: string[] | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          accepts_emergency?: boolean | null;
          address?: string | null;
          available_hours?: Json | null;
          avatar_url?: string | null;
          avg_rating?: number | null;
          bio?: string | null;
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
          experience_years?: number | null;
          id?: string;
          is_demo?: boolean;
          is_directory_visible?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          latitude?: number | null;
          license_number?: string | null;
          longitude?: number | null;
          max_weekly_slots?: number | null;
          opening_hours?: Json | null;
          photos?: string[] | null;
          price_from?: number | null;
          provider_plan?: string | null;
          provider_type?: string | null;
          public_email?: string | null;
          public_phone?: string | null;
          rating?: number | null;
          rejection_reason?: string | null;
          service_areas?: string[] | null;
          slug?: string | null;
          specialties?: string[] | null;
          status?: string | null;
          total_reviews?: number | null;
          total_services_completed?: number | null;
          updated_at?: string;
          user_id: string;
          verification_documents?: string[] | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          accepts_emergency?: boolean | null;
          address?: string | null;
          available_hours?: Json | null;
          avatar_url?: string | null;
          avg_rating?: number | null;
          bio?: string | null;
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
          experience_years?: number | null;
          id?: string;
          is_demo?: boolean;
          is_directory_visible?: boolean | null;
          is_featured?: boolean | null;
          is_verified?: boolean | null;
          latitude?: number | null;
          license_number?: string | null;
          longitude?: number | null;
          max_weekly_slots?: number | null;
          opening_hours?: Json | null;
          photos?: string[] | null;
          price_from?: number | null;
          provider_plan?: string | null;
          provider_type?: string | null;
          public_email?: string | null;
          public_phone?: string | null;
          rating?: number | null;
          rejection_reason?: string | null;
          service_areas?: string[] | null;
          slug?: string | null;
          specialties?: string[] | null;
          status?: string | null;
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
        ];
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
          created_at: string;
          duration_minutes: number;
          id: string;
          owner_id: string;
          payment_status: string;
          pet_id: string;
          platform_fee_amount: number | null;
          provider_payout_amount: number | null;
          scheduled_date: string;
          special_notes: string | null;
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
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          owner_id: string;
          payment_status?: string;
          pet_id: string;
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          scheduled_date: string;
          special_notes?: string | null;
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
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          owner_id?: string;
          payment_status?: string;
          pet_id?: string;
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          scheduled_date?: string;
          special_notes?: string | null;
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
          achievement_description: string | null;
          achievement_name: string;
          achievement_type: string;
          earned_at: string;
          id: string;
          points_earned: number | null;
          user_id: string;
        };
        Insert: {
          achievement_description?: string | null;
          achievement_name: string;
          achievement_type: string;
          earned_at?: string;
          id?: string;
          points_earned?: number | null;
          user_id: string;
        };
        Update: {
          achievement_description?: string | null;
          achievement_name?: string;
          achievement_type?: string;
          earned_at?: string;
          id?: string;
          points_earned?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_achievements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
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
        Relationships: [
          {
            foreignKeyName: 'user_mission_progress_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'paw_missions';
            referencedColumns: ['id'];
          },
        ];
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
            referencedRelation: 'virtual_routes';
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
          created_at: string;
          id: string;
          is_emergency: boolean;
          owner_id: string;
          payment_status: string;
          pet_id: string;
          platform_fee_amount: number | null;
          provider_payout_amount: number | null;
          scheduled_date: string;
          service_type: string;
          status: string;
          stripe_payment_intent_id: string | null;
          symptoms: string | null;
          total_price: number;
          updated_at: string;
          vet_id: string;
          visit_address: string;
          visit_latitude: number | null;
          visit_longitude: number | null;
        };
        Insert: {
          canceled_at?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          id?: string;
          is_emergency?: boolean;
          owner_id: string;
          payment_status?: string;
          pet_id: string;
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          scheduled_date: string;
          service_type: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          symptoms?: string | null;
          total_price: number;
          updated_at?: string;
          vet_id: string;
          visit_address: string;
          visit_latitude?: number | null;
          visit_longitude?: number | null;
        };
        Update: {
          canceled_at?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          id?: string;
          is_emergency?: boolean;
          owner_id?: string;
          payment_status?: string;
          pet_id?: string;
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          scheduled_date?: string;
          service_type?: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          symptoms?: string | null;
          total_price?: number;
          updated_at?: string;
          vet_id?: string;
          visit_address?: string;
          visit_latitude?: number | null;
          visit_longitude?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vet_bookings_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      vet_clinical_notes: {
        Row: {
          alternative_offered: boolean | null;
          alternatives_discussed: string | null;
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
          share_token_id: string;
          title: string;
        };
        Insert: {
          alternative_offered?: boolean | null;
          alternatives_discussed?: string | null;
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
          share_token_id: string;
          title: string;
        };
        Update: {
          alternative_offered?: boolean | null;
          alternatives_discussed?: string | null;
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
          share_token_id?: string;
          title?: string;
        };
        Relationships: [
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
      vet_pet_relationships: {
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
      virtual_routes: {
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
          created_at: string;
          duration_minutes: number;
          id: string;
          owner_id: string;
          payment_status: string;
          pet_ids: string[];
          pickup_address: string;
          pickup_latitude: number | null;
          pickup_longitude: number | null;
          platform_fee_amount: number | null;
          provider_payout_amount: number | null;
          scheduled_date: string;
          service_type: string;
          special_instructions: string | null;
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
          created_at?: string;
          duration_minutes: number;
          id?: string;
          owner_id: string;
          payment_status?: string;
          pet_ids: string[];
          pickup_address: string;
          pickup_latitude?: number | null;
          pickup_longitude?: number | null;
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          scheduled_date: string;
          service_type: string;
          special_instructions?: string | null;
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
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          owner_id?: string;
          payment_status?: string;
          pet_ids?: string[];
          pickup_address?: string;
          pickup_latitude?: number | null;
          pickup_longitude?: number | null;
          platform_fee_amount?: number | null;
          provider_payout_amount?: number | null;
          scheduled_date?: string;
          service_type?: string;
          special_instructions?: string | null;
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
      apply_premium: {
        Args: {
          p_amount_clp: number;
          p_plan: string;
          p_provider_id: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      assert_demo_user: { Args: { target_user_id: string }; Returns: undefined };
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
      check_and_increment_payment_quota: {
        Args: { p_limit?: number; p_user_id: string; p_window_seconds?: number };
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_in_seconds: number;
        }[];
      };
      generate_medical_share_token: { Args: never; Returns: string };
      generate_order_number: { Args: never; Returns: string };
      generate_provider_slug: {
        Args: { provider_name: string };
        Returns: string;
      };
      get_follow_count: {
        Args: { count_type: string; user_id: string };
        Returns: number;
      };
      get_or_create_service_provider: {
        Args: { p_bio?: string; p_display_name?: string; p_user_id: string };
        Returns: string;
      };
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
      is_mutual_follow: {
        Args: { user1_id: string; user2_id: string };
        Returns: boolean;
      };
      is_pet_owner: { Args: { pet_uuid: string }; Returns: boolean };
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
      points_for_next_level: {
        Args: { current_level: number };
        Returns: number;
      };
    };
    Enums: {
      app_role: 'admin' | 'veterinarian' | 'dog_walker' | 'user' | 'dogsitter' | 'trainer';
      provider_status: 'pending' | 'approved' | 'rejected' | 'suspended';
      service_type: 'dog_walker' | 'dogsitter' | 'veterinarian' | 'trainer' | 'grooming';
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
      provider_status: ['pending', 'approved', 'rejected', 'suspended'],
      service_type: ['dog_walker', 'dogsitter', 'veterinarian', 'trainer', 'grooming'],
      vet_pet_relationship_type: ['primary_vet', 'consulting', 'emergency', 'specialist'],
    },
  },
} as const;
