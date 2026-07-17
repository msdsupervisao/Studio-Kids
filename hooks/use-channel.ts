"use client";

import { useEffect, useState } from "react";
import { getMyChannels } from "@/features/canal/actions/channel.actions";
import type { Channel } from "@/types/channel.types";

/** Canais do usuario logado (professor pode ter mais de um). */
export function useMyChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMyChannels()
      .then((data) => {
        if (active) setChannels(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { channels, loading };
}
