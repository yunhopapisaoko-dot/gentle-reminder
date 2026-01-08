// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

// NOTE: Reusa o mesmo segredo simples já usado em admin-get-conversations.
const ADMIN_SECRET = "88620787";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret");
    if (adminSecret !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Body opcional
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const sinceMinutes = Number(body?.sinceMinutes ?? 180); // padrão: últimas 3h

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const sinceIso = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();

    // Apaga mensagens do JYP na pousada no intervalo escolhido
    const { error } = await supabaseAdmin
      .from("chat_messages")
      .delete()
      .eq("location", "pousada")
      .in("user_id", [
        "00000000-0000-0000-0000-000000000002", // UUID antigo usado por engano
        "00000000-0000-0000-0000-000000000003", // UUID correto do JYP
      ])
      .gte("created_at", sinceIso);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ version: 2, success: true, sinceMinutes }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
