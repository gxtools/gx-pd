import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "@/lib/db";
import { aiRuns, actionItems, evidenceItems, evidenceCompetencyMap } from "@/lib/db/schema";
import { weeklyCheckinSchema, evidenceExtractionSchema } from "./schemas";
import {
  WEEKLY_CHECKIN_SYSTEM,
  EVIDENCE_EXTRACTION_SYSTEM,
  buildWeeklyCheckinPrompt,
  buildEvidenceExtractionPrompt,
} from "./prompts";
import { eq } from "drizzle-orm";
import { addDays, subDays } from "date-fns";
import type { WeeklyCheckinOutput, EvidenceExtractionOutput } from "./schemas";

const model = openai("gpt-4o");

export async function runWeeklyCheckin(userId: string): Promise<{
  result: WeeklyCheckinOutput;
  aiRunId: string;
}> {
  // Gather context
  const profile = await db.query.userProfiles.findFirst({
    where: (p, { eq }) => eq(p.userId, userId),
  });
  if (!profile) throw new Error("User profile not found");

  const framework = await db.query.frameworks.findFirst({
    where: (f, { eq }) => eq(f.orgId, profile.orgId),
  });
  if (!framework) throw new Error("No competency framework found");

  const competenciesData = await db.query.competencies.findMany({
    where: (c, { eq }) => eq(c.frameworkId, framework.id),
    with: {
      levels: {
        with: { indicators: true },
        orderBy: (l, { asc }) => [asc(l.ordinal)],
      },
    },
  });

  const twoWeeksAgo = subDays(new Date(), 14);
  const recentEvidence = await db.query.evidenceItems.findMany({
    where: (e, { eq, gte, and }) =>
      and(eq(e.userId, userId), gte(e.createdAt, twoWeeksAgo)),
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });

  const currentActionItemsData = await db.query.actionItems.findMany({
    where: (a, { eq, and, not }) =>
      and(eq(a.userId, userId), not(eq(a.status, "done"))),
    with: { competency: true },
  });

  const prompt = buildWeeklyCheckinPrompt({
    profile: {
      currentLevel: profile.currentLevel,
      targetLevel: profile.targetLevel,
      aspirations: profile.aspirations,
      constraints: profile.constraints,
    },
    competencies: competenciesData.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      levels: c.levels.map((l) => ({
        name: l.name,
        ordinal: l.ordinal,
        indicators: l.indicators.map((i) => ({ description: i.description })),
      })),
    })),
    recentEvidence: recentEvidence.map((e) => ({
      title: e.title,
      description: e.description,
      aiSummary: e.aiSummary,
      createdAt: e.createdAt,
    })),
    currentActionItems: currentActionItemsData.map((a) => ({
      title: a.title,
      status: a.status,
      competencyName: a.competency?.name ?? null,
    })),
  });

  const { output: result } = await generateText({
    model,
    output: Output.object({ schema: weeklyCheckinSchema }),
    system: WEEKLY_CHECKIN_SYSTEM,
    prompt,
  });

  if (!result) throw new Error("AI returned no output");

  // Store AI run
  const [aiRun] = await db
    .insert(aiRuns)
    .values({
      userId,
      type: "weekly_checkin",
      input: { prompt },
      output: result,
    })
    .returning();

  // Create action items from result
  const now = new Date();
  for (const item of result.action_items) {
    // Validate competency_id exists
    const competencyExists = competenciesData.find(
      (c) => c.id === item.competency_id
    );

    await db.insert(actionItems).values({
      userId,
      competencyId: competencyExists ? item.competency_id : null,
      title: item.title,
      description: item.description,
      status: "todo",
      priority: item.priority,
      expectedArtifact: item.expected_artifact,
      dueDate: addDays(now, item.due_in_days),
      aiRunId: aiRun.id,
    });
  }

  return { result, aiRunId: aiRun.id };
}

export async function extractEvidence(
  userId: string,
  evidenceId: string
): Promise<{
  result: EvidenceExtractionOutput;
  aiRunId: string;
}> {
  const evidence = await db.query.evidenceItems.findFirst({
    where: (e, { eq }) => eq(e.id, evidenceId),
  });
  if (!evidence) throw new Error("Evidence not found");

  const profile = await db.query.userProfiles.findFirst({
    where: (p, { eq }) => eq(p.userId, userId),
  });
  if (!profile) throw new Error("User profile not found");

  const framework = await db.query.frameworks.findFirst({
    where: (f, { eq }) => eq(f.orgId, profile.orgId),
  });
  if (!framework) throw new Error("No competency framework found");

  const competenciesData = await db.query.competencies.findMany({
    where: (c, { eq }) => eq(c.frameworkId, framework.id),
  });

  const prompt = buildEvidenceExtractionPrompt({
    evidence: {
      title: evidence.title,
      description: evidence.description,
      link: evidence.link,
    },
    competencies: competenciesData.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
    })),
    profile: {
      currentLevel: profile.currentLevel,
      targetLevel: profile.targetLevel,
    },
  });

  const { output: result } = await generateText({
    model,
    output: Output.object({ schema: evidenceExtractionSchema }),
    system: EVIDENCE_EXTRACTION_SYSTEM,
    prompt,
  });

  if (!result) throw new Error("AI returned no output");

  // Store AI run
  const [aiRun] = await db
    .insert(aiRuns)
    .values({
      userId,
      type: "evidence_extraction",
      input: { prompt },
      output: result,
    })
    .returning();

  // Update evidence with AI results
  await db
    .update(evidenceItems)
    .set({
      aiSummary: result.summary,
      aiImpact: result.impact,
      aiClaimedLevel: result.claimed_level,
      aiConfidence: result.confidence,
      aiFollowupQuestions: result.followup_questions,
      aiRunId: aiRun.id,
    })
    .where(eq(evidenceItems.id, evidenceId));

  // Create competency mappings
  for (const comp of result.suggested_competencies) {
    const competencyExists = competenciesData.find(
      (c) => c.id === comp.competency_id
    );
    if (competencyExists) {
      await db
        .insert(evidenceCompetencyMap)
        .values({
          evidenceId,
          competencyId: comp.competency_id,
        })
        .onConflictDoNothing();
    }
  }

  return { result, aiRunId: aiRun.id };
}
