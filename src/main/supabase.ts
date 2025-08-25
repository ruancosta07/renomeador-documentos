import { SupabaseClient } from "@supabase/supabase-js";
// import {config} from "dotenv"
// config()
const supabase = new SupabaseClient(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_ANON_KEY as string)

export default supabase