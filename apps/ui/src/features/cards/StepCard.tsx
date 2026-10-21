export function StepCard({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2 rounded-lg border p-2">{children}</div>
	);
}
