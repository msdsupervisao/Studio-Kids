"use client";

import { useState, useTransition } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleSubscription } from "@/features/inscricoes/actions/subscription.actions";
import { formatCompactNumber } from "@/utils/format";

export function SubscribeButton({
  channelId,
  channelSlug,
  initialSubscribed,
  initialCount,
  isOwnChannel,
}: {
  channelId: string;
  channelSlug: string;
  initialSubscribed: boolean;
  initialCount: number;
  isOwnChannel: boolean;
}) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  if (isOwnChannel) return null;

  function handleClick() {
    const optimisticSubscribed = !subscribed;
    setSubscribed(optimisticSubscribed);
    setCount((current) => current + (optimisticSubscribed ? 1 : -1));

    startTransition(async () => {
      try {
        await toggleSubscription(channelId, channelSlug);
      } catch {
        setSubscribed(!optimisticSubscribed);
        setCount((current) => current + (optimisticSubscribed ? -1 : 1));
      }
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant={subscribed ? "secondary" : "default"}
      className="gap-2"
    >
      {subscribed ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {subscribed ? "Inscrito" : "Inscrever-se"}
      <span className="text-xs opacity-80">({formatCompactNumber(count)})</span>
    </Button>
  );
}
