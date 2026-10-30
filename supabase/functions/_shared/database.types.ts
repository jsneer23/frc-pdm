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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      machine_materials: {
        Row: {
          machine_id: number
          material_id: number
        }
        Insert: {
          machine_id: number
          material_id: number
        }
        Update: {
          machine_id?: number
          material_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "machine_materials_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          code: string
          created_at: string
          file_format: Database["public"]["Enums"]["export_format"]
          id: number
          label: string
          selection: Database["public"]["Enums"]["part_kind"] | null
        }
        Insert: {
          code: string
          created_at?: string
          file_format: Database["public"]["Enums"]["export_format"]
          id?: never
          label: string
          selection?: Database["public"]["Enums"]["part_kind"] | null
        }
        Update: {
          code?: string
          created_at?: string
          file_format?: Database["public"]["Enums"]["export_format"]
          id?: never
          label?: string
          selection?: Database["public"]["Enums"]["part_kind"] | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          code: string
          created_at: string
          id: number
          label: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: never
          label: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: never
          label?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          auth_user_id: string | null
          created_at: string
          id: number
          is_admin: boolean
          name: string
          onshape_user_id: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          id?: never
          is_admin?: boolean
          name: string
          onshape_user_id?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          id?: never
          is_admin?: boolean
          name?: string
          onshape_user_id?: string | null
        }
        Relationships: []
      }
      part_exports: {
        Row: {
          configuration: string | null
          document_id: string
          element_id: string
          exported_at: string
          failure_reason: string | null
          file_format: Database["public"]["Enums"]["export_format"]
          file_path: string | null
          id: number
          kind: Database["public"]["Enums"]["part_kind"]
          microversion_id: string
          occurrence_path: string
          onshape_user_id: string
          part_id: number
          selection_id: string
          status: Database["public"]["Enums"]["export_status"]
          translation_id: string | null
          workspace_id: string
        }
        Insert: {
          configuration?: string | null
          document_id: string
          element_id: string
          exported_at?: string
          failure_reason?: string | null
          file_format: Database["public"]["Enums"]["export_format"]
          file_path?: string | null
          id?: never
          kind: Database["public"]["Enums"]["part_kind"]
          microversion_id: string
          occurrence_path: string
          onshape_user_id: string
          part_id: number
          selection_id: string
          status?: Database["public"]["Enums"]["export_status"]
          translation_id?: string | null
          workspace_id: string
        }
        Update: {
          configuration?: string | null
          document_id?: string
          element_id?: string
          exported_at?: string
          failure_reason?: string | null
          file_format?: Database["public"]["Enums"]["export_format"]
          file_path?: string | null
          id?: never
          kind?: Database["public"]["Enums"]["part_kind"]
          microversion_id?: string
          occurrence_path?: string
          onshape_user_id?: string
          part_id?: number
          selection_id?: string
          status?: Database["public"]["Enums"]["export_status"]
          translation_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_exports_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: true
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_exports_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: true
            referencedRelation: "parts_with_number"
            referencedColumns: ["id"]
          },
        ]
      }
      part_status_events: {
        Row: {
          changed_at: string
          id: number
          member_id: number | null
          part_id: number
          status: Database["public"]["Enums"]["part_status"]
        }
        Insert: {
          changed_at?: string
          id?: never
          member_id?: number | null
          part_id: number
          status: Database["public"]["Enums"]["part_status"]
        }
        Update: {
          changed_at?: string
          id?: never
          member_id?: number | null
          part_id?: number
          status?: Database["public"]["Enums"]["part_status"]
        }
        Relationships: [
          {
            foreignKeyName: "part_status_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_status_events_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_status_events_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_with_number"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          actual_mass_g: number | null
          cad_mass_g: number | null
          completer_id: number | null
          created_at: string
          deprecated_at: string | null
          id: number
          machine_id: number
          manufacturer_id: number | null
          name: string
          qty: number
          sequence_number: number
          status: Database["public"]["Enums"]["part_status"]
          stock_id: number
          subsystem_id: number
          supersedes_part_id: number | null
        }
        Insert: {
          actual_mass_g?: number | null
          cad_mass_g?: number | null
          completer_id?: number | null
          created_at?: string
          deprecated_at?: string | null
          id?: never
          machine_id: number
          manufacturer_id?: number | null
          name: string
          qty?: number
          sequence_number?: number
          status?: Database["public"]["Enums"]["part_status"]
          stock_id: number
          subsystem_id: number
          supersedes_part_id?: number | null
        }
        Update: {
          actual_mass_g?: number | null
          cad_mass_g?: number | null
          completer_id?: number | null
          created_at?: string
          deprecated_at?: string | null
          id?: never
          machine_id?: number
          manufacturer_id?: number | null
          name?: string
          qty?: number
          sequence_number?: number
          status?: Database["public"]["Enums"]["part_status"]
          stock_id?: number
          subsystem_id?: number
          supersedes_part_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_completer_id_fkey"
            columns: ["completer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_subsystem_id_fkey"
            columns: ["subsystem_id"]
            isOneToOne: false
            referencedRelation: "subsystems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_supersedes_part_id_fkey"
            columns: ["supersedes_part_id"]
            isOneToOne: true
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_supersedes_part_id_fkey"
            columns: ["supersedes_part_id"]
            isOneToOne: true
            referencedRelation: "parts_with_number"
            referencedColumns: ["id"]
          },
        ]
      }
      robots: {
        Row: {
          code: string
          created_at: string
          id: number
          kind: Database["public"]["Enums"]["robot_kind"]
          name: string
          season: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: never
          kind: Database["public"]["Enums"]["robot_kind"]
          name: string
          season: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: never
          kind?: Database["public"]["Enums"]["robot_kind"]
          name?: string
          season?: number
        }
        Relationships: []
      }
      stocks: {
        Row: {
          created_at: string
          id: number
          material_id: number
          thickness_in: number | null
        }
        Insert: {
          created_at?: string
          id?: never
          material_id: number
          thickness_in?: number | null
        }
        Update: {
          created_at?: string
          id?: never
          material_id?: number
          thickness_in?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stocks_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      subsystems: {
        Row: {
          code: string
          created_at: string
          id: number
          name: string
          robot_id: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: never
          name: string
          robot_id: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: never
          name?: string
          robot_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "subsystems_robot_id_fkey"
            columns: ["robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      parts_with_number: {
        Row: {
          actual_mass_g: number | null
          cad_mass_g: number | null
          completer_id: number | null
          created_at: string | null
          deprecated_at: string | null
          id: number | null
          machine_id: number | null
          manufacturer_id: number | null
          name: string | null
          part_number: string | null
          qty: number | null
          sequence_number: number | null
          status: Database["public"]["Enums"]["part_status"] | null
          stock_id: number | null
          subsystem_id: number | null
          supersedes_part_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_completer_id_fkey"
            columns: ["completer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_subsystem_id_fkey"
            columns: ["subsystem_id"]
            isOneToOne: false
            referencedRelation: "subsystems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_supersedes_part_id_fkey"
            columns: ["supersedes_part_id"]
            isOneToOne: true
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_supersedes_part_id_fkey"
            columns: ["supersedes_part_id"]
            isOneToOne: true
            referencedRelation: "parts_with_number"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      export_format: "dwg" | "dxf" | "step"
      export_status: "exporting" | "done" | "failed"
      part_kind: "face" | "body"
      part_status: "waiting_on_order" | "ready" | "in_progress" | "completed"
      robot_kind: "alpha" | "beta" | "competition" | "offseason"
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
  public: {
    Enums: {
      export_format: ["dwg", "dxf", "step"],
      export_status: ["exporting", "done", "failed"],
      part_kind: ["face", "body"],
      part_status: ["waiting_on_order", "ready", "in_progress", "completed"],
      robot_kind: ["alpha", "beta", "competition", "offseason"],
    },
  },
} as const
