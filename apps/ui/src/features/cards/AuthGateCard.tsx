import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LoginForm } from "../forms/LoginForm";

export function AuthGate({ children }: { children: React.ReactNode }) {
	// if session is undefined still checking, if null then signed out
	const [session, setSession] = useState<Session | null | undefined>(undefined);

	useEffect(() => {
		// supabase will automatically call a listener function upon registration of said
		// listener with onAuthStateChange. no need to trigger this any other way.
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(
			// listener function - called whenever supabase detects auth state has changed
			// session starts undefined, and this sets it to Session if logged in or null
			// if logged out
			(_event, newSession) => {
				setSession(newSession);
			},
		);
		// react stores unsubscribe function as a cleanup to be called when component is unmounted
		// so that the supabase doesn't try to call a listener whose component no longer exists
		return () => subscription.unsubscribe();
		// notice that if there were no [] below, then useEffect would cause a loop because
		// 		1. the listener calls setSession(), which triggers react to rerender AuthGate
		// 		   because session changed (init: undefined but newSession: Session | null)
		//		2. without [], useEffect runs again at rerender, which causes a cleanup call to
		//		   unsubscribe and then a new useEffect registers a new instance of the listener function
		//		3. this can infinite loop when authenticated because each time a listener is
		// 		   registered it is called with a *new* Session object, triggering a rerender
		// 		   and thus another cleanup call and useEffect call, ad infinitum.
	}, []); // the [] ensures the effect only runs once

	// while still waiting for the session info don't render anything
	if (session === undefined) return null;
	// if session is unauthenticated (i.e. null) render the LoginForm
	else if (session === null) return <LoginForm />;
	return children;
}
