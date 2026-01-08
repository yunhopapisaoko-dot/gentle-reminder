// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64 URL encoding helpers
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Create VAPID JWT token
async function createVapidJwt(audience: string, vapidPrivateKey: string, vapidPublicKey: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: 'mailto:admin@magictalk.app'
  };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  try {
    const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
    const publicKeyBytes = base64UrlDecode(vapidPublicKey);
    
    // Public key is 65 bytes: 0x04 + 32 bytes X + 32 bytes Y
    const x = publicKeyBytes.slice(1, 33);
    const y = publicKeyBytes.slice(33, 65);
    
    const jwk = {
      kty: 'EC',
      crv: 'P-256',
      x: base64UrlEncode(x),
      y: base64UrlEncode(y),
      d: base64UrlEncode(privateKeyBytes),
    };

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      new TextEncoder().encode(unsignedToken)
    );

    const signatureBytes = new Uint8Array(signature);
    const encodedSignature = base64UrlEncode(signatureBytes);

    return `${unsignedToken}.${encodedSignature}`;
  } catch (error) {
    console.error('[Push] Error creating VAPID JWT:', error);
    throw error;
  }
}

// Encrypt the payload using Web Push encryption
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  // Generate server keys
  const serverKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Export server public key
  const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeys.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyRaw);

  // Import client public key (p256dh)
  const clientPublicKeyBytes = base64UrlDecode(p256dh);
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKeyBytes.buffer as ArrayBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeys.privateKey,
    256
  );

  // Auth secret
  const authSecret = base64UrlDecode(auth);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive keys
  const sharedSecretKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Create info for WebPush
  const infoData = new Uint8Array(
    new TextEncoder().encode('WebPush: info\0').length + clientPublicKeyBytes.length + serverPublicKey.length
  );
  let offset = 0;
  infoData.set(new TextEncoder().encode('WebPush: info\0'), offset);
  offset += new TextEncoder().encode('WebPush: info\0').length;
  infoData.set(clientPublicKeyBytes, offset);
  offset += clientPublicKeyBytes.length;
  infoData.set(serverPublicKey, offset);

  // IKM for the key derivation
  const ikm = new Uint8Array(await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: authSecret.buffer as ArrayBuffer,
      info: infoData.buffer as ArrayBuffer
    },
    sharedSecretKey,
    256
  ));

  const ikmKey = await crypto.subtle.importKey(
    'raw',
    ikm,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Derive CEK and nonce
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const cek = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: salt.buffer as ArrayBuffer, info: cekInfo.buffer as ArrayBuffer },
    ikmKey,
    128
  ));

  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');
  const nonce = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: salt.buffer as ArrayBuffer, info: nonceInfo.buffer as ArrayBuffer },
    ikmKey,
    96
  ));

  // Encrypt with AES-GCM
  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 2);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // Delimiter
  paddedPayload[payloadBytes.length + 1] = 0; // Padding

  const aesKey = await crypto.subtle.importKey(
    'raw',
    cek,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey,
    paddedPayload
  );

  return {
    encrypted: new Uint8Array(encrypted),
    salt,
    serverPublicKey
  };
}

// Build aes128gcm body
function buildAes128gcmBody(
  encrypted: Uint8Array,
  salt: Uint8Array,
  serverPublicKey: Uint8Array
): Uint8Array {
  // Header: salt (16) + rs (4) + idlen (1) + keyid (65)
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  header[16] = (rs >> 24) & 0xff;
  header[17] = (rs >> 16) & 0xff;
  header[18] = (rs >> 8) & 0xff;
  header[19] = rs & 0xff;
  header[20] = 65; // keyid length
  header.set(serverPublicKey, 21);

  const body = new Uint8Array(header.length + encrypted.length);
  body.set(header, 0);
  body.set(encrypted, header.length);
  return body;
}

