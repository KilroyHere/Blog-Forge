import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

export async function initializeDatabase(): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase.from('posts').select('id').limit(1);
  
  if (error?.code === '42P01') {
    console.log('Posts table does not exist. Please create it in Supabase dashboard.');
  } else if (error) {
    console.error('Error checking posts table:', error.message);
  } else {
    console.log('Supabase connection established');
  }
}
