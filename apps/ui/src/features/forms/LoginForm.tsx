import {
	type AuthError,
	isAuthApiError,
	isAuthRetryableFetchError,
} from "@supabase/supabase-js";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
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
		return "Couldn't reach the server. Supabase may be down. Please contact an admin if this persists.";
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
	return "Unknown error occurred. Please try again.";
}

function messageForTokenError(error: AuthError): string {
	if (isAuthRetryableFetchError(error)) {
		return "Couldn't reach the server. Supabase may be down. Please contact an admin if this persists.";
	}
	if (isAuthApiError(error)) {
		switch (error.code) {
			case "otp_expired":
				return "Code is incorrect or has expired.";
			case "over_request_rate_limit":
				return "Too many sign in attempts. Please try again in a few minutes.";
		}
	}
	return "Unknown error occurred. Please try again.";
}

function EmailForm({ onCodeSent }: EmailFormProps) {
	const [email, setLocalEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);

	async function handleEmailSubmit(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		if (isSubmitting) return;

		const trimmed = email.trim();

		if (failRegexEmail(trimmed)) {
			setError("Enter a valid email.");
			return;
		}

		setIsSubmitting(true);
		try {
			const { error: emailError } = await supabase.auth.signInWithOtp({
				email: trimmed,
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
				onCodeSent(trimmed);
			}
		} catch (err) {
			console.error(err);
			setError("Unknown error occurred. Please try again.");
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
				<Button type="submit" className="w-full" disabled={isSubmitting}>
					{isSubmitting ? "Sending..." : "Submit Email"}
				</Button>
			</CardFooter>
		</form>
	);
}

function TokenForm({ email }: { email: string }) {
	const [token, setToken] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);

	async function verify(code: string) {
		setIsSubmitting(true);

		try {
			const { error: otpError } = await supabase.auth.verifyOtp({
				email: email,
				token: code,
				type: "email",
			});

			setToken("");

			if (otpError != null) {
				console.error(
					"verifyOtp failed:",
					otpError,
					"error code:",
					otpError.code,
				);
				setError(messageForTokenError(otpError));
			}
		} catch (err) {
			console.error(err);
			setError("Unknown error occurred. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<CardContent>
			<div className="mx-auto flex w-fit flex-col gap-4">
				<InputOTP
					maxLength={8}
					pattern={REGEXP_ONLY_DIGITS}
					value={token}
					onChange={(value) => {
						setToken(value);
						setError(undefined);
					}}
					onComplete={verify}
					disabled={isSubmitting}
					aria-invalid={error !== undefined}
					aria-describedby={error !== undefined ? "token-error" : undefined}
					containerClassName="justify-center"
					autoFocus
				>
					<InputOTPGroup>
						{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
							<InputOTPSlot
								key={i}
								index={i}
								aria-invalid={error !== undefined}
								className="size-12 rounded-lg first:rounded-l-lg last:rounded-r-lg border-2 text-2xl font-bold"
							/>
						))}
					</InputOTPGroup>
				</InputOTP>
				{error && (
					<p id="token-error" role="alert" className="text-sm text-destructive">
						{error}
					</p>
				)}
			</div>
		</CardContent>
	);
}

export function LoginForm() {
	const [email, setEmail] = useState<string | null>(null);

	return (
		<Card>
			<BrandHeader
				title="FRC 5507 Onshape Part Exporter"
				description={
					email === null
						? "Sign in with your school email."
						: `Enter the code sent to ${email}.`
				}
				action={
					email !== null && (
						<Button
							type="button"
							variant="ghost"
							className="ml-auto mr-6 bg-gray-100 hover:bg-destructive hover:text-white"
							onClick={() => setEmail(null)}
						>
							Change email
						</Button>
					)
				}
			/>
			{email === null ? (
				<EmailForm onCodeSent={setEmail} />
			) : (
				<TokenForm email={email} />
			)}
		</Card>
	);
}
