import {
	Box,
	Cylinder,
	Layers,
	type LucideIcon,
	RectangleHorizontal,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { BrandHeader } from "./cards/BrandHeader";
import { PART_TYPES, type PartTypeId } from "./constants";
import { SheetForm } from "./forms/SheetForm";

const PART_TYPE_IDS = Object.keys(PART_TYPES) as PartTypeId[];

const PART_TYPE_ICONS = {
	sheet: Layers,
	extrusion: RectangleHorizontal,
	print_3d: Box,
	shaft_stock: Cylinder,
} satisfies Record<PartTypeId, LucideIcon>;

const PART_TYPE_FORMS = {
	sheet: SheetForm,
	extrusion: SheetForm,
	print_3d: SheetForm,
	shaft_stock: SheetForm,
} satisfies Record<PartTypeId, React.ComponentType>;

export function PartRequestPage() {
	const [partType, setPartType] = useState<PartTypeId>("sheet");

	async function handleSignOut() {
		const { error } = await supabase.auth.signOut({ scope: "local" });
		if (error) {
			console.error(error);
		}
	}

	return (
		<Card className="mx-auto w-full max-w-lg gap-4">
			<BrandHeader
				description={"Send a part to the production queue."}
				action={
					<Button
						variant="ghost"
						size="sm"
						className="ml-auto mr-6 bg-gray-100 hover:bg-destructive hover:text-white"
						onClick={handleSignOut}
					>
						Sign out
					</Button>
				}
			/>
			<CardContent>
				<Tabs
					value={partType}
					className="gap-4"
					onValueChange={(value) => setPartType(value as PartTypeId)}
				>
					<TabsList
						aria-label="Part type"
						className="grid w-full grid-cols-2 gap-1 rounded-xl group-data-horizontal/tabs:h-auto"
					>
						{PART_TYPE_IDS.map((id) => {
							const Icon = PART_TYPE_ICONS[id];
							return (
								<TabsTrigger
									key={id}
									value={id}
									className="h-auto justify-start gap-3 px-3 py-2 text-left"
								>
									<Icon aria-hidden="true" />
									<span className="flex flex-col">
										<span className="text-sm font-medium">
											{PART_TYPES[id].label}
										</span>
										<span className="text-xs text-muted-foreground">
											{PART_TYPES[id].description}
										</span>
									</span>
								</TabsTrigger>
							);
						})}
					</TabsList>

					{PART_TYPE_IDS.map((id) => {
						const Form = PART_TYPE_FORMS[id];
						return (
							<TabsContent key={id} value={id}>
								<Form />
							</TabsContent>
						);
					})}
				</Tabs>
			</CardContent>
		</Card>
	);
}
