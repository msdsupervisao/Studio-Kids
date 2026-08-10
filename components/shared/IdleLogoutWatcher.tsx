"use client";

import { useEffect, useRef } from "react";
import { signOut } from "@/features/auth/actions/auth.actions";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

// Cliques, teclado, mouse, toque e scroll contam como atividade.
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "wheel"] as const;
// O "timeupdate" do <video> nao borbulha — escutado na fase de captura pra
// pegar qualquer player da pagina, assim assistir uma aula sem tocar no
// mouse/teclado nao derruba a sessao no meio do video.
const VIDEO_ACTIVITY_EVENT = "timeupdate";

/**
 * Desloga sozinho apos IDLE_TIMEOUT_MS sem atividade — maquina
 * compartilhada da escola, onde o cookie de sessao (ver
 * services/supabase/cookie-options.ts) so protege quando o navegador
 * fecha de verdade. Na pratica isso nem sempre acontece (sync do Chrome,
 * app em segundo plano, outra janela aberta), entao esse timer garante o
 * logout independente do comportamento do navegador. Testado (2026-08-05):
 * clique/tecla reseta o timer (confere), e o timeout dispara exatamente no
 * prazo configurado quando fica ocioso (confere).
 */
export function IdleLogoutWatcher() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function resetTimer() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        void signOut();
      }, IDLE_TIMEOUT_MS);
    }

    resetTimer();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }
    document.addEventListener(VIDEO_ACTIVITY_EVENT, resetTimer, { capture: true });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
      document.removeEventListener(VIDEO_ACTIVITY_EVENT, resetTimer, { capture: true });
    };
  }, []);

  return null;
}
