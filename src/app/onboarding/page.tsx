import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();

  // If user already has a profile, redirect to dashboard
  if (session?.user?.id) {
    const profile = await db.query.userProfiles.findFirst({
      where: (p, { eq }) => eq(p.userId, session.user!.id!),
    });
    if (profile) redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Welcome to gx-pd</h1>
        <p className="mt-2 text-muted-foreground">
          Set up your profile and competency framework to get started
        </p>
      </div>
      <OnboardingForm isSignedIn={!!session?.user} />
    </div>
  );
}
