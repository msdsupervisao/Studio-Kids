import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChannelBySlug } from "@/features/canal/actions/channel.actions";
import { listVideosByChannel } from "@/features/video/actions/video.actions";
import { ChannelHeader } from "@/features/canal/components/ChannelHeader";
import { ChannelTabs } from "@/features/canal/components/ChannelTabs";
import { createClient } from "@/services/supabase/server";
import { listChannelPosts } from "@/features/canal/actions/channel-post.actions";
import { listChannelPlaylists } from "@/features/playlist/actions/playlist.actions";
import { ChannelPostComposer } from "@/features/canal/components/ChannelPostComposer";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const channel = await getChannelBySlug(slug);
  return { title: channel?.name ?? "Canal" };
}

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const channel = await getChannelBySlug(slug);
  if (!channel) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === channel.owner_id;
  const [videos, posts, playlists] = await Promise.all([
    listVideosByChannel(channel.id),
    listChannelPosts(channel.id, { forOwner: isOwner }),
    listChannelPlaylists(channel.owner_id, isOwner),
  ]);
  const publishedVideos = videos.filter((video) => video.status === "published" && !video.isShort);

  return (
    <div className="space-y-8">
      <ChannelHeader channel={channel} currentUserId={user?.id} />
      {isOwner && (
        <ChannelPostComposer channelId={channel.id} channelName={channel.name} videos={publishedVideos} />
      )}
      <ChannelTabs
        videos={isOwner ? videos : videos.filter((video) => video.status === "published")}
        description={channel.description}
        createdAt={channel.created_at}
        showStatus={isOwner}
        posts={posts}
        playlists={playlists}
        isOwner={isOwner}
      />
    </div>
  );
}
