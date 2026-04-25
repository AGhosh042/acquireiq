"use client";

import { useState } from "react";
import { FileDown, RefreshCw } from "lucide-react";
import { Button, SecondaryButton } from "@/components/ui";

export function MemoActions({ dealId }: { dealId: string }) {
  const [busy, setBusy] = useState(false);

  async function regenerate() {
    setBusy(true);
    await fetch(`/api/memo/${dealId}`, { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={regenerate} disabled={busy}>
        <RefreshCw size={16} />
        {busy ? "Generating..." : "Regenerate Memo"}
      </Button>
      <a className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-mist/60" href={`/api/export/${dealId}`}>
        <FileDown size={16} />
        Export Markdown
      </a>
    </div>
  );
}
