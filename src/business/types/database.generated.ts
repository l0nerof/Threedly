export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          group_id: string;
          id: string;
          is_featured: boolean;
          name_en: string;
          name_ua: string;
          slug: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          group_id: string;
          id?: string;
          is_featured?: boolean;
          name_en: string;
          name_ua: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          id?: string;
          is_featured?: boolean;
          name_en?: string;
          name_ua?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "category_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      category_groups: {
        Row: {
          created_at: string;
          id: string;
          name_en: string;
          name_ua: string;
          slug: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name_en: string;
          name_ua: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name_en?: string;
          name_ua?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      designer_follows: {
        Row: {
          created_at: string;
          designer_id: string;
          follower_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          designer_id: string;
          follower_id: string;
        };
        Update: {
          created_at?: string;
          designer_id?: string;
          follower_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "designer_follows_designer_id_fkey";
            columns: ["designer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "designer_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      downloads: {
        Row: {
          created_at: string;
          id: string;
          model_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          model_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          model_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "downloads_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "models";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "downloads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          model_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          model_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          model_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "models";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      model_files: {
        Row: {
          bucket: string;
          created_at: string;
          file_name: string;
          file_size_bytes: number;
          format: string;
          id: string;
          is_primary: boolean;
          model_id: string;
          object_path: string;
          storage_provider: Database["public"]["Enums"]["storage_provider"];
        };
        ComputedFields: never;
        Insert: {
          bucket: string;
          created_at?: string;
          file_name: string;
          file_size_bytes: number;
          format: string;
          id?: string;
          is_primary?: boolean;
          model_id: string;
          object_path: string;
          storage_provider: Database["public"]["Enums"]["storage_provider"];
        };
        Update: {
          bucket?: string;
          created_at?: string;
          file_name?: string;
          file_size_bytes?: number;
          format?: string;
          id?: string;
          is_primary?: boolean;
          model_id?: string;
          object_path?: string;
          storage_provider?: Database["public"]["Enums"]["storage_provider"];
        };
        Relationships: [
          {
            foreignKeyName: "model_files_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "models";
            referencedColumns: ["id"];
          },
        ];
      };
      model_publication_assets: {
        Row: {
          byte_size: number;
          created_at: string;
          draft_id: string;
          extension: string;
          file_name: string;
          id: string;
          kind: Database["public"]["Enums"]["publication_asset_kind"];
          mime_type: string;
          object_path: string;
          state: Database["public"]["Enums"]["publication_asset_state"];
          upload_expires_at: string;
        };
        ComputedFields: never;
        Insert: {
          byte_size: number;
          created_at?: string;
          draft_id: string;
          extension: string;
          file_name: string;
          id?: string;
          kind: Database["public"]["Enums"]["publication_asset_kind"];
          mime_type: string;
          object_path: string;
          state?: Database["public"]["Enums"]["publication_asset_state"];
          upload_expires_at?: string;
        };
        Update: {
          byte_size?: number;
          created_at?: string;
          draft_id?: string;
          extension?: string;
          file_name?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["publication_asset_kind"];
          mime_type?: string;
          object_path?: string;
          state?: Database["public"]["Enums"]["publication_asset_state"];
          upload_expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "model_publication_assets_draft_id_fkey";
            columns: ["draft_id"];
            isOneToOne: false;
            referencedRelation: "model_publication_drafts";
            referencedColumns: ["id"];
          },
        ];
      };
      model_publication_drafts: {
        Row: {
          category_id: string | null;
          cover_asset_id: string | null;
          created_at: string;
          creator_id: string;
          description_en: string | null;
          description_ua: string | null;
          id: string;
          lifecycle: Database["public"]["Enums"]["publication_draft_state"];
          minimum_plan: Database["public"]["Enums"]["plan_key"];
          publication_model_id: string | null;
          revision: number;
          source_asset_id: string | null;
          title_en: string;
          title_ua: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category_id?: string | null;
          cover_asset_id?: string | null;
          created_at?: string;
          creator_id?: string;
          description_en?: string | null;
          description_ua?: string | null;
          id?: string;
          lifecycle?: Database["public"]["Enums"]["publication_draft_state"];
          minimum_plan?: Database["public"]["Enums"]["plan_key"];
          publication_model_id?: string | null;
          revision?: number;
          source_asset_id?: string | null;
          title_en?: string;
          title_ua?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          cover_asset_id?: string | null;
          created_at?: string;
          creator_id?: string;
          description_en?: string | null;
          description_ua?: string | null;
          id?: string;
          lifecycle?: Database["public"]["Enums"]["publication_draft_state"];
          minimum_plan?: Database["public"]["Enums"]["plan_key"];
          publication_model_id?: string | null;
          revision?: number;
          source_asset_id?: string | null;
          title_en?: string;
          title_ua?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "model_publication_drafts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "model_publication_drafts_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publication_cover_asset_fkey";
            columns: ["cover_asset_id"];
            isOneToOne: false;
            referencedRelation: "model_publication_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publication_source_asset_fkey";
            columns: ["source_asset_id"];
            isOneToOne: false;
            referencedRelation: "model_publication_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      models: {
        Row: {
          category_id: string;
          cover_image_path: string;
          created_at: string;
          creator_id: string | null;
          deletion_pending: boolean;
          description_en: string | null;
          description_ua: string | null;
          download_count: number;
          file_format: string | null;
          file_size_bytes: number | null;
          id: string;
          is_featured: boolean;
          minimum_plan: Database["public"]["Enums"]["plan_key"];
          polygon_count: number | null;
          preview_model_path: string | null;
          published_at: string | null;
          slug: string;
          status: Database["public"]["Enums"]["model_status"];
          title_en: string;
          title_ua: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          cover_image_path: string;
          created_at?: string;
          creator_id?: string | null;
          deletion_pending?: boolean;
          description_en?: string | null;
          description_ua?: string | null;
          download_count?: number;
          file_format?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          is_featured?: boolean;
          minimum_plan?: Database["public"]["Enums"]["plan_key"];
          polygon_count?: number | null;
          preview_model_path?: string | null;
          published_at?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["model_status"];
          title_en: string;
          title_ua: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          cover_image_path?: string;
          created_at?: string;
          creator_id?: string | null;
          deletion_pending?: boolean;
          description_en?: string | null;
          description_ua?: string | null;
          download_count?: number;
          file_format?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          is_featured?: boolean;
          minimum_plan?: Database["public"]["Enums"]["plan_key"];
          polygon_count?: number | null;
          preview_model_path?: string | null;
          published_at?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["model_status"];
          title_en?: string;
          title_ua?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "models_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "models_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          bio: string | null;
          can_upload: boolean;
          created_at: string;
          downloads_limit_monthly: number;
          downloads_used_this_month: number;
          id: string;
          plan_key: Database["public"]["Enums"]["plan_key"];
          updated_at: string;
          username: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_path?: string | null;
          bio?: string | null;
          can_upload?: boolean;
          created_at?: string;
          downloads_limit_monthly?: number;
          downloads_used_this_month?: number;
          id: string;
          plan_key?: Database["public"]["Enums"]["plan_key"];
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_path?: string | null;
          bio?: string | null;
          can_upload?: boolean;
          created_at?: string;
          downloads_limit_monthly?: number;
          downloads_used_this_month?: number;
          id?: string;
          plan_key?: Database["public"]["Enums"]["plan_key"];
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_profile_library_page: {
        Args: { requested_page?: number; requested_tab?: string };
        Returns: {
          active_tab: string;
          current_page: number;
          designers: Json;
          downloaded_count: number;
          favorite_count: number;
          followed_count: number;
          models: Json;
          profile_id: string;
          total_pages: number;
        }[];
      };
      get_profile_overview: {
        Args: Record<PropertyKey, never>;
        Returns: {
          downloads_limit_monthly: number;
          downloads_used_this_month: number;
          favorite_models: number;
          plan_key: Database["public"]["Enums"]["plan_key"];
          profile_id: string;
          published_uploads: number;
        }[];
      };
      is_username_available: { Args: { u: string }; Returns: boolean };
      manage_owned_model: {
        Args: {
          requested_metadata?: Json;
          requested_model_id: string;
          requested_operation: string;
        };
        Returns: {
          image_paths: Json;
          model_id: string;
          model_paths: Json;
          result: string;
        }[];
      };
      manage_publication_draft: {
        Args: {
          requested_draft_id: string;
          requested_operation: string;
          requested_payload?: Json;
          requested_revision?: number;
        };
        Returns: {
          assets: Json;
          draft_id: string;
          lifecycle: Database["public"]["Enums"]["publication_draft_state"];
          model_id: string;
          objects: Json;
          result: string;
          revision: number;
        }[];
      };

      record_model_download: {
        Args: { requested_file_id: string; requested_model_id: string };
        Returns: Database["public"]["Enums"]["model_download_status"];
      };
    };
    Enums: {
      model_download_status:
        | "ok"
        | "unauthorized"
        | "model_unavailable"
        | "file_unavailable"
        | "plan_required"
        | "quota_exceeded";
      model_status: "draft" | "published" | "archived";
      plan_key: "free" | "pro" | "max";
      publication_asset_kind: "source" | "cover";
      publication_asset_state: "reserved" | "active" | "retired" | "deleting";
      publication_draft_state:
        | "draft"
        | "publishing"
        | "published"
        | "cancelling"
        | "deleting";
      storage_provider: "supabase" | "r2";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      model_download_status: [
        "ok",
        "unauthorized",
        "model_unavailable",
        "file_unavailable",
        "plan_required",
        "quota_exceeded",
      ],
      model_status: ["draft", "published", "archived"],
      plan_key: ["free", "pro", "max"],
      publication_asset_kind: ["source", "cover"],
      publication_asset_state: ["reserved", "active", "retired", "deleting"],
      publication_draft_state: [
        "draft",
        "publishing",
        "published",
        "cancelling",
        "deleting",
      ],
      storage_provider: ["supabase", "r2"],
    },
  },
} as const;
