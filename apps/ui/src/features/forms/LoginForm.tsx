import {
	type AuthError,
	isAuthApiError,
	isAuthRetryableFetchError,
} from "@supabase/supabase-js";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { BrandHeader } from "../cards/BrandHeader";
import { TextField } from "../fields/TextField";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function failRegexEmail(email: string) {
	return !EMAIL_PATTERN.test(email);
}

type EmailFormProps = {
	onCodeSent: (email: string) => void;
};

function messageForEmailError(error: AuthError): string {
	if (isAuthRetryableFetchError(error)) {
		return "Couldn't reach the server. Supabase may be down. Please contact and admin if this persists.";
	}
	if (isAuthApiError(error)) {
		switch (error.code) {
			case "otp_disabled":
				return "Unable to sign in. This email isn't registered.";
			case "over_email_send_rate_limit":
				return "A code has already been sent. Please try again in a few minutes.";
			case "over_request_rate_limit":
				return "Too many sign in attempts. Please try again in a few minutes.";
		}
	}
	return "Unknown error. Please try again.";
}

function messageForTokenError(error: AuthError): string {
	if (isAuthRetryableFetchError(error)) {
		return "Couldn't reach the server. Supabase may be down. Please contact and admin if this persists.";
	}
	if (isAuthApiError(error)) {
		switch (error.code) {
			case "otp_expired":
				return "Code is incorrect or has expired.";
			case "over_request_rate_limit":
				return "Too many sign in attempts. Please try again in a few minutes.";
		}
	}
	return "Something went wrong. Please try again.";
}

function EmailForm({ onCodeSent }: EmailFormProps) {
	const [email, setLocalEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);

	async function handleEmailSubmit(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		if (isSubmitting) return;

		setLocalEmail(email.trim());

		if (failRegexEmail(email)) {
			setError("Enter a valid email.");
			return;
		}

		setIsSubmitting(true);
		try {
			const { error: emailError } = await supabase.auth.signInWithOtp({
				email: email,
				options: { shouldCreateUser: false },
			});

			if (emailError != null) {
				console.error(
					"signInWithOtp failed:",
					emailError,
					"error code:",
					emailError.code,
				);
				setError(messageForEmailError(emailError));
			} else {
				onCodeSent(email);
			}
		} catch (err) {
			console.error(err);
			setError("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form
			onSubmit={handleEmailSubmit}
			noValidate
			className="flex flex-col gap-6"
		>
			<CardContent>
				<TextField
					id="email"
					label="Email"
					value={email}
					onChange={(value) => {
						setLocalEmail(value);
						setError(undefined);
					}}
					error={error}
				/>
			</CardContent>
			<CardFooter>
				<Button type="submit" className="w-full">
					Submit Email
				</Button>
			</CardFooter>
		</form>
	);
}

function TokenForm({ email, onBack }: { email: string; onBack: () => void }) {
	const [token, setToken] = useState<string | null>(null);
	const [error, setError] = useState<string | undefined>(undefined);

	async function handleTokenSubmit(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		if (token == null) {
			setError("Enter your one time password.");
			return;
		}

		try {
			const { error: otpError } = await supabase.auth.verifyOtp({
				email: email,
				token: token,
				type: "email",
			});

			if (otpError != null) {
				console.error(
					"verifyOtp failed:",
					otpError.code,
					"error code:",
					otpError,
				);
				setError(messageForTokenError(otpError));
			}
		} catch (err) {
			console.log(err);
		}
	}

	return (
		<form
			onSubmit={handleTokenSubmit}
			noValidate
			className="flex flex-col gap-6"
		>
			<CardContent>
				<TextField
					id="token"
					label="One Time Password"
					value={token == null ? "" : token}
					onChange={(value) => {
						setToken(value);
						setError(undefined);
					}}
					error={error}
				/>
			</CardContent>
			<CardFooter>
				<Button type="submit" className="w-full">
					Submit Token
				</Button>
				<Button type="button" variant="ghost" onClick={onBack}>
					Use a different email
				</Button>
			</CardFooter>
		</form>
	);
}

export function LoginForm() {
	const [email, setEmail] = useState<string | null>(null);

	return (
		<Card>
			<BrandHeader
				description={
					email === null
						? "Sign in with your school email."
						: `Enter the code sent to ${email}.`
				}
			/>
			{email === null ? (
				<EmailForm onCodeSent={setEmail} />
			) : (
				<TokenForm email={email} onBack={() => setEmail(null)} />
			)}
		</Card>
	);
}
