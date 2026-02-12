import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        "CRITICAL ERROR: Supabase environment variables are missing!\n" +
        "Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.\n" +
        "Current values: URL=" + supabaseUrl + ", KEY=" + (supabaseAnonKey ? "PRESENT" : "MISSING")
    );
}

// Fallback to empty strings to prevent initialization crash, 
// though calls will still fail until env vars are fixed.
export const supabase = createClient(
    supabaseUrl || "",
    supabaseAnonKey || ""
);
