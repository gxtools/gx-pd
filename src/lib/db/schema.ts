import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  real,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Auth tables (NextAuth) ──────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// ─── Orgs ────────────────────────────────────────────────────────────────────

export const orgs = pgTable("orgs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const orgMembers = pgTable(
  "org_members",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.orgId, table.userId] })]
);

// ─── User Profiles ───────────────────────────────────────────────────────────

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => orgs.id, { onDelete: "cascade" }),
  currentLevel: text("current_level").notNull(),
  targetLevel: text("target_level").notNull(),
  aspirations: text("aspirations"),
  constraints: text("constraints"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Competency Framework ────────────────────────────────────────────────────

export const frameworks = pgTable("frameworks", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => orgs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  rawText: text("raw_text"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const competencies = pgTable("competencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  frameworkId: uuid("framework_id")
    .notNull()
    .references(() => frameworks.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const levels = pgTable("levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  competencyId: uuid("competency_id")
    .notNull()
    .references(() => competencies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  ordinal: integer("ordinal").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const indicators = pgTable("indicators", {
  id: uuid("id").defaultRandom().primaryKey(),
  levelId: uuid("level_id")
    .notNull()
    .references(() => levels.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Action Items ────────────────────────────────────────────────────────────

export const actionItems = pgTable("action_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  competencyId: uuid("competency_id").references(() => competencies.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  expectedArtifact: text("expected_artifact"),
  dueDate: timestamp("due_date", { mode: "date" }),
  notes: text("notes"),
  aiRunId: uuid("ai_run_id"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Evidence ────────────────────────────────────────────────────────────────

export const evidenceItems = pgTable("evidence_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  link: text("link"),
  aiSummary: text("ai_summary"),
  aiImpact: text("ai_impact"),
  aiClaimedLevel: text("ai_claimed_level"),
  aiConfidence: real("ai_confidence"),
  aiFollowupQuestions: jsonb("ai_followup_questions").$type<string[]>(),
  aiRunId: uuid("ai_run_id"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const evidenceCompetencyMap = pgTable(
  "evidence_competency_map",
  {
    evidenceId: uuid("evidence_id")
      .notNull()
      .references(() => evidenceItems.id, { onDelete: "cascade" }),
    competencyId: uuid("competency_id")
      .notNull()
      .references(() => competencies.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.evidenceId, table.competencyId] })]
);

// ─── AI Runs ─────────────────────────────────────────────────────────────────

export const aiRuns = pgTable("ai_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'weekly_checkin' | 'evidence_extraction'
  input: jsonb("input"),
  output: jsonb("output"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  orgMemberships: many(orgMembers),
  actionItems: many(actionItems),
  evidenceItems: many(evidenceItems),
  aiRuns: many(aiRuns),
}));

export const orgsRelations = relations(orgs, ({ many }) => ({
  members: many(orgMembers),
  frameworks: many(frameworks),
  profiles: many(userProfiles),
}));

export const orgMembersRelations = relations(orgMembers, ({ one }) => ({
  org: one(orgs, { fields: [orgMembers.orgId], references: [orgs.id] }),
  user: one(users, { fields: [orgMembers.userId], references: [users.id] }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
  org: one(orgs, { fields: [userProfiles.orgId], references: [orgs.id] }),
}));

export const frameworksRelations = relations(frameworks, ({ one, many }) => ({
  org: one(orgs, { fields: [frameworks.orgId], references: [orgs.id] }),
  competencies: many(competencies),
}));

export const competenciesRelations = relations(
  competencies,
  ({ one, many }) => ({
    framework: one(frameworks, {
      fields: [competencies.frameworkId],
      references: [frameworks.id],
    }),
    levels: many(levels),
    actionItems: many(actionItems),
    evidenceMap: many(evidenceCompetencyMap),
  })
);

export const levelsRelations = relations(levels, ({ one, many }) => ({
  competency: one(competencies, {
    fields: [levels.competencyId],
    references: [competencies.id],
  }),
  indicators: many(indicators),
}));

export const indicatorsRelations = relations(indicators, ({ one }) => ({
  level: one(levels, {
    fields: [indicators.levelId],
    references: [levels.id],
  }),
}));

export const actionItemsRelations = relations(actionItems, ({ one }) => ({
  user: one(users, { fields: [actionItems.userId], references: [users.id] }),
  competency: one(competencies, {
    fields: [actionItems.competencyId],
    references: [competencies.id],
  }),
}));

export const evidenceItemsRelations = relations(
  evidenceItems,
  ({ one, many }) => ({
    user: one(users, {
      fields: [evidenceItems.userId],
      references: [users.id],
    }),
    competencyMap: many(evidenceCompetencyMap),
  })
);

export const evidenceCompetencyMapRelations = relations(
  evidenceCompetencyMap,
  ({ one }) => ({
    evidence: one(evidenceItems, {
      fields: [evidenceCompetencyMap.evidenceId],
      references: [evidenceItems.id],
    }),
    competency: one(competencies, {
      fields: [evidenceCompetencyMap.competencyId],
      references: [competencies.id],
    }),
  })
);

export const aiRunsRelations = relations(aiRuns, ({ one }) => ({
  user: one(users, { fields: [aiRuns.userId], references: [users.id] }),
}));
