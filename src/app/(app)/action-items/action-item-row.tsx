"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  expectedArtifact: string | null;
  dueDate: Date | null;
  notes: string | null;
  competency: { id: string; name: string } | null;
}

export function ActionItemRow({ item }: { item: ActionItem }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function updateStatus(status: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/action-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Marked as ${status.replace("_", " ")}`);
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    setSaving(true);
    try {
      const res = await fetch(`/api/action-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      className={item.status === "done" ? "opacity-60" : undefined}
    >
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <button
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="min-w-0 flex-1">
              <p className={`font-medium text-sm ${item.status === "done" ? "line-through" : ""}`}>
                {item.title}
              </p>
              {item.competency && (
                <p className="text-xs text-muted-foreground">{item.competency.name}</p>
              )}
            </div>
          </button>
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
            {item.dueDate && (
              <span className="text-xs text-muted-foreground">
                {new Date(item.dueDate).toLocaleDateString()}
              </span>
            )}
            <Select
              value={item.status}
              onValueChange={updateStatus}
              disabled={saving}
            >
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
            {item.expectedArtifact && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expected Artifact</p>
                <p className="text-sm">{item.expectedArtifact}</p>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Add notes..."
                className="text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={saveNotes}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
