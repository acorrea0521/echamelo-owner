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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bid_holds: {
        Row: {
          amount_cents: number
          bid_id: string | null
          bidder_id: string
          created_at: string
          id: string
          listing_id: string
          status: string
          stripe_payment_intent_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          bid_id?: string | null
          bidder_id: string
          created_at?: string
          id?: string
          listing_id: string
          status?: string
          stripe_payment_intent_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          bid_id?: string | null
          bidder_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          status?: string
          stripe_payment_intent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_holds_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_holds_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_holds_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount_cents: number
          bidder_id: string
          created_at: string
          id: string
          is_quick_bid: boolean
          listing_id: string
          voided_at: string | null
        }
        Insert: {
          amount_cents: number
          bidder_id: string
          created_at?: string
          id?: string
          is_quick_bid?: boolean
          listing_id: string
          voided_at?: string | null
        }
        Update: {
          amount_cents?: number
          bidder_id?: string
          created_at?: string
          id?: string
          is_quick_bid?: boolean
          listing_id?: string
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_configs: {
        Row: {
          created_at: string
          enabled: boolean
          max_bots: number
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          max_bots?: number
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          max_bots?: number
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_configs_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          bot_name: string | null
          created_at: string
          id: string
          is_deleted: boolean
          sender_id: string | null
          stream_id: string
        }
        Insert: {
          body: string
          bot_name?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          sender_id?: string | null
          stream_id: string
        }
        Update: {
          body?: string
          bot_name?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          sender_id?: string | null
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_closed: boolean
          is_support: boolean
          listing_id: string | null
          updated_at: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_closed?: boolean
          is_support?: boolean
          listing_id?: string | null
          updated_at?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_closed?: boolean
          is_support?: boolean
          listing_id?: string | null
          updated_at?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          auction_ends_at: string | null
          auction_started_at: string | null
          auction_type: string
          bot_bid_count: number
          category_id: string | null
          created_at: string
          current_bot_bidder_name: string | null
          current_highest_bid_cents: number | null
          current_highest_bidder_id: string | null
          description: string
          id: string
          image_urls: string[]
          queue_position: number
          requires_verified_buyers: boolean
          seller_id: string
          shipping_cost_cents: number
          starting_price_cents: number
          status: string
          stream_id: string
          title: string
          updated_at: string
          winning_bid_id: string | null
        }
        Insert: {
          auction_ends_at?: string | null
          auction_started_at?: string | null
          auction_type?: string
          bot_bid_count?: number
          category_id?: string | null
          created_at?: string
          current_bot_bidder_name?: string | null
          current_highest_bid_cents?: number | null
          current_highest_bidder_id?: string | null
          description: string
          id?: string
          image_urls?: string[]
          queue_position?: number
          requires_verified_buyers?: boolean
          seller_id: string
          shipping_cost_cents?: number
          starting_price_cents: number
          status?: string
          stream_id: string
          title: string
          updated_at?: string
          winning_bid_id?: string | null
        }
        Update: {
          auction_ends_at?: string | null
          auction_started_at?: string | null
          auction_type?: string
          bot_bid_count?: number
          category_id?: string | null
          created_at?: string
          current_bot_bidder_name?: string | null
          current_highest_bid_cents?: number | null
          current_highest_bidder_id?: string | null
          description?: string
          id?: string
          image_urls?: string[]
          queue_position?: number
          requires_verified_buyers?: boolean
          seller_id?: string
          shipping_cost_cents?: number
          starting_price_cents?: number
          status?: string
          stream_id?: string
          title?: string
          updated_at?: string
          winning_bid_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_current_highest_bidder_id_fkey"
            columns: ["current_highest_bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_winning_bid_fk"
            columns: ["winning_bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json | null
          stream_id: string | null
          target_id: string | null
        }
        Insert: {
          action_type: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          stream_id?: string | null
          target_id?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          stream_id?: string | null
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          stream_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          stream_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          stream_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          item_price_cents: number
          listing_id: string
          platform_fee_cents: number
          seller_id: string
          seller_payout_cents: number | null
          shipping_address: Json | null
          shipping_cost_cents: number
          status: string
          stripe_fee_cents: number | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          total_charged_cents: number
          updated_at: string
          winning_bid_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          item_price_cents: number
          listing_id: string
          platform_fee_cents: number
          seller_id: string
          seller_payout_cents?: number | null
          shipping_address?: Json | null
          shipping_cost_cents: number
          status?: string
          stripe_fee_cents?: number | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_charged_cents: number
          updated_at?: string
          winning_bid_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          item_price_cents?: number
          listing_id?: string
          platform_fee_cents?: number
          seller_id?: string
          seller_payout_cents?: number | null
          shipping_address?: Json | null
          shipping_cost_cents?: number
          status?: string
          stripe_fee_cents?: number | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_charged_cents?: number
          updated_at?: string
          winning_bid_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_winning_bid_id_fkey"
            columns: ["winning_bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          buyer_identity_session_id: string | null
          buyer_status: string
          category_id: string | null
          created_at: string
          default_shipping_address: Json | null
          display_name: string | null
          followers_count: number
          following_count: number
          id: string
          identity_verified_at: string | null
          is_admin: boolean
          is_official_admin: boolean
          payout_requested_at: string | null
          phone: string | null
          phone_verified_at: string | null
          role: string | null
          seller_status: string
          stripe_account_id: string | null
          stripe_charges_enabled: boolean
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          stripe_payouts_enabled: boolean
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          buyer_identity_session_id?: string | null
          buyer_status?: string
          category_id?: string | null
          created_at?: string
          default_shipping_address?: Json | null
          display_name?: string | null
          followers_count?: number
          following_count?: number
          id: string
          identity_verified_at?: string | null
          is_admin?: boolean
          is_official_admin?: boolean
          payout_requested_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          role?: string | null
          seller_status?: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_payouts_enabled?: boolean
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          buyer_identity_session_id?: string | null
          buyer_status?: string
          category_id?: string | null
          created_at?: string
          default_shipping_address?: Json | null
          display_name?: string | null
          followers_count?: number
          following_count?: number
          id?: string
          identity_verified_at?: string | null
          is_admin?: boolean
          is_official_admin?: boolean
          payout_requested_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          role?: string | null
          seller_status?: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_payouts_enabled?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_applications: {
        Row: {
          admin_notes: string | null
          admin_reviewer_id: string | null
          created_at: string
          date_of_birth: string | null
          estimated_monthly_sales_range: string | null
          external_store_links: Json
          id: string
          identity_extracted_name: string | null
          inventory_photo_urls: string[]
          legal_full_name: string | null
          pitch_video_url: string | null
          rejected_reason: string | null
          residence_state: string | null
          reviewed_at: string | null
          rfc_document_url: string | null
          rfc_number: string | null
          seller_id: string
          social_media_links: Json
          status: string
          stripe_identity_session_id: string | null
          stripe_identity_status: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          admin_reviewer_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          estimated_monthly_sales_range?: string | null
          external_store_links?: Json
          id?: string
          identity_extracted_name?: string | null
          inventory_photo_urls?: string[]
          legal_full_name?: string | null
          pitch_video_url?: string | null
          rejected_reason?: string | null
          residence_state?: string | null
          reviewed_at?: string | null
          rfc_document_url?: string | null
          rfc_number?: string | null
          seller_id: string
          social_media_links?: Json
          status?: string
          stripe_identity_session_id?: string | null
          stripe_identity_status?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          admin_reviewer_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          estimated_monthly_sales_range?: string | null
          external_store_links?: Json
          id?: string
          identity_extracted_name?: string | null
          inventory_photo_urls?: string[]
          legal_full_name?: string | null
          pitch_video_url?: string | null
          rejected_reason?: string | null
          residence_state?: string | null
          reviewed_at?: string | null
          rfc_document_url?: string | null
          rfc_number?: string | null
          seller_id?: string
          social_media_links?: Json
          status?: string
          stripe_identity_session_id?: string | null
          stripe_identity_status?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_applications_admin_reviewer_id_fkey"
            columns: ["admin_reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_applications_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_bans: {
        Row: {
          banned_by: string
          created_at: string
          stream_id: string
          user_id: string
        }
        Insert: {
          banned_by: string
          created_at?: string
          stream_id: string
          user_id: string
        }
        Update: {
          banned_by?: string
          created_at?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_bans_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_bans_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_chat_mutes: {
        Row: {
          created_at: string
          muted_by: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          muted_by: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          muted_by?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_chat_mutes_muted_by_fkey"
            columns: ["muted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_chat_mutes_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_chat_mutes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_moderators: {
        Row: {
          added_by: string
          created_at: string
          id: string
          stream_id: string
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          stream_id: string
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_moderators_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_moderators_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_moderators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streams: {
        Row: {
          chat_paused: boolean
          chat_slow_mode_seconds: number
          created_at: string
          current_listing_id: string | null
          ended_at: string | null
          id: string
          livekit_room_name: string
          seller_id: string
          started_at: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          viewer_count: number
        }
        Insert: {
          chat_paused?: boolean
          chat_slow_mode_seconds?: number
          created_at?: string
          current_listing_id?: string | null
          ended_at?: string | null
          id?: string
          livekit_room_name: string
          seller_id: string
          started_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          viewer_count?: number
        }
        Update: {
          chat_paused?: boolean
          chat_slow_mode_seconds?: number
          created_at?: string
          current_listing_id?: string | null
          ended_at?: string | null
          id?: string
          livekit_room_name?: string
          seller_id?: string
          started_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "streams_current_listing_fk"
            columns: ["current_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streams_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          body: string
          closed_at: string | null
          conversation_id: string | null
          created_at: string
          id: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          body: string
          closed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          body?: string
          closed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      close_auction: {
        Args: { p_listing_id: string }
        Returns: {
          auction_ends_at: string | null
          auction_started_at: string | null
          auction_type: string
          bot_bid_count: number
          category_id: string | null
          created_at: string
          current_bot_bidder_name: string | null
          current_highest_bid_cents: number | null
          current_highest_bidder_id: string | null
          description: string
          id: string
          image_urls: string[]
          queue_position: number
          requires_verified_buyers: boolean
          seller_id: string
          shipping_cost_cents: number
          starting_price_cents: number
          status: string
          stream_id: string
          title: string
          updated_at: string
          winning_bid_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "listings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_stream_moderator: {
        Args: { p_stream_id: string; p_user_id: string }
        Returns: boolean
      }
      place_bid: {
        Args: {
          p_amount_cents: number
          p_is_quick: boolean
          p_listing_id: string
        }
        Returns: Json
      }
      place_bot_bid: {
        Args: { p_bot_name: string; p_listing_id: string }
        Returns: Json
      }
      start_auction: {
        Args: { p_listing_id: string }
        Returns: {
          auction_ends_at: string | null
          auction_started_at: string | null
          auction_type: string
          bot_bid_count: number
          category_id: string | null
          created_at: string
          current_bot_bidder_name: string | null
          current_highest_bid_cents: number | null
          current_highest_bidder_id: string | null
          description: string
          id: string
          image_urls: string[]
          queue_position: number
          requires_verified_buyers: boolean
          seller_id: string
          shipping_cost_cents: number
          starting_price_cents: number
          status: string
          stream_id: string
          title: string
          updated_at: string
          winning_bid_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "listings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sweep_expired_auctions: { Args: never; Returns: undefined }
      void_bid: {
        Args: { p_actor_id: string; p_bid_id: string }
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
