// ============================================================
// SUPABASE DATABASE TYPE DEFINITIONS
// Bu dosya Supabase tablolarının TypeScript tip tanımlarını içerir.
// Gerçek projenizde `npx supabase gen types typescript` ile otomatik
// üretilebilir. Bu versiyon elle yazılmıştır.
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'admin' | 'project_manager' | 'voice_artist' | 'qc_reviewer';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role: 'admin' | 'project_manager' | 'voice_artist' | 'qc_reviewer';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'admin' | 'project_manager' | 'voice_artist' | 'qc_reviewer';
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          client_name: string;
          description: string | null;
          status: 'active' | 'completed' | 'on_hold' | 'archived';
          manager_id: string;
          manager_name: string;
          due_date: string | null;
          cover_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          client_name: string;
          description?: string | null;
          status?: 'active' | 'completed' | 'on_hold' | 'archived';
          manager_id: string;
          manager_name: string;
          due_date?: string | null;
          cover_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          client_name?: string;
          description?: string | null;
          status?: 'active' | 'completed' | 'on_hold' | 'archived';
          manager_id?: string;
          manager_name?: string;
          due_date?: string | null;
          cover_color?: string | null;
          updated_at?: string;
        };
      };
      characters: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          voice_notes: string | null;
          gender: 'male' | 'female' | 'neutral' | 'unknown' | null;
          priority: 'critical' | 'high' | 'normal' | 'low' | null;
          assigned_artist_id: string | null;
          assigned_artist_name: string | null;
          line_count: number;
          completed_count: number;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string | null;
          voice_notes?: string | null;
          gender?: 'male' | 'female' | 'neutral' | 'unknown' | null;
          priority?: 'critical' | 'high' | 'normal' | 'low' | null;
          assigned_artist_id?: string | null;
          assigned_artist_name?: string | null;
          line_count?: number;
          completed_count?: number;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          voice_notes?: string | null;
          gender?: 'male' | 'female' | 'neutral' | 'unknown' | null;
          priority?: 'critical' | 'high' | 'normal' | 'low' | null;
          assigned_artist_id?: string | null;
          assigned_artist_name?: string | null;
          line_count?: number;
          completed_count?: number;
          order?: number;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          character_id: string;
          character_name: string;
          assigned_to: string | null;
          assigned_artist_name: string | null;
          line_count: number;
          status: string;
          notes: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          character_id: string;
          character_name: string;
          assigned_to?: string | null;
          assigned_artist_name?: string | null;
          line_count?: number;
          status?: string;
          notes?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          assigned_artist_name?: string | null;
          line_count?: number;
          status?: string;
          notes?: string | null;
          due_date?: string | null;
          updated_at?: string;
        };
      };
      recording_lines: {
        Row: {
          id: string;
          task_id: string;
          line_number: number;
          original_text: string | null;
          translated_text: string | null;
          timecode: string | null;
          status: string;
          director_note: string | null;
          artist_note: string | null;
          qc_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          retake_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          line_number: number;
          original_text?: string | null;
          translated_text?: string | null;
          timecode?: string | null;
          status?: string;
          director_note?: string | null;
          artist_note?: string | null;
          qc_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          retake_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          original_text?: string | null;
          translated_text?: string | null;
          timecode?: string | null;
          status?: string;
          director_note?: string | null;
          artist_note?: string | null;
          qc_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          retake_count?: number;
          updated_at?: string;
        };
      };
      audio_files: {
        Row: {
          id: string;
          task_id: string;
          line_id: string | null;
          type: 'source' | 'recorded' | 'mixed' | 'final';
          file_name: string;
          file_size: number;
          mime_type: string | null;
          duration: number | null;
          hf_path: string;
          hf_url: string;
          storage_provider: 'huggingface';
          version_number: number | null;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          line_id?: string | null;
          type: 'source' | 'recorded' | 'mixed' | 'final';
          file_name: string;
          file_size: number;
          mime_type?: string | null;
          duration?: number | null;
          hf_path: string;
          hf_url: string;
          storage_provider?: 'huggingface';
          version_number?: number | null;
          uploaded_by: string;
          uploaded_at?: string;
        };
        Update: {
          hf_url?: string;
          duration?: number | null;
          version_number?: number | null;
        };
      };
      recording_versions: {
        Row: {
          id: string;
          line_id: string;
          version: number;
          audio_file_id: string;
          uploaded_at: string;
          uploaded_by: string;
          qc_status: 'pending' | 'approved' | 'rejected' | null;
          qc_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          line_id: string;
          version: number;
          audio_file_id: string;
          uploaded_at?: string;
          uploaded_by: string;
          qc_status?: 'pending' | 'approved' | 'rejected' | null;
          qc_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: {
          qc_status?: 'pending' | 'approved' | 'rejected' | null;
          qc_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
      };
      qc_reviews: {
        Row: {
          id: string;
          project_id: string;
          task_id: string;
          line_id: string;
          recording_version_id: string | null;
          reviewer_id: string;
          reviewer_name: string;
          decision: 'approved' | 'rejected';
          note: string | null;
          reviewed_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          task_id: string;
          line_id: string;
          recording_version_id?: string | null;
          reviewer_id: string;
          reviewer_name: string;
          decision: 'approved' | 'rejected';
          note?: string | null;
          reviewed_at?: string;
        };
        Update: {
          note?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          target_role: string;
          meta: Record<string, unknown> | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          target_role: string;
          meta?: Record<string, unknown> | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string | null;
          scope: 'global' | 'user';
          settings_json: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          scope: 'global' | 'user';
          settings_json: Record<string, unknown>;
          updated_at?: string;
        };
        Update: {
          settings_json?: Record<string, unknown>;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
