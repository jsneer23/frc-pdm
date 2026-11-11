import type { Session } from "@supabase/supabase-js";
import { createContext, use } from "react";

export const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
	const session = use(SessionContext);
	if (session === null) {
		throw new Error("useSession() must be used inside <AuthGate>.");
	}
	return session;
}
