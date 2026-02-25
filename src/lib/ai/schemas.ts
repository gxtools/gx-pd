import { z } from "zod";

export const actionItemSchema = z.object({
  title: z.string().describe("Clear, actionable title for the task"),
  description: z
    .string()
    .describe("Detailed description of what needs to be done"),
  competency_id: z
    .string()
    .describe("ID of the competency this action targets"),
  due_in_days: z
    .number()
    .int()
    .min(1)
    .max(30)
    .describe("Number of days until this should be completed"),
  expected_artifact: z
    .string()
    .describe("What tangible output is expected (e.g., 'PR merged', 'document written')"),
  priority: z.enum(["low", "medium", "high"]).describe("Priority level"),
});

export const weeklyCheckinSchema = z.object({
  focus_competencies: z
    .array(
      z.object({
        competency_id: z.string(),
        competency_name: z.string(),
        gap_description: z.string().describe("What gap exists vs target level"),
      })
    )
    .min(1)
    .max(3)
    .describe("Top 1-3 competencies to focus on this week"),
  action_items: z
    .array(actionItemSchema)
    .min(3)
    .max(5)
    .describe("3-5 specific action items for this week"),
  missing_information_questions: z
    .array(z.string())
    .describe("Questions to ask the user if critical info is missing. Empty array if no info is missing."),
  reasoning: z
    .string()
    .describe("Brief explanation of why these focus areas and actions were chosen"),
});

export const evidenceExtractionSchema = z.object({
  summary: z.string().describe("Concise summary of the evidence"),
  impact: z.string().describe("Assessment of the impact and scope of this work"),
  suggested_competencies: z
    .array(
      z.object({
        competency_id: z.string(),
        competency_name: z.string(),
        relevance: z.string().describe("Why this evidence is relevant to this competency"),
      })
    )
    .describe("Competencies this evidence maps to"),
  claimed_level: z
    .string()
    .describe("The level this evidence demonstrates (e.g., 'Level 3 - Career / Senior')"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score 0-1 in the assessment"),
  followup_questions: z
    .array(z.string())
    .describe("Clarifying questions to strengthen the evidence"),
});

export type WeeklyCheckinOutput = z.infer<typeof weeklyCheckinSchema>;
export type EvidenceExtractionOutput = z.infer<typeof evidenceExtractionSchema>;
export type ActionItemOutput = z.infer<typeof actionItemSchema>;
