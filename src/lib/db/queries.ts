import { db } from ".";
import * as schema from "./schema";
import { eq, and, desc, not } from "drizzle-orm";

export async function getUserProfile(userId: string) {
  return db.query.userProfiles.findFirst({
    where: eq(schema.userProfiles.userId, userId),
  });
}

export async function getFrameworkForOrg(orgId: string) {
  return db.query.frameworks.findFirst({
    where: eq(schema.frameworks.orgId, orgId),
    with: {
      competencies: {
        with: {
          levels: {
            with: { indicators: true },
            orderBy: (l, { asc }) => [asc(l.ordinal)],
          },
          actionItems: true,
          evidenceMap: {
            with: { evidence: true },
          },
        },
      },
    },
  });
}

export async function getActionItemsForUser(userId: string) {
  return db.query.actionItems.findMany({
    where: eq(schema.actionItems.userId, userId),
    with: { competency: true },
    orderBy: [desc(schema.actionItems.createdAt)],
  });
}

export async function getActiveActionItems(userId: string) {
  return db.query.actionItems.findMany({
    where: and(
      eq(schema.actionItems.userId, userId),
      not(eq(schema.actionItems.status, "done"))
    ),
    with: { competency: true },
    orderBy: [desc(schema.actionItems.createdAt)],
  });
}

export async function getEvidenceForUser(userId: string) {
  return db.query.evidenceItems.findMany({
    where: eq(schema.evidenceItems.userId, userId),
    with: { competencyMap: { with: { competency: true } } },
    orderBy: [desc(schema.evidenceItems.createdAt)],
  });
}

export async function getLatestAiRun(userId: string, type: string) {
  return db.query.aiRuns.findFirst({
    where: and(
      eq(schema.aiRuns.userId, userId),
      eq(schema.aiRuns.type, type)
    ),
    orderBy: [desc(schema.aiRuns.createdAt)],
  });
}
