import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Field, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { BrandHeader } from "@/features/cards/BrandHeader";
import { TextField } from "@/features/fields/TextField";
import { cn } from "@/lib/utils";
import { COMMENTS, CommentToggle } from "./CommentToggle";
import { autoPlusOne, Coral, telePlusOne } from "./Coral";
import { HoldButton } from "./HoldButton";
import { fetchTeam } from "./TBA";

const EVENT_CODES = [
	{ value: "2026cacac", label: "Contra Costa" },
	{ value: "2027casnf", label: "San Francisco" },
	{ value: "2027caetb", label: "East Bay" },
	{ value: "2027cancmp", label: "NorCal DCMP" },
] as const;

const POSITIONS = [
	{ value: "R1", label: "R1" },
	{ value: "R2", label: "R2" },
	{ value: "R3", label: "R3" },
	{ value: "B1", label: "B1" },
	{ value: "B2", label: "B2" },
	{ value: "B3", label: "B3" },
] as const;

export type EventCode = (typeof EVENT_CODES)[number]["value"];
type Position = (typeof POSITIONS)[number]["value"];

export function ScoutingForm() {
	const [tab, setTab] = useState<"setup" | "auto" | "tele" | "qr" | "past">(
		"setup",
	);
	const [scouterName, setScouterName] = useState("");
	const [eventCode, setEventCode] = useState<EventCode | null>("2026cacac");
	const [matchNumber, setMatchNumber] = useState("");
	const [position, setPosition] = useState<Position | null>(null);
	const [confirmed, setConfirmed] = useState(false);
	const [notes, setNotes] = useState("");

	const canConfirm = Boolean(
		scouterName && eventCode && matchNumber && position,
	);

	const [autoCoral, setAutoCoral] = useState([0, 0, 0, 0]);
	const [teleCoral, setTeleCoral] = useState([0, 0, 0, 0]);

	const [endgame, setEndgame] = useState("");

	const [comments, setComments] = useState<string[]>([]);

	const [team, setTeam] = useState<string | null>(null);
	const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

	useEffect(() => {
		if (!eventCode || !matchNumber || !position) return;

		let ignore = false;
		setStatus("loading");

		fetchTeam(eventCode, matchNumber, position)
			.then((t) => {
				if (!ignore) {
					setTeam(t);
					setStatus("idle");
				}
			})
			.catch(() => {
				if (!ignore) {
					setTeam(null);
					setStatus("error");
				}
			});

		return () => {
			ignore = true;
		};
	}, [eventCode, matchNumber, position]);

	let message: string;
	if (status === "loading") message = "Looking up…";
	else if (status === "error") message = "Couldn't find that match";
	else if (team) message = team;
	else message = "Pick an event, match, and position";

	const row = [
		...autoCoral,
		...teleCoral,
		endgame,
		...COMMENTS.map((c) => (comments.includes(c) ? 1 : 0)),
	].join("\t");

	type SavedMatch = {
		scouter: string;
		key: string;
		team: string;
		row: string;
		notes: string;
		savedAt: number; // Date.now()
	};

	const [saved, setSaved] = useState<SavedMatch[]>(() => {
		try {
			return JSON.parse(localStorage.getItem("savedMatches") ?? "[]");
		} catch {
			return [];
		}
	});

	useEffect(() => {
		localStorage.setItem("savedMatches", JSON.stringify(saved));
	}, [saved]);

	const matchKey = `${eventCode}_qm${matchNumber}_${position}`;
	const isSaved = saved.some((m) => m.key === matchKey && m.row === row);

	const handleSave = () => {
		const newEntry: SavedMatch = {
			scouter: scouterName,
			key: matchKey,
			team: team ?? "",
			row,
			notes: notes.replace(/[\t\n]/g, " "),
			savedAt: Date.now(),
		};
		setSaved((prev) => [
			newEntry,
			...prev.filter((m) => m.key !== newEntry.key),
		]);
	};

	function resetKeepMatchNumber() {
		setAutoCoral([0, 0, 0, 0]);
		setTeleCoral([0, 0, 0, 0]);
		setEndgame("");
		setComments([]);
		setConfirmed(false);
		setTab("setup");
		setNotes("");
	}

	function reset() {
		resetKeepMatchNumber();
		setMatchNumber((m) => String(Number(m) + 1));
	}

	return (
		<Card className="mx-auto w-full max-w-2xl gap-4">
			<BrandHeader
				title={"FRC 5507 Scouting Form"}
				description={"Generate a QR code with scouting data."}
			/>
			<CardContent>
				<Tabs value={tab} onValueChange={(v) => setTab(v)}>
					<TabsList className="mx-auto">
						<TabsTrigger value="setup">Setup</TabsTrigger>
						<TabsTrigger value="auto" disabled={!confirmed}>
							Auto
						</TabsTrigger>
						<TabsTrigger value="tele" disabled={!confirmed}>
							Teleop
						</TabsTrigger>
						<TabsTrigger value="qr" disabled={!confirmed}>
							QR
						</TabsTrigger>
						<TabsTrigger value="past">Past Matches</TabsTrigger>
					</TabsList>
					<TabsContent value="setup">
						<div className="grid grid-cols-2 gap-4">
							<TextField
								id="scouterName"
								label="Scouter Name"
								value={scouterName}
								onChange={(value) => {
									setScouterName(value);
								}}
							/>
							<Field>
								<FieldLabel>Event</FieldLabel>
								<Select
									value={eventCode}
									onValueChange={(code) => setEventCode(code)}
									items={EVENT_CODES}
								>
									<SelectTrigger
										aria-label="Event Code"
										className={cn(
											buttonVariants({ variant: "ghost", size: "sm" }),
											"w-auto bg-transparent data-placeholder:text-foreground",
											eventCode !== null &&
												"border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary dark:hover:bg-primary/20 aria-expanded:bg-primary/20 aria-expanded:text-primary",
										)}
									>
										<SelectValue placeholder="Select Event" />
									</SelectTrigger>
									<SelectContent>
										{EVENT_CODES.map((event) => (
											<SelectItem key={event.value} value={event.value}>
												{event.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
							<TextField
								id="matchNumber"
								label="Match Number"
								value={matchNumber}
								onChange={(value) => {
									setMatchNumber(value);
								}}
							/>
							<Field>
								<FieldLabel>Position</FieldLabel>
								<Select
									value={position}
									onValueChange={(code) => setPosition(code)}
									items={POSITIONS}
								>
									<SelectTrigger
										aria-label="Position"
										className={cn(
											buttonVariants({ variant: "ghost", size: "sm" }),
											"w-auto bg-transparent data-placeholder:text-foreground",
											position &&
												(position?.startsWith("R")
													? "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive dark:hover:bg-destructive/20 aria-expanded:bg-destructive/20 aria-expanded:text-destructive"
													: "border-blue-500/20 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500 dark:hover:bg-blue-500/20 aria-expanded:bg-blue-500/20 aria-expanded:text-blue-500"),
										)}
									>
										<SelectValue placeholder="Select Position" />
									</SelectTrigger>
									<SelectContent>
										{POSITIONS.map((event) => (
											<SelectItem key={event.value} value={event.value}>
												{event.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						</div>
						<div className="mt-6">
							<div className="flex flex-col items-center gap-4 rounded-lg border p-4">
								<span className="text-sm text-muted-foreground">
									You're Scouting Team:
								</span>
								<span className="text-3xl font-bold tabular-nums">
									{message}
								</span>
							</div>
						</div>
						<div className="mt-6 flex flex-col gap-4">
							<Field className="items-center">
								<FieldLabel className="justify-center">Match Ready?</FieldLabel>
								<HoldButton
									disabled={!canConfirm}
									onComplete={() => {
										resetKeepMatchNumber();
										setConfirmed(true);
										setTab("auto");
									}}
									idleLabel="Hold to confirm"
									doneLabel="Confirmed!"
									variant="primary"
								/>
							</Field>
						</div>
					</TabsContent>
					<TabsContent value="auto">
						<Coral
							levels={autoCoral}
							setLevels={setAutoCoral}
							increment={autoPlusOne}
						/>
					</TabsContent>
					<TabsContent value="tele" className="flex flex-col gap-8">
						<div className="grid grid-cols-2">
							<Field>
								<FieldLabel htmlFor="textarea-message">Coral</FieldLabel>
								<Coral
									levels={teleCoral}
									setLevels={setTeleCoral}
									increment={telePlusOne}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="textarea-message">Climb</FieldLabel>
								<RadioGroup
									value={endgame}
									onValueChange={setEndgame}
									defaultValue="no_attempt"
									className="w-fit"
								>
									<div className="flex items-center gap-3">
										<RadioGroupItem value="no_attempt" id="r1" />
										<Label htmlFor="r1">No Attempt</Label>
									</div>
									<div className="flex items-center gap-3">
										<RadioGroupItem value="park" id="r2" />
										<Label htmlFor="r2">Park w/o Attempt</Label>
									</div>
									<div className="flex items-center gap-3">
										<RadioGroupItem value="shallow_fail" id="r3" />
										<Label htmlFor="r3">Shallow Attempt w/ Fail</Label>
									</div>
									<div className="flex items-center gap-3">
										<RadioGroupItem value="shallow_success" id="r4" />
										<Label htmlFor="r4">Shallow Success</Label>
									</div>
									<div className="flex items-center gap-3">
										<RadioGroupItem value="deep_fail" id="r5" />
										<Label htmlFor="r5">Deep Attempt w/Fail</Label>
									</div>
									<div className="flex items-center gap-3">
										<RadioGroupItem value="deep_success" id="r6" />
										<Label htmlFor="r6">Deep Success</Label>
									</div>
								</RadioGroup>
							</Field>
						</div>
						<Field>
							<FieldLabel htmlFor="textarea-message">Comments</FieldLabel>
							<ToggleGroup
								multiple
								variant="outline"
								value={comments}
								onValueChange={setComments}
								className="flex flex-wrap gap-2"
							>
								{COMMENTS.map((c) => (
									<CommentToggle key={c} comment={c} />
								))}
							</ToggleGroup>
						</Field>
						<Field>
							<FieldLabel htmlFor="textarea-message">Comments</FieldLabel>
							<Textarea
								id="textarea-message"
								placeholder="Type additional comments here."
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</Field>
					</TabsContent>
					<TabsContent value="qr">
						<div className="flex flex-col gap-6">
							<QRCodeSVG
								value={row}
								size={300}
								level="H"
								imageSettings={{
									src: "https://bicmztrblwpucysepkoq.supabase.co/storage/v1/object/public/images/Beakle.png",
									height: 70,
									width: 70,
									excavate: true,
								}}
								className="mx-auto"
							/>
							<div className="grid grid-cols-2">
								<Button onClick={handleSave}>Save QR Code</Button>
								<HoldButton
									disabled={!isSaved}
									onComplete={reset}
									idleLabel="Hold to Reset"
									doneLabel="Reset!"
									variant="destructive"
								/>
							</div>
						</div>
					</TabsContent>
					<TabsContent value="past">
						<Carousel className="mx-auto w-full max-w-xs">
							<CarouselContent>
								{saved.map((m) => {
									const [event, match, position] = m.key.split("_");
									return (
										<CarouselItem key={m.key}>
											<div className="flex flex-col items-center gap-2">
												<span className="text-xl font-bold">
													{event} {match.replace("qm", "Qual ")}: {m.team}
												</span>
												<span className="text-sm text-muted-foreground">
													Position: {position}
												</span>
												<span className="text-sm text-muted-foreground">
													Scouted By: {m.scouter}
												</span>
												<QRCodeSVG
													value={m.row}
													size={300}
													level="H"
													imageSettings={{
														src: "https://bicmztrblwpucysepkoq.supabase.co/storage/v1/object/public/images/Beakle.png",
														height: 70,
														width: 70,
														excavate: true,
													}}
													className="mx-auto"
												/>
											</div>
										</CarouselItem>
									);
								})}
							</CarouselContent>
							<CarouselPrevious />
							<CarouselNext />
						</Carousel>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
