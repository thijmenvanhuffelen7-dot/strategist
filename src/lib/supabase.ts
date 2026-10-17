import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && anonKey)

// Placeholder-waarden voorkomen een crash; de app toont dan het setup-scherm.
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing')
