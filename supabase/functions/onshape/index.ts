import { type SupabaseContext, withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const path = new URL(req.url).pathname;

    if (req.method === "POST" && path.endsWith("/export")) {
      return await handleExport(ctx);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }),
};

async function handleExport(ctx: SupabaseContext): Promise<Response> {
  const userId = ctx.userClaims?.id;
  if (!userId) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  // ctx.supabase acts as the caller, so RLS applies. members is readable only
  // by members, so a non-member gets no row back.
  const { data: member, error } = await ctx.supabase
    .from("members")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Member lookup failed:", error);
    return Response.json(
      { error: "Could not check membership" },
      { status: 500 },
    );
  }

  if (member === null) {
    return Response.json({ error: "Not a team member" }, { status: 403 });
  }

  return Response.json({ partNumber: "26O-CHS-P001" });
}
