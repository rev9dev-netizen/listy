import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
    console.warn('Supabase URL is not set. Define NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
}
if (!SUPABASE_ANON_KEY) {
    console.warn('Supabase anon key is not set. Define NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY')
}

export const supabase = createClient(
    SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY ?? '',
    {
        auth: { persistSession: false }
    }
)
