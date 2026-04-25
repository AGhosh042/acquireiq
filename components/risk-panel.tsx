import { CitationViewer } from "@/components/citation-viewer";
import { Badge, Panel } from "@/components/ui";
import { RiskFlag } from "@/lib/types";

export function RiskPanel({ risks }: { risks: RiskFlag[] }) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Red Flags</h2>
        <span className="text-sm text-moss">{risks.length} issues</span>
      </div>
      <div className="mt-4 space-y-3">
        {risks.map((risk) => (
          <article key={risk.id} className="rounded-md border border-ink/10 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={risk.severity === "high" ? "bad" : risk.severity === "medium" ? "warn" : "neutral"}>{risk.severity}</Badge>
              <Badge>{risk.category}</Badge>
            </div>
            <h3 className="mt-3 font-bold">{risk.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-moss">{risk.explanation}</p>
            <p className="mt-3 text-sm font-semibold">Diligence question: <span className="font-normal text-moss">{risk.diligenceQuestion}</span></p>
            <div className="mt-3">
              <CitationViewer citations={risk.citations} />
            </div>
          </article>
        ))}
      </div>
      {!risks.length && <p className="mt-3 text-sm text-moss">No deterministic risk flags found yet.</p>}
    </Panel>
  );
}
