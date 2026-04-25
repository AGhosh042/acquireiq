import { CitationViewer } from "@/components/citation-viewer";
import { Panel } from "@/components/ui";
import { ExtractedMetric } from "@/lib/types";

export function FinancialSummary({ metrics }: { metrics: ExtractedMetric[] }) {
  const primary = metrics.filter((metric) => metric.name !== "Business Summary");
  return (
    <Panel>
      <h2 className="text-lg font-bold">Extracted Metrics</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {primary.map((metric) => (
          <div key={metric.id} className="rounded-md border border-ink/10 bg-paper/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-moss">{metric.name}</p>
            <p className="mt-1 text-2xl font-black text-ink">{metric.value}</p>
            <p className="mt-1 text-xs text-moss">{metric.period ? `${metric.period} · ` : ""}{Math.round(metric.confidence * 100)}% confidence</p>
            <div className="mt-3">
              <CitationViewer citations={metric.citations.slice(0, 1)} />
            </div>
          </div>
        ))}
      </div>
      {!primary.length && <p className="mt-3 text-sm text-moss">Upload documents or seed synthetic deals to extract metrics.</p>}
    </Panel>
  );
}
