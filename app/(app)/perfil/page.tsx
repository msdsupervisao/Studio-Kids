import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/services/supabase/server";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Meu perfil" };

const ROLE_LABEL = { student: "Aluno", professor: "Professor", admin: "Administrador" } as const;

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect(ROUTES.login);

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
          <AvatarFallback className="text-xl">{profile.full_name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{profile.full_name}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          <Badge variant="secondary" className="mt-1">
            {ROLE_LABEL[profile.role]}
          </Badge>
        </div>
      </div>

      {profile.bio && <p className="text-sm text-foreground">{profile.bio}</p>}

      <Button asChild variant="outline" className="gap-2">
        <Link href={ROUTES.settings}>
          <Pencil className="h-4 w-4" />
          Editar perfil
        </Link>
      </Button>
    </div>
  );
}
