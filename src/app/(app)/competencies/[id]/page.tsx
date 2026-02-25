import { requireProfile } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CompetencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile();
  const { id } = await params;

  const competency = await db.query.competencies.findFirst({
    where: eq(schema.competencies.id, id),
    with: {
      levels: {
        with: { indicators: true },
        orderBy: (l, { asc }) => [asc(l.ordinal)],
      },
      actionItems: {
        with: { user: true },
        orderBy: (a, { desc }) => [desc(a.createdAt)],
      },
      evidenceMap: {
        with: { evidence: true },
      },
    },
  });

  if (!competency) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/competencies"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Competencies
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{competency.name}</h1>
        {competency.category && (
          <Badge variant="outline" className="mt-1">
            {competency.category}
          </Badge>
        )}
        {competency.description && (
          <p className="mt-2 text-muted-foreground">{competency.description}</p>
        )}
      </div>

      {/* Levels & Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Levels & Indicators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {competency.levels.map((level, i) => (
            <div key={level.id}>
              {i > 0 && <Separator className="mb-4" />}
              <h3 className="mb-2 font-medium">{level.name}</h3>
              <ul className="space-y-1">
                {level.indicators.map((indicator) => (
                  <li key={indicator.id} className="text-sm text-muted-foreground">
                    &bull; {indicator.description}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Linked Evidence */}
      {competency.evidenceMap.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Linked Evidence</CardTitle>
            <CardDescription>
              {competency.evidenceMap.length} piece{competency.evidenceMap.length !== 1 ? "s" : ""} of evidence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {competency.evidenceMap.map((em) => (
                <div key={em.evidenceId} className="rounded-md border p-3">
                  <p className="font-medium text-sm">{em.evidence.title}</p>
                  {em.evidence.aiSummary && (
                    <p className="text-xs text-muted-foreground">{em.evidence.aiSummary}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linked Action Items */}
      {competency.actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Linked Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {competency.actionItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                  <p className="font-medium text-sm">{item.title}</p>
                  <div className="flex gap-2">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
