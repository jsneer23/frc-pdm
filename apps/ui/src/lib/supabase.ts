import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
	throw new Error(
		"Missing Supabase values. Copy apps/ui/.env.example to apps/ui/.env.local.",
	);
}

export const supabase = createClient<Database>(url, key);
