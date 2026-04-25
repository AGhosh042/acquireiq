"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { SecondaryButton } from "@/components/ui";

export function CreateDealButton() {
  const [busy, setBusy] = useState(false);

  async function createDeal() {
    setBusy(true);
    const response = await fetch("/api/deals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "New Acquisition Target", industry: "Unknown", location: "Unknown" })
    });
    const deal = await response.json();
    window.location.href = `/deals/${deal.id}`;
  }

  return (
    <SecondaryButton onClick={createDeal} disabled={busy}>
      <Plus size={16} />
      New Deal
    </SecondaryButton>
  );
}
