import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runWeeklyCheckin } from "@/lib/ai";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { result, aiRunId } = await runWeeklyCheckin(session.user.id);
    return NextResponse.json({ result, aiRunId });
  } catch (error) {
    console.error("Weekly checkin error:", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
