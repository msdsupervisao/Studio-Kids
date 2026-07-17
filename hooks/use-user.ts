"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/services/supabase/client";
import type { CurrentUser } from "@/types/user.types";

export function useUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();

      setUser(profile ? { id: authUser.id, email: authUser.email ?? "", profile } : null);
      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
