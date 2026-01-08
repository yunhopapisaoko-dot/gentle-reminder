import { supabase } from '../../supabase';

interface SendPushParams {
  userId: string;
  title: string;
  body: string;
  type: 'private_message' | 'chat_message' | 'notification';
  url?: string;
  conversationId?: string;
  location?: string;
}

export async function sendPushNotification(params: SendPushParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: params
    });

    if (error) {
      console.error('Error sending push notification:', error);
      return false;
    }

    console.log('Push notification sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// Envia push notification para todos os usuários EXCETO os especificados
export async function sendPushToAllExcept(
  senderId: string,
  title: string,
  body: string,
  type: 'chat_message' | 'notification',
  location?: string,
  excludeUserIds?: string[]
): Promise<boolean> {
  try {
    // Combine senderId with additional excluded users (those present in chat)
    const allExcluded = excludeUserIds 
      ? [senderId, ...excludeUserIds.filter(id => id !== senderId)]
      : [senderId];
    
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        broadcastExcept: allExcluded,
        title,
        body,
        type,
        location,
        url: '/'
      }
    });

    if (error) {
      console.error('Error sending broadcast push notification:', error);
      return false;
    }

    console.log('Broadcast push notification sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending broadcast push notification:', error);
    return false;
  }
}

// Helper to get user's display name from profile
export async function getUserDisplayName(userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('user_id', userId)
    .single();
  
  return data?.full_name || data?.username || 'Alguém';
}
