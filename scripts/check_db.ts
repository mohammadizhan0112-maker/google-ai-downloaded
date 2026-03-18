import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .like('sender', 'system_settings%');
  console.log('Settings rows:', data?.length);
  console.log(data?.map(d => ({ id: d.id, sender: d.sender, created_at: d.created_at })));
  if (error) console.error(error);
}
check();
