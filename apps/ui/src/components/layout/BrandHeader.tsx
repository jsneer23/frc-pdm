import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type BrandHeaderProps = {
	title: string;
	description: string;
	action?: React.ReactNode;
};

export function BrandHeader({ title, description, action }: BrandHeaderProps) {
	return (
		<CardHeader className="flex items-center gap-4">
			<img
				src="https://bicmztrblwpucysepkoq.supabase.co/storage/v1/object/public/images/Beakle.png"
				width={62}
				alt="Team 5507"
				className="shrink-0 rounded-lg"
			/>
			<div className="grid gap-1.5">
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</div>
			{action}
		</CardHeader>
	);
}
