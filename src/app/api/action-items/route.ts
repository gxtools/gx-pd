import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { actionItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db.query.actionItems.findMany({
    where: eq(actionItems.userId, session.user.id),
    with: { competency: true },
    orderBy: [desc(actionItems.createdAt)],
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
    .insert(actionItems)
    .values({
      userId: session.user.id,
      title: body.title,
      description: body.description,
      competencyId: body.competencyId || null,
      status: "todo",
      priority: body.priority || "medium",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
