import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, NotebookText } from "lucide-react";
import { DealScore } from "@/components/deal-score";
import { DocumentList } from "@/components/document-list";
import { DocumentUploader } from "@/components/document-uploader";
import { FinancialSummary } from "@/components/financial-summary";
import { RiskPanel } from "@/components/risk-panel";
import { Badge, Panel } from "@/components/ui";
import { getDealBundle } from "@/lib/db/store";
import { formatDate } from "@/lib/utils";

export default async function DealPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const bundle = await getDealBundle(dealId);
  if (!bundle) notFound();

  const { deal, documents, chunks, metrics, risks } = bundle;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8">
      <Link href="/deals" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-moss hover:text-ink">
        <ArrowLeft size={16} />
        Back to deals
      </Link>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge>{deal.status}</Badge>
                <h1 className="mt-3 text-4xl font-black tracking-tight">{deal.name}</h1>
                <p className="mt-2 text-moss">{deal.industry} · {deal.location} · Updated {formatDate(deal.updatedAt)}</p>
              </div>
              <Link href={`/deals/${deal.id}/memo`} className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss">
                <NotebookText size={16} />
                View Memo
              </Link>
            </div>
            <div className="mt-6">
              <DealScore deal={deal} />
            </div>
          </Panel>

          <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <FinancialSummary metrics={metrics} />
            <Panel>
              <h2 className="text-lg font-bold">Source Chunks</h2>
              <div className="mt-4 max-h-[520px] space-y-3 overflow-auto pr-1">
                {chunks.map((chunk) => (
                  <article key={chunk.id} className="rounded-md border border-ink/10 bg-paper/60 p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge>{chunk.chunkType}</Badge>
                      <span className="text-xs font-semibold text-moss">{chunk.documentName} · {chunk.locator}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-moss">{chunk.text.slice(0, 520)}{chunk.text.length > 520 ? "..." : ""}</p>
                  </article>
                ))}
              </div>
              {!chunks.length && <p className="mt-3 text-sm text-moss">Parsed source chunks will appear here after upload.</p>}
            </Panel>
          </section>

          <RiskPanel risks={risks} />
        </div>

        <aside className="lg:sticky lg:top-6">
          <Panel>
            <h2 className="font-bold">Documents</h2>
            <DocumentList documents={documents} chunks={chunks} />
            <div className="mt-4">
              <DocumentUploader dealId={deal.id} documents={documents} />
            </div>
          </Panel>
        </aside>
      </div>
    </main>
  );
}
