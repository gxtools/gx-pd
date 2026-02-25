"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogEvidenceButton() {
  const router = useRouter();

  return (
    <Button variant="outline" onClick={() => router.push("/evidence?new=true")}>
      Log Evidence
    </Button>
  );
}
