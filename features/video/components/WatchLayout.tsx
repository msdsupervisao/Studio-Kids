"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const TheaterModeContext = createContext<{ theater: boolean; toggle: () => void } | null>(null);

const NOOP_THEATER_MODE = { theater: false, toggle: () => {} };

// Retorna um fallback inerte (sem lancar) quando usado fora de WatchLayout,
// para que VideoPlayer continue reutilizavel em contextos sem modo teatro
// (ex.: previa de video no admin).
export function useTheaterMode() {
  return useContext(TheaterModeContext) ?? NOOP_THEATER_MODE;
}

export function WatchLayout({
  player,
  details,
  related,
}: {
  player: ReactNode;
  details: ReactNode;
  related: ReactNode;
}) {
  const [theater, setTheater] = useState(false);
  const toggle = () => setTheater((current) => !current);

  return (
    <TheaterModeContext.Provider value={{ theater, toggle }}>
      <div className={cn("gap-8", theater ? "flex flex-col" : "grid grid-cols-1 lg:grid-cols-3")}>
        <div className={cn("space-y-6", !theater && "lg:col-span-2")}>
          {player}
          {details}
        </div>
        <aside className={theater ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" : undefined}>
          {related}
        </aside>
      </div>
    </TheaterModeContext.Provider>
  );
}
