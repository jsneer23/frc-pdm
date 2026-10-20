import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { TextField } from "../fields/TextField";

type EmailFormErrors = Partial<Record<"email", string>>;
type TokenFormErrors = Partial<Record<"token", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function failRegexEmail(email: string) {
	return !EMAIL_PATTERN.test(email.trim());
}

type EmailFormProps = {
	setFormState: React.Dispatch<React.SetStateAction<"email" | "token">>;
	setFormEmail: React.Dispatch<React.SetStateAction<string>>;
};

function EmailForm({ setFormState, setFormEmail }: EmailFormProps) {
	const [email, setLocalEmail] = useState("");
	const [errors, setErrors] = useState<EmailFormErrors>({});

	function clearError(...fields: (keyof EmailFormErrors)[]) {
		setErrors((prev) => {
			const next = { ...prev };
			for (const field of fields) next[field] = undefined;
			return next;
		});
	}

	async function handleEmailSubmit(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		const nextErrors: EmailFormErrors = {};

		if (failRegexEmail(email)) {
			nextErrors.email = "Enter a valid email.";
			return;
		}

		const { error: emailError } = await supabase.auth.signInWithOtp({
			email,
			options: { shouldCreateUser: false },
		});

		const request = {
			msg: "sent request to supabase",
			email: email,
		};

		console.log(request);

		if (emailError != null) {
			nextErrors.email = "Unable to sign in. Supabase may be down.";
		} else {
			setFormEmail(email);
			setFormState("token");
		}
	}

	return (
		<form
			onSubmit={handleEmailSubmit}
			noValidate
			className="flex flex-col gap-6"
		>
			<CardHeader>
				<TextField
					id="email"
					label="Email"
					value={email}
					onChange={(value) => {
						setLocalEmail(value);
						clearError("email");
					}}
					error={errors.email}
				/>
			</CardHeader>
			<CardFooter>
				<Button type="submit" className="w-full">
					Submit Email
				</Button>
			</CardFooter>
		</form>
	);
}

function TokenForm({ email }: { email: string }) {
	const [token, setToken] = useState("");
	const [errors, setErrors] = useState<TokenFormErrors>({});

	function clearError(...fields: (keyof TokenFormErrors)[]) {
		setErrors((prev) => {
			const next = { ...prev };
			for (const field of fields) next[field] = undefined;
			return next;
		});
	}

	async function handleTokenSubmit(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		const nextErrors: TokenFormErrors = {};

		if (token == null) {
			nextErrors.token = "Enter your one time password.";
			return;
		}

		const request = {
			msg: "sent request to supabase",
			email: email,
		};

		console.log(request);

		const { error: otpError } = await supabase.auth.verifyOtp({
			email: email,
			token: token,
			type: "email",
		});

		if (otpError != null) {
			nextErrors.token = "Unable to sign in. Token incorrect.";
			console.log("Unable to sign in. Token incorrect.");
		}
	}

	return (
		<form
			onSubmit={handleTokenSubmit}
			noValidate
			className="flex flex-col gap-6"
		>
			<CardHeader>
				<TextField
					id="token"
					label="One Time Password"
					value={token}
					onChange={(value) => {
						setToken(value);
						clearError("token");
					}}
					error={errors.token}
				/>
			</CardHeader>
			<CardFooter>
				<Button type="submit" className="w-full">
					Submit Token
				</Button>
			</CardFooter>
		</form>
	);
}

export async function LoginForm() {
	const [formState, setFormState] = useState<"email" | "token">("email");
	const [email, setFormEmail] = useState("");

	return (
		<Card>
			{formState === "email" && (
				<EmailForm setFormState={setFormState} setFormEmail={setFormEmail} />
			)}
			{formState === "token" && <TokenForm email={email} />}
		</Card>
	);
}
