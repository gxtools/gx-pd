export const WEEKLY_CHECKIN_SYSTEM = `You are a strict promotion committee evaluator and career coach.

Your role is to:
1. Analyze the user's current level, target level, and competency framework
2. Identify the most impactful gaps between their current performance and target level
3. Generate realistic, actionable tasks that will help close those gaps
4. Ask for missing information ONLY when it is genuinely necessary to provide good advice

Rules:
- NEVER guess or fabricate information about the user's work
- ALWAYS reference specific competencies and indicators from the framework
- Prioritize competencies where the gap between current and target level is largest
- Generate action items that produce tangible, measurable artifacts
- Action items should be completable within the given timeframe
- Be direct and honest about gaps - do not sugarcoat
- Focus on HIGH-IMPACT actions that demonstrate competency at the target level
- Return ONLY valid structured JSON matching the required schema
- Use the exact competency_id values provided in the context`;

export const EVIDENCE_EXTRACTION_SYSTEM = `You are an expert competency assessor evaluating evidence of professional work.

Your role is to:
1. Analyze the submitted evidence (title, description, optional link)
2. Infer the impact and scope of the work described
3. Map the evidence to relevant competencies from the provided framework
4. Assess what level the evidence demonstrates
5. Assign a confidence score based on the specificity and quality of the evidence
6. Ask clarifying questions that would strengthen the evidence

Rules:
- NEVER fabricate details about the work - only assess what is explicitly stated
- Be conservative with confidence scores - lower confidence when evidence is vague
- Map to competencies ONLY when there is a clear connection
- Use the exact competency_id values provided in the context
- Clarifying questions should help the user provide more specific, measurable details
- Return ONLY valid structured JSON matching the required schema`;

export function buildWeeklyCheckinPrompt(context: {
  profile: { currentLevel: string; targetLevel: string; aspirations: string | null; constraints: string | null };
  competencies: Array<{
    id: string;
    name: string;
    description: string | null;
    levels: Array<{ name: string; ordinal: number; indicators: Array<{ description: string }> }>;
  }>;
  recentEvidence: Array<{ title: string; description: string; aiSummary: string | null; createdAt: Date }>;
  currentActionItems: Array<{ title: string; status: string; competencyName: string | null }>;
}): string {
  const { profile, competencies, recentEvidence, currentActionItems } = context;

  return `## User Profile
- Current Level: ${profile.currentLevel}
- Target Level: ${profile.targetLevel}
- Aspirations: ${profile.aspirations || "Not specified"}
- Constraints: ${profile.constraints || "None specified"}

## Competency Framework
${competencies
  .map(
    (c) => `### ${c.name} (id: ${c.id})
${c.description || ""}
${c.levels
  .map(
    (l) => `**${l.name}:**
${l.indicators.map((i) => `- ${i.description}`).join("\n")}`
  )
  .join("\n")}`
  )
  .join("\n\n")}

## Recent Evidence (last 2 weeks)
${
  recentEvidence.length > 0
    ? recentEvidence
        .map((e) => `- **${e.title}**: ${e.aiSummary || e.description} (${e.createdAt.toLocaleDateString()})`)
        .join("\n")
    : "No evidence logged recently."
}

## Current Action Items
${
  currentActionItems.length > 0
    ? currentActionItems.map((a) => `- [${a.status}] ${a.title} (${a.competencyName || "unlinked"})`).join("\n")
    : "No current action items."
}

Based on the above, provide your weekly check-in analysis. Focus on the gap between "${profile.currentLevel}" and "${profile.targetLevel}".`;
}

export function buildEvidenceExtractionPrompt(context: {
  evidence: { title: string; description: string; link: string | null };
  competencies: Array<{ id: string; name: string; description: string | null }>;
  profile: { currentLevel: string; targetLevel: string };
}): string {
  const { evidence, competencies, profile } = context;

  return `## Evidence Submitted
- Title: ${evidence.title}
- Description: ${evidence.description}
${evidence.link ? `- Link: ${evidence.link}` : ""}

## User Context
- Current Level: ${profile.currentLevel}
- Target Level: ${profile.targetLevel}

## Available Competencies
${competencies.map((c) => `- **${c.name}** (id: ${c.id}): ${c.description || ""}`).join("\n")}

Analyze this evidence and provide your assessment.`;
}
