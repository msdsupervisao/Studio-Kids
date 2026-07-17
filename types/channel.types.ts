import type { Database } from "./database.types";
import type { Profile } from "./user.types";

export type Channel = Database["public"]["Tables"]["channels"]["Row"];

export interface ChannelWithOwner extends Channel {
  owner: Pick<Profile, "id" | "username" | "full_name" | "avatar_url">;
}

export interface ChannelWithStats extends ChannelWithOwner {
  subscribersCount: number;
  videosCount: number;
  isSubscribed: boolean;
}
