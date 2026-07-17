import type { Database } from "./database.types";
import type { VideoCardData } from "./video.types";

export type Playlist = Database["public"]["Tables"]["playlists"]["Row"];

export interface PlaylistWithVideos extends Playlist {
  videos: VideoCardData[];
  videosCount: number;
}
