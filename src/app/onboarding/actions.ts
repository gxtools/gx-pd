"use server";

import { signIn } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { parseFrameworkText } from "@/lib/db/parse-framework";
import { redirect } from "next/navigation";

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/onboarding" });
}

export async function completeOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const userId = session.user.id;
  const orgName = (formData.get("orgName") as string) || "Personal";
  const currentLevel = formData.get("currentLevel") as string;
  const targetLevel = formData.get("targetLevel") as string;
  const aspirations = formData.get("aspirations") as string;
  const constraints = formData.get("constraints") as string;
  const frameworkText = formData.get("frameworkText") as string;

  if (!currentLevel || !targetLevel) {
    throw new Error("Current level and target level are required");
  }

  // Create org
  const [org] = await db.insert(schema.orgs).values({ name: orgName }).returning();

  // Add user as org member
  await db.insert(schema.orgMembers).values({
    orgId: org.id,
    userId,
    role: "admin",
  });

  // Create user profile
  await db.insert(schema.userProfiles).values({
    userId,
    orgId: org.id,
    currentLevel,
    targetLevel,
    aspirations: aspirations || null,
    constraints: constraints || null,
  });

  // Parse and store framework if provided
  if (frameworkText?.trim()) {
    const [framework] = await db
      .insert(schema.frameworks)
      .values({
        orgId: org.id,
        name: `${orgName} Framework`,
        rawText: frameworkText,
      })
      .returning();

    const parsed = parseFrameworkText(frameworkText);

    for (const comp of parsed) {
      const [competency] = await db
        .insert(schema.competencies)
        .values({
          frameworkId: framework.id,
          name: comp.name,
          description: comp.description || null,
          category: comp.category || null,
        })
        .returning();

      for (const level of comp.levels) {
        const [levelRow] = await db
          .insert(schema.levels)
          .values({
            competencyId: competency.id,
            name: level.name,
            ordinal: level.ordinal,
          })
          .returning();

        for (const indicator of level.indicators) {
          await db.insert(schema.indicators).values({
            levelId: levelRow.id,
            description: indicator,
          });
        }
      }
    }
  }

  redirect("/dashboard");
}
