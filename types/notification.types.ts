import type { Database } from "./database.types";

export type NotificationType =
  | "video_published"
  | "new_subscriber"
  | "new_comment"
  | "comment_reply"
  | "video_approved"
  | "video_rejected";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"] & {
  type: NotificationType;
};
