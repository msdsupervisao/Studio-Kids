"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/services/supabase/client";
import type { CurrentUser } from "@/types/user.types";

/**
 * `initialUser` deve vir de `getCurrentUser()` (Server Component), ja
 * verificado no servidor — evita depender de um fetch client-side logo
 * na montagem, que falha de forma intermitente e deixava a UI com cara
 * de "deslogada" por alguns segundos.
 */
export function useUser(initialUser: CurrentUser | null = null) {
  const [user, setUser] = useState<CurrentUser | null>(initialUser);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setUser(null);
          return;
        }

        const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();

        setUser(profile ? { id: authUser.id, email: authUser.email ?? "", profile } : null);
      } catch {
        // Falha de rede transitoria — mantem o estado anterior em vez
        // de deslogar o usuario por engano.
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // INITIAL_SESSION dispara na montagem com a mesma race que
      // queremos evitar; o servidor ja nos deu um valor verificado.
      if (event === "INITIAL_SESSION") return;
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user };
}
