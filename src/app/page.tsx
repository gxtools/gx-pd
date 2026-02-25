import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/onboarding");
  }

  const profile = await db.query.userProfiles.findFirst({
    where: (p, { eq }) => eq(p.userId, session.user!.id!),
  });

  if (!profile) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
