import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ltjtzyzxpxrbqiajafcm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0anR6eXp4cHhyYnFpYWphZmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjMzMjEsImV4cCI6MjA4MTY5OTMyMX0.p88hjvJLKGBHo373q3xoXFVSkB7w-XMqHLKMS092aN8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});
