import type { Database } from "./database.types";
import type { Profile } from "./user.types";

export type Comment = Database["public"]["Tables"]["comments"]["Row"];

export interface CommentWithAuthor extends Comment {
  author: Pick<Profile, "id" | "username" | "full_name" | "avatar_url">;
  replies?: CommentWithAuthor[];
}
