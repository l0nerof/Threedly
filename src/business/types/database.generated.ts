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
      downloads: {
        Row: {
          created_at: string;
          id: string;
          model_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          model_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          model_id?: string;
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
      models: {
        Row: {
          category_id: string;
          cover_image_path: string;
          created_at: string;
          creator_id: string | null;
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
        Insert: {
          category_id: string;
          cover_image_path: string;
          created_at?: string;
          creator_id?: string | null;
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
      is_username_available: { Args: { u: string }; Returns: boolean };
    };
    Enums: {
      model_status: "draft" | "published" | "archived";
      plan_key: "free" | "pro" | "max";
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
      model_status: ["draft", "published", "archived"],
      plan_key: ["free", "pro", "max"],
      storage_provider: ["supabase", "r2"],
    },
  },
} as const;
