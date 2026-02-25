import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.query.userProfiles.findFirst({
    where: (p, { eq }) => eq(p.userId, session.user!.id!),
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const framework = await db.query.frameworks.findFirst({
    where: (f, { eq }) => eq(f.orgId, profile.orgId),
    with: {
      competencies: {
        with: {
          levels: {
            with: { indicators: true },
            orderBy: (l, { asc }) => [asc(l.ordinal)],
          },
        },
      },
    },
  });

  if (!framework) {
    return NextResponse.json({ error: "Framework not found" }, { status: 404 });
  }

  return NextResponse.json(framework);
}
