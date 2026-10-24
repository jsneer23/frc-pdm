import type { EventCode } from "./ScoutingForm";

const TBA_KEY = import.meta.env.VITE_TBA_API_KEY;

export async function fetchTeam(
	eventCode: EventCode,
	matchNumber: string,
	position: string,
) {
	const res = await fetch(
		`https://www.thebluealliance.com/api/v3/match/${eventCode}_qm${matchNumber}`,
		{
			headers: { "X-TBA-Auth-Key": TBA_KEY },
			signal: AbortSignal.timeout(5000),
		},
	);
	if (!res.ok) throw new Error(`TBA returned ${res.status}`);

	const match = await res.json();
	const alliance = position.startsWith("R") ? "red" : "blue";
	const index = Number(position[1]) - 1;
	return match.alliances[alliance].team_keys[index].replace("frc", "");
}
