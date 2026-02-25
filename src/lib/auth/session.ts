import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/onboarding");
  }
  return session.user as { id: string; email: string; name: string };
}

export async function requireProfile() {
  const user = await requireUser();
  const profile = await db.query.userProfiles.findFirst({
    where: (p, { eq }) => eq(p.userId, user.id),
  });
  if (!profile) {
    redirect("/onboarding");
  }
  return { user, profile };
}
