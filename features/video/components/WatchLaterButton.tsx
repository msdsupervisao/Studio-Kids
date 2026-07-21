"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToWatchLater, removeFromWatchLater } from "@/features/watch-later/actions/watch-later.actions";
import { ROUTES } from "@/lib/constants";

export function WatchLaterButton({
  videoId,
  isLoggedIn,
  initialSaved,
}: {
  videoId: string;
  isLoggedIn: boolean;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <Button asChild variant="secondary" className="gap-2">
        <Link href={ROUTES.login}>
          <Clock3 className="h-4 w-4" /> Mais tarde
        </Link>
      </Button>
    );
  }

  function toggle() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      try {
        if (next) await addToWatchLater(videoId);
        else await removeFromWatchLater(videoId);
      } catch {
        setSaved(!next);
      }
    });
  }

  return (
    <Button type="button" variant="secondary" className="gap-2" onClick={toggle}>
      {saved ? <Check className="h-4 w-4 text-success" /> : <Clock3 className="h-4 w-4" />}
      Mais tarde
    </Button>
  );
}
