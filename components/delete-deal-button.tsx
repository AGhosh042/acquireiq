"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteDealButton({ dealId, dealName }: { dealId: string; dealName: string }) {
  const [busy, setBusy] = useState(false);

  async function deleteDeal() {
    const confirmed = window.confirm(`Delete "${dealName}" and all related documents, metrics, risks, and memos?`);
    if (!confirmed) return;

    setBusy(true);
    const response = await fetch(`/api/deals/${dealId}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      alert(body.error || "Could not delete this deal.");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return (
    <button
      aria-label={`Delete ${dealName}`}
      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-rose-200 bg-white text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={busy}
      onClick={deleteDeal}
      title="Delete deal"
      type="button"
    >
      <Trash2 size={17} />
    </button>
  );
}
