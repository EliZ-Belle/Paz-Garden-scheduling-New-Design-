import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const SUPABASE_URL = 'https://abqwcjanlrdujevnkgtw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zUuoVThvRG_yjNCi_QREyQ_ii6RQdQy';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);