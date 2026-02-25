import { requireProfile } from "@/lib/auth/session";
import { getActiveActionItems, getLatestAiRun } from "@/lib/db/queries";
import type { WeeklyCheckinOutput } from "@/lib/ai/schemas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeeklyCheckinButton } from "./weekly-checkin-button";
import { LogEvidenceButton } from "./log-evidence-button";
import Link from "next/link";

export default async function DashboardPage() {
  const { user, profile } = await requireProfile();

  const [actionItemsData, latestCheckin] = await Promise.all([
    getActiveActionItems(user.id),
    getLatestAiRun(user.id, "weekly_checkin"),
  ]);

  const checkinOutput = latestCheckin?.output as WeeklyCheckinOutput | null;

  const thisWeekItems = actionItemsData.filter((item) => item.status !== "done").slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {profile.currentLevel} → {profile.targetLevel}
          </p>
        </div>
        <div className="flex gap-3">
          <LogEvidenceButton />
          <WeeklyCheckinButton />
        </div>
      </div>

      {/* Focus Competencies */}
      {checkinOutput?.focus_competencies && checkinOutput.focus_competencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Focus Competencies</CardTitle>
            <CardDescription>Top areas to develop this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkinOutput.focus_competencies.map((fc, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    {i + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{fc.competency_name}</p>
                    <p className="text-sm text-muted-foreground">{fc.gap_description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* This Week's Action Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">This Week&apos;s Actions</CardTitle>
              <CardDescription>
                {thisWeekItems.length} active item{thisWeekItems.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Link
              href="/action-items"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {thisWeekItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No action items yet. Run a weekly check-in to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {thisWeekItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{item.title}</p>
                    {item.competency && (
                      <p className="text-xs text-muted-foreground">{item.competency.name}</p>
                    )}
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <Badge
                      variant={
                        item.priority === "high"
                          ? "destructive"
                          : item.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {item.priority}
                    </Badge>
                    <Badge variant="outline">{item.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missing Info Questions */}
      {checkinOutput?.missing_information_questions &&
        checkinOutput.missing_information_questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions for You</CardTitle>
              <CardDescription>
                The AI needs more information to provide better guidance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {checkinOutput.missing_information_questions.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="shrink-0 text-muted-foreground">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      {/* AI Reasoning */}
      {checkinOutput?.reasoning && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{checkinOutput.reasoning}</p>
            {latestCheckin && (
              <p className="mt-2 text-xs text-muted-foreground">
                Last run: {new Date(latestCheckin.createdAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!checkinOutput && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Run your first weekly check-in to get AI-powered guidance on your professional development.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
