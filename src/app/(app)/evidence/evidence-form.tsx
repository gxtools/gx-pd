"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function EvidenceForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const link = formData.get("link") as string;

    try {
      // Step 1: Create evidence record
      const createRes = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, link: link || null }),
      });

      if (!createRes.ok) throw new Error("Failed to create evidence");
      const evidence = await createRes.json();

      // Step 2: Trigger AI extraction
      const extractRes = await fetch("/api/ai/extract-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceId: evidence.id }),
      });

      if (!extractRes.ok) {
        toast.warning("Evidence saved but AI analysis failed. You can retry later.");
      } else {
        toast.success("Evidence logged and analyzed!");
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Log Evidence</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Evidence</DialogTitle>
          <DialogDescription>
            Record evidence of your work. AI will analyze it against your competency framework.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ev-title">Title</Label>
            <Input
              id="ev-title"
              name="title"
              placeholder="e.g. Led architecture review for payments service"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-description">Description</Label>
            <Textarea
              id="ev-description"
              name="description"
              placeholder="Describe what you did, the context, and the outcome..."
              rows={5}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-link">Link (optional)</Label>
            <Input
              id="ev-link"
              name="link"
              type="url"
              placeholder="https://..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Analyzing..." : "Submit & Analyze"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
