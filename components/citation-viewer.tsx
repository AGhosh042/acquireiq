import { FileText } from "lucide-react";
import { Citation } from "@/lib/types";

export function CitationViewer({ citations }: { citations: Citation[] }) {
  if (!citations.length) return <p className="text-sm text-moss">No citation attached.</p>;

  return (
    <div className="space-y-2">
      {citations.map((citation) => (
        <div key={`${citation.chunkId}-${citation.locator}`} className="rounded-md border border-ink/10 bg-paper/70 p-3 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold text-ink">
            <FileText size={15} />
            {citation.documentName} · {citation.locator}
          </div>
          <p className="leading-relaxed text-moss">{citation.excerpt}</p>
        </div>
      ))}
    </div>
  );
}
