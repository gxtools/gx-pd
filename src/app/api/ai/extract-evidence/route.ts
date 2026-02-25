import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractEvidence } from "@/lib/ai";
import { z } from "zod";

const bodySchema = z.object({
  evidenceId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { evidenceId } = bodySchema.parse(body);
    const { result, aiRunId } = await extractEvidence(session.user.id, evidenceId);
    return NextResponse.json({ result, aiRunId });
  } catch (error) {
    console.error("Evidence extraction error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
