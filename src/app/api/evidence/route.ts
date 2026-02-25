import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { evidenceItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db.query.evidenceItems.findMany({
    where: eq(evidenceItems.userId, session.user.id),
    with: { competencyMap: { with: { competency: true } } },
    orderBy: [desc(evidenceItems.createdAt)],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const [item] = await db
    .insert(evidenceItems)
    .values({
      userId: session.user.id,
      title: body.title,
      description: body.description,
      link: body.link || null,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
