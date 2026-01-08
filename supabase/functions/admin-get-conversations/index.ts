// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const ADMIN_SECRET = "88620787";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin secret
    const adminSecret = req.headers.get("x-admin-secret");
    if (adminSecret !== ADMIN_SECRET) {
      console.log("Unauthorized - wrong secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body once
    const body = await req.json();
    const { userId, type, conversationId } = body;
    console.log("Request received:", { userId, type, conversationId });

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (type === "conversations") {
      // Fetch all conversations for this user
      const { data: conversations, error: convError } = await supabaseAdmin
        .from("private_conversations")
        .select("*")
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (convError) {
        console.error("Error fetching conversations:", convError);
        return new Response(JSON.stringify({ error: convError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!conversations || conversations.length === 0) {
        return new Response(JSON.stringify({ conversations: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get all unique user IDs
      const allUserIds = new Set<string>();
      conversations.forEach((conv: any) => {
        allUserIds.add(conv.participant_1);
        allUserIds.add(conv.participant_2);
      });

      // Fetch profiles
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", Array.from(allUserIds));

      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

      // Build response
      const result = conversations.map((conv: any) => {
        const otherUserId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
        const profile = profileMap.get(otherUserId) as any;
        return {
          id: conv.id,
          other_user: {
            id: otherUserId,
            full_name: profile?.full_name || "Usuário",
            username: profile?.username || "user",
            avatar_url: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`,
          },
          updated_at: conv.updated_at,
        };
      });

      return new Response(JSON.stringify({ conversations: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (type === "messages") {
      console.log("Fetching messages for conversation:", conversationId);
      
      const { data: messages, error: msgError } = await supabaseAdmin
        .from("private_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (msgError) {
        console.error("Error fetching messages:", msgError);
        return new Response(JSON.stringify({ error: msgError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ messages: messages || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
