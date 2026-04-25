import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CitationViewer } from "@/components/citation-viewer";
import { MemoActions } from "@/components/memo-actions";
import { Badge, Panel } from "@/components/ui";
import { getDealBundle } from "@/lib/db/store";
import { formatDate } from "@/lib/utils";

export default async function MemoPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const bundle = await getDealBundle(dealId);
  if (!bundle) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8">
      <Link href={`/deals/${bundle.deal.id}`} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-moss hover:text-ink">
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone={bundle.deal.recommendation === "Pursue" ? "good" : bundle.deal.recommendation === "Review" ? "warn" : "bad"}>{bundle.deal.recommendation}</Badge>
          <h1 className="mt-3 text-4xl font-black tracking-tight">{bundle.deal.name} Investment Memo</h1>
          <p className="mt-2 text-moss">{bundle.memo ? `Generated ${formatDate(bundle.memo.generatedAt)}` : "No memo generated yet."}</p>
        </div>
        <MemoActions dealId={bundle.deal.id} />
      </header>

      {!bundle.memo && (
        <Panel>
          <p className="text-moss">Generate a memo after uploading or seeding deal documents.</p>
        </Panel>
      )}

      <div className="space-y-4">
        {bundle.memo?.sections.map((section) => (
          <Panel key={section.title}>
            <h2 className="text-xl font-black">{section.title}</h2>
            <div className="mt-3 whitespace-pre-line text-sm leading-7 text-ink">{section.body}</div>
            <div className="mt-4 border-t border-ink/10 pt-4">
              <CitationViewer citations={section.citations} />
            </div>
          </Panel>
        ))}
      </div>
    </main>
  );
}
