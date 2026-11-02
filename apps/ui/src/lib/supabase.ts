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

if (import.meta.env.DEV) {
	fetch(`${url}/auth/v1/health`, {
		headers: { apikey: key },
	}).catch(() => {
		console.warn(
			`Can't reach Supabase at ${url}. Is the local stack running? Check with \`supabase status\`.`,
		);
	});
}