// List of restricted sub-locations that require authorization
// Users should NOT receive push notifications for these unless they have access
const RESTRICTED_SUB_LOCATIONS = [
  // Hospital - salas de consulta
  'hospital:Sala 1', 'hospital:Sala 2', 'hospital:Sala 3', 'hospital:Sala 4', 'hospital:Sala 5',
  'hospital:Cirurgia',
  // Restaurante e Padaria - cozinha
  'restaurante:Cozinha', 'padaria:Cozinha',
  // Creche - sala de aula e parquinho
  'creche:Sala de Aula', 'creche:Parquinho',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, body, type, url, conversationId, location, subLocation, broadcastExcept } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[Push] VAPID keys not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if this is a restricted location
    const locationKey = subLocation ? `${location}:${subLocation}` : location;
    const isRestrictedLocation = location && RESTRICTED_SUB_LOCATIONS.includes(locationKey);
    
    console.log(`[Push] Location: ${locationKey}, Restricted: ${isRestrictedLocation}`);

    let subscriptions;
    let subError;

    // Se broadcastExcept está definido, enviar para TODOS que já entraram nesse chat
    // EXCETO quem mandou a mensagem E quem está vendo o chat agora (current_location = location)
    // broadcastExcept pode ser um string (único ID) ou array de IDs
    if (broadcastExcept && location) {
      const excludeIds = Array.isArray(broadcastExcept) ? broadcastExcept : [broadcastExcept];
      console.log(`[Push] Broadcasting to all users who joined ${location} except: ${excludeIds.join(', ')}`);
      
      // Buscar usuários que estão ATUALMENTE vendo esse chat (para não enviar notificação duplicada)
      const { data: usersCurrentlyViewing } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('current_location', location);
      
      const usersViewingIds = (usersCurrentlyViewing || []).map(u => u.user_id);
      console.log(`[Push] Users currently viewing ${location}: ${usersViewingIds.length}`);
      
      // Buscar TODOS os usuários que já entraram nesse chat
      const { data: usersWhoJoined, error: joinedError } = await supabase
        .from('user_visited_chats')
        .select('user_id')
        .eq('chat_id', location);
      
      if (joinedError) {
        console.error('[Push] Error fetching users who joined:', joinedError);
        throw joinedError;
      }
      
      if (!usersWhoJoined || usersWhoJoined.length === 0) {
        console.log('[Push] No users have joined this chat yet');
        return new Response(
          JSON.stringify({ success: true, message: 'No users joined this chat' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Filtrar: remover quem está na lista de exclusão E quem está vendo o chat agora
      let usersToNotify = usersWhoJoined
        .map(u => u.user_id)
        .filter(id => !excludeIds.includes(id) && !usersViewingIds.includes(id));
      
      // For restricted locations, filter to only users who have authorization
      if (isRestrictedLocation && usersToNotify.length > 0) {
        console.log(`[Push] Filtering for restricted location: ${locationKey}`);
        
        // Extract location and room_name from the locationKey
        const [authLocation, roomName] = locationKey.includes(':') 
          ? [locationKey.split(':')[0], locationKey.split(':').slice(1).join(':')] 
          : [locationKey, null];
        
        if (roomName) {
          const { data: authorizedUsers, error: authError } = await supabase
            .from('room_authorizations')
            .select('user_id')
            .eq('location', authLocation)
            .eq('room_name', roomName)
            .in('user_id', usersToNotify);
          
          if (authError) {
            console.error('[Push] Error fetching room authorizations:', authError);
          } else {
            const authorizedIds = new Set((authorizedUsers || []).map(u => u.user_id));
            const previousCount = usersToNotify.length;
            usersToNotify = usersToNotify.filter(id => authorizedIds.has(id));
            console.log(`[Push] Filtered from ${previousCount} to ${usersToNotify.length} users with authorization`);
          }
        }
      }
      
      console.log(`[Push] Total users who joined: ${usersWhoJoined.length}, will notify: ${usersToNotify.length}`);
      
      if (usersToNotify.length === 0) {
        console.log('[Push] All users are either excluded, currently viewing, or lack authorization');
        return new Response(
          JSON.stringify({ success: true, message: 'No users to notify' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const result = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', usersToNotify);
      
      console.log(`[Push] Found ${result.data?.length || 0} push subscriptions for ${usersToNotify.length} users`);
      
      subscriptions = result.data;
      subError = result.error;
    } else if (broadcastExcept) {
      // Fallback: broadcast sem location (não deve acontecer, mas por segurança)
      const excludeIds = Array.isArray(broadcastExcept) ? broadcastExcept : [broadcastExcept];
      console.log(`[Push] Broadcasting to all users except ${excludeIds.join(', ')}: ${title}`);
      
      const result = await supabase
        .from('push_subscriptions')
        .select('*')
        .not('user_id', 'in', `(${excludeIds.join(',')})`);
      
      subscriptions = result.data;
      subError = result.error;
    } else {
      console.log(`[Push] Sending notification to user ${userId}: ${title}`);
      
      const result = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);
      
      subscriptions = result.data;
      subError = result.error;
    }

    if (subError) {
      console.error('[Push] Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push] No push subscriptions found');
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Push] Found ${subscriptions.length} subscription(s)`);

    const notificationPayload = JSON.stringify({
      title,
      body,
      type,
      url: url || '/',
      conversationId,
      location,
      icon: '/icon-192x192.png',
      tag: `${type}-${conversationId || 'general'}`
    });

    const results = [];

    for (const sub of subscriptions) {
      try {
        console.log(`[Push] Sending to endpoint: ${sub.endpoint.substring(0, 50)}...`);
        
        const endpointUrl = new URL(sub.endpoint);
        const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

        // Create VAPID JWT
        const vapidJwt = await createVapidJwt(audience, vapidPrivateKey, vapidPublicKey);
        
        // Encrypt payload
        const { encrypted, salt, serverPublicKey } = await encryptPayload(
          notificationPayload,
          sub.p256dh,
          sub.auth
        );

        // Build the encrypted body
        const encryptedBody = buildAes128gcmBody(encrypted, salt, serverPublicKey);

        // Send the push notification
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'Content-Length': encryptedBody.length.toString(),
            'TTL': '86400',
            'Urgency': 'high',
            'Authorization': `vapid t=${vapidJwt}, k=${vapidPublicKey}`
          },
          body: encryptedBody.buffer as ArrayBuffer
        });

        if (response.status === 201 || response.status === 200) {
          console.log('[Push] Notification sent successfully');
          results.push({ endpoint: sub.endpoint, success: true });
        } else if (response.status === 410 || response.status === 404 || response.status === 401 || response.status === 403) {
          // 410/404: expired, 401/403: VAPID mismatch - remove invalid subscription
          console.log(`[Push] Subscription invalid (${response.status}), removing...`);
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
          results.push({ endpoint: sub.endpoint, success: false, reason: 'invalid_subscription' });
        } else {
          const errorText = await response.text();
          console.error(`[Push] Failed with status ${response.status}: ${errorText}`);
          results.push({ endpoint: sub.endpoint, success: false, reason: `status ${response.status}: ${errorText}` });
        }
      } catch (pushError) {
        console.error('[Push] Error sending push:', pushError);
        results.push({ endpoint: sub.endpoint, success: false, reason: String(pushError) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Push] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
