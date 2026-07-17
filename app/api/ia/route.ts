import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { suggestVideoMetadata } from "@/services/ia/ai.service";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.draftTitle !== "string" || !body.draftTitle.trim()) {
    return NextResponse.json({ error: "Informe ao menos um titulo provisorio" }, { status: 400 });
  }

  try {
    const suggestion = await suggestVideoMetadata({
      draftTitle: body.draftTitle,
      draftDescription: typeof body.draftDescription === "string" ? body.draftDescription : undefined,
    });
    return NextResponse.json(suggestion);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao gerar sugestao com IA";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
