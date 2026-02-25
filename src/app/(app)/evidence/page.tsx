import { requireProfile } from "@/lib/auth/session";
import { getEvidenceForUser } from "@/lib/db/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvidenceForm } from "./evidence-form";

export default async function EvidencePage() {
  const { user } = await requireProfile();
  const items = await getEvidenceForUser(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Evidence Log</h1>
        <EvidenceForm />
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No evidence logged yet. Click &quot;Log Evidence&quot; to record your work.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>
                      {new Date(item.createdAt).toLocaleDateString()}
                      {item.link && (
                        <>
                          {" "}
                          &middot;{" "}
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            Link
                          </a>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  {item.aiConfidence !== null && (
                    <Badge variant="outline">
                      {Math.round((item.aiConfidence ?? 0) * 100)}% confidence
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.aiSummary ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">AI Summary</p>
                    <p className="text-sm">{item.aiSummary}</p>
                  </div>
                ) : (
                  <p className="text-sm">{item.description}</p>
                )}

                {item.aiImpact && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Impact</p>
                    <p className="text-sm">{item.aiImpact}</p>
                  </div>
                )}

                {item.aiClaimedLevel && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Demonstrated Level</p>
                    <p className="text-sm">{item.aiClaimedLevel}</p>
                  </div>
                )}

                {item.competencyMap.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.competencyMap.map((cm) => (
                      <Badge key={cm.competencyId} variant="secondary">
                        {cm.competency.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {item.aiFollowupQuestions && (item.aiFollowupQuestions as string[]).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Follow-up Questions</p>
                    <ul className="mt-1 space-y-1">
                      {(item.aiFollowupQuestions as string[]).map((q, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          {i + 1}. {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
