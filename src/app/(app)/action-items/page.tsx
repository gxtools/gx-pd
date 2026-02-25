import { requireProfile } from "@/lib/auth/session";
import { getActionItemsForUser } from "@/lib/db/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionItemRow } from "./action-item-row";

export default async function ActionItemsPage() {
  const { user } = await requireProfile();
  const items = await getActionItemsForUser(user.id);

  const todoItems = items.filter((i) => i.status === "todo");
  const inProgressItems = items.filter((i) => i.status === "in_progress");
  const doneItems = items.filter((i) => i.status === "done");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Action Items</h1>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No action items yet. Run a weekly check-in from the dashboard to generate action items.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {inProgressItems.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                In Progress
                <Badge variant="secondary">{inProgressItems.length}</Badge>
              </h2>
              <div className="space-y-2">
                {inProgressItems.map((item) => (
                  <ActionItemRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {todoItems.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                To Do
                <Badge variant="secondary">{todoItems.length}</Badge>
              </h2>
              <div className="space-y-2">
                {todoItems.map((item) => (
                  <ActionItemRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {doneItems.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Done
                <Badge variant="secondary">{doneItems.length}</Badge>
              </h2>
              <div className="space-y-2">
                {doneItems.map((item) => (
                  <ActionItemRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
