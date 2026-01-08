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
  console.log("[get-duplicate-ips] Request received:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin secret
    const adminSecret = req.headers.get("x-admin-secret");
    console.log("[get-duplicate-ips] Admin secret present:", !!adminSecret);
    
    if (adminSecret !== ADMIN_SECRET) {
      console.log("[get-duplicate-ips] Invalid admin secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[get-duplicate-ips] Admin secret valid, fetching IP logs...");
    const { data: duplicateIps, error: queryError } = await supabase.rpc('get_duplicate_ip_users');
    
    if (queryError) {
      // If the function doesn't exist yet, run raw query
      console.log("[get-duplicate-ips] RPC not found, using raw query. Error:", queryError.message);
      
      // Get all IP logs
      const { data: allLogs, error: logsError } = await supabase
        .from("user_ip_logs")
        .select("user_id, ip_address")
        .order("logged_at", { ascending: false });

      console.log("[get-duplicate-ips] All logs count:", allLogs?.length, "Error:", logsError?.message);

      if (!allLogs || allLogs.length === 0) {
        console.log("[get-duplicate-ips] No logs found");
        return new Response(JSON.stringify({ groups: [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Group by IP
      const ipToUsers = new Map<string, Set<string>>();
      for (const log of allLogs) {
        if (!ipToUsers.has(log.ip_address)) {
          ipToUsers.set(log.ip_address, new Set());
        }
        ipToUsers.get(log.ip_address)!.add(log.user_id);
      }

      // Filter only IPs with multiple users
      const duplicateUserIds = new Set<string>();
      const groupsByIp: string[][] = [];
      
      for (const [ip, userIds] of ipToUsers) {
        if (userIds.size > 1) {
          console.log("[get-duplicate-ips] Found duplicate IP:", ip, "with users:", Array.from(userIds));
          const userIdArray = Array.from(userIds);
          groupsByIp.push(userIdArray);
          userIdArray.forEach(id => duplicateUserIds.add(id));
        }
      }

      console.log("[get-duplicate-ips] Total duplicate groups:", groupsByIp.length, "Total duplicate users:", duplicateUserIds.size);

      if (duplicateUserIds.size === 0) {
        console.log("[get-duplicate-ips] No duplicates found");
        return new Response(JSON.stringify({ groups: [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get profile info for duplicate users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", Array.from(duplicateUserIds));

      console.log("[get-duplicate-ips] Profiles fetched:", profiles?.length, "Error:", profilesError?.message);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Build groups with profile info
      const groups = groupsByIp.map((userIds, index) => ({
        groupId: index + 1,
        users: userIds.map(uid => profileMap.get(uid)).filter(Boolean)
      }));

      console.log("[get-duplicate-ips] Final groups:", JSON.stringify(groups));

      return new Response(JSON.stringify({ groups }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ groups: duplicateIps || [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting duplicate IPs:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
