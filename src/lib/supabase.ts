import type { createClient as createClientType } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Force CJS import to avoid ESM wrapper issues in Vercel
// @ts-ignore
const { createClient } = require('@supabase/supabase-js');

export const supabase = (createClient as typeof createClientType)<Database>(supabaseUrl, supabaseKey);