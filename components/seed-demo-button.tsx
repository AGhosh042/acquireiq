"use client";

import { useState } from "react";
import { Database } from "lucide-react";
import { Button } from "@/components/ui";

export function SeedDemoButton() {
  const [busy, setBusy] = useState(false);

  async function seed() {
    setBusy(true);
    await fetch("/api/seed", { method: "POST" });
    window.location.reload();
  }

  return (
    <Button onClick={seed} disabled={busy}>
      <Database size={16} />
      {busy ? "Seeding..." : "Load Synthetic Deals"}
    </Button>
  );
}
