/**
 * Espelha supabase/migrations/0001_schema.sql.
 * Em producao, prefira gerar este arquivo com:
 *   npx supabase gen types typescript --project-id <id> > types/database.types.ts
 * Mantido manualmente aqui para o projeto rodar sem CLI do Supabase.
 *
 * O formato (Relationships em cada tabela, Views/Enums/CompositeTypes
 * vazios, __InternalSupabase) segue exatamente o que `supabase gen
 * types` produz — @supabase/supabase-js 2.110 exige essa forma
 * estrutural (GenericSchema) ou o schema inteiro colapsa para `never`
 * silenciosamente em todo o app.
 *
 * Cada Row e definido como um alias nomeado independente (nunca
 * indexando de volta em `Database["public"]["Tables"][...]`) porque a
 * auto-referencia circular faz o TypeScript produzir instanciacoes
 * estruturalmente iguais porem nominalmente distintas em contextos
 * diferentes — o SupabaseClient<Database> resultante deixa de ser
 * atribuivel entre arquivos mesmo com tipos "identicos" no hover.
 */

export type UserRole = "student" | "professor" | "admin";
export type VideoStatus = "draft" | "pending" | "published" | "rejected";
export type VideoReactionType = "like" | "dislike";
export type ChannelPostKind = "text" | "poll" | "quiz" | "image" | "image_poll" | "video";
export type ChannelPostStatus = "published" | "scheduled" | "archived";

type ProfilesRow = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type CategoriesRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
};

type ChannelsRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  updated_at: string;
};

type VideosRow = {
  id: string;
  channel_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  video_path: string;
  thumbnail_path: string | null;
  duration_seconds: number;
  status: VideoStatus;
  rejection_reason: string | null;
  views_count: number;
  is_short: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type SubscriptionsRow = {
  subscriber_id: string;
  channel_id: string;
  created_at: string;
};

type CommentsRow = {
  id: string;
  video_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

type PlaylistsRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

type PlaylistVideosRow = {
  playlist_id: string;
  video_id: string;
  position: number;
  added_at: string;
};

type VideoProgressRow = {
  user_id: string;
  video_id: string;
  seconds_watched: number;
  completed: boolean;
  updated_at: string;
};

type NotificationsRow = {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

type VideoReactionsRow = {
  user_id: string;
  video_id: string;
  reaction: VideoReactionType;
  created_at: string;
};

type ChannelPostsRow = {
  id: string;
  channel_id: string;
  author_id: string;
  kind: ChannelPostKind;
  content: string;
  options: string[];
  image_path: string | null;
  option_images: (string | null)[];
  video_id: string | null;
  status: ChannelPostStatus;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
};

type ChannelPostVotesRow = {
  post_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
};

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: Partial<ProfilesRow> & { id: string; username: string; full_name: string };
        Update: Partial<ProfilesRow>;
        Relationships: [];
      };
      categories: {
        Row: CategoriesRow;
        Insert: Partial<CategoriesRow> & { name: string; slug: string };
        Update: Partial<CategoriesRow>;
        Relationships: [];
      };
      channels: {
        Row: ChannelsRow;
        Insert: Partial<ChannelsRow> & { owner_id: string; name: string; slug: string };
        Update: Partial<ChannelsRow>;
        Relationships: [
          {
            foreignKeyName: "channels_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      videos: {
        Row: VideosRow;
        Insert: Partial<VideosRow> & {
          channel_id: string;
          title: string;
          slug: string;
          video_path: string;
        };
        Update: Partial<VideosRow>;
        Relationships: [
          {
            foreignKeyName: "videos_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "videos_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: SubscriptionsRow;
        Insert: Partial<SubscriptionsRow> & { subscriber_id: string; channel_id: string };
        Update: Partial<SubscriptionsRow>;
        Relationships: [
          {
            foreignKeyName: "subscriptions_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_subscriber_id_fkey";
            columns: ["subscriber_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: CommentsRow;
        Insert: Partial<CommentsRow> & { video_id: string; author_id: string; content: string };
        Update: Partial<CommentsRow>;
        Relationships: [
          {
            foreignKeyName: "comments_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
        ];
      };
      playlists: {
        Row: PlaylistsRow;
        Insert: Partial<PlaylistsRow> & { owner_id: string; title: string };
        Update: Partial<PlaylistsRow>;
        Relationships: [
          {
            foreignKeyName: "playlists_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      playlist_videos: {
        Row: PlaylistVideosRow;
        Insert: Partial<PlaylistVideosRow> & { playlist_id: string; video_id: string };
        Update: Partial<PlaylistVideosRow>;
        Relationships: [
          {
            foreignKeyName: "playlist_videos_playlist_id_fkey";
            columns: ["playlist_id"];
            isOneToOne: false;
            referencedRelation: "playlists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "playlist_videos_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      video_progress: {
        Row: VideoProgressRow;
        Insert: Partial<VideoProgressRow> & { user_id: string; video_id: string };
        Update: Partial<VideoProgressRow>;
        Relationships: [
          {
            foreignKeyName: "video_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "video_progress_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: NotificationsRow;
        Insert: Partial<NotificationsRow> & { user_id: string; type: string };
        Update: Partial<NotificationsRow>;
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      video_reactions: {
        Row: VideoReactionsRow;
        Insert: Partial<VideoReactionsRow> & { user_id: string; video_id: string; reaction: VideoReactionType };
        Update: Partial<VideoReactionsRow>;
        Relationships: [
          {
            foreignKeyName: "video_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "video_reactions_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      channel_posts: {
        Row: ChannelPostsRow;
        Insert: Partial<ChannelPostsRow> & { channel_id: string; author_id: string };
        Update: Partial<ChannelPostsRow>;
        Relationships: [
          {
            foreignKeyName: "channel_posts_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "channel_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "channel_posts_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      channel_post_votes: {
        Row: ChannelPostVotesRow;
        Insert: Partial<ChannelPostVotesRow> & { post_id: string; user_id: string; option_index: number };
        Update: Partial<ChannelPostVotesRow>;
        Relationships: [
          {
            foreignKeyName: "channel_post_votes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "channel_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "channel_post_votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      increment_video_views: {
        Args: { video_id_input: string };
        Returns: undefined;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      owns_channel: {
        Args: { channel_id_input: string };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
