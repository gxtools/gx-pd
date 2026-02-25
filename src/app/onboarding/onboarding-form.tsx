"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGitHub, completeOnboarding } from "./actions";

export function OnboardingForm({ isSignedIn }: { isSignedIn: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      await completeOnboarding(formData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (!isSignedIn) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Sign in with GitHub to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInWithGitHub}>
            <Button type="submit" className="w-full">
              Sign in with GitHub
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Set Up Your Profile</CardTitle>
        <CardDescription>
          Tell us about your role and paste your competency framework
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleComplete} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              name="orgName"
              placeholder="Your team or company (or leave blank for Personal)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentLevel">Current Level</Label>
              <Input
                id="currentLevel"
                name="currentLevel"
                placeholder="e.g. Level 2 - Intermediate"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetLevel">Target Level</Label>
              <Input
                id="targetLevel"
                name="targetLevel"
                placeholder="e.g. Level 3 - Senior"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aspirations">Aspirations</Label>
            <Textarea
              id="aspirations"
              name="aspirations"
              placeholder="What are your career goals?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="constraints">Constraints</Label>
            <Textarea
              id="constraints"
              name="constraints"
              placeholder="Any time or resource constraints?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frameworkText">Competency Framework</Label>
            <Textarea
              id="frameworkText"
              name="frameworkText"
              placeholder="Paste your competency framework here (markdown table or structured text)"
              rows={8}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Supports markdown tables or structured text with headings and bullet points
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Setting up..." : "Complete Setup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
