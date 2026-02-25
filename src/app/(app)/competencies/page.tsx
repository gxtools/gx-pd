import { requireProfile } from "@/lib/auth/session";
import { getFrameworkForOrg } from "@/lib/db/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function CompetenciesPage() {
  const { profile } = await requireProfile();
  const framework = await getFrameworkForOrg(profile.orgId);

  if (!framework) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Competencies</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No competency framework found. Please complete onboarding first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Competencies</h1>
        <p className="text-muted-foreground">{framework.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {framework.competencies.map((comp) => {
          const evidenceCount = comp.evidenceMap.length;
          const actionCount = comp.actionItems.filter((a) => a.status !== "done").length;

          return (
            <Link key={comp.id} href={`/competencies/${comp.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">{comp.name}</CardTitle>
                  {comp.category && (
                    <CardDescription>{comp.category}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {comp.description && (
                    <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                      {comp.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Badge variant="outline">{comp.levels.length} levels</Badge>
                    {evidenceCount > 0 && (
                      <Badge variant="secondary">{evidenceCount} evidence</Badge>
                    )}
                    {actionCount > 0 && (
                      <Badge variant="secondary">{actionCount} actions</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
