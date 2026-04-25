import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ShieldCheck, Sparkles } from "lucide-react";
import { CreateDealButton } from "@/components/create-deal-button";
import { DeleteDealButton } from "@/components/delete-deal-button";
import { SeedDemoButton } from "@/components/seed-demo-button";
import { Badge, Panel } from "@/components/ui";
import { listDeals } from "@/lib/db/store";
import { formatDate } from "@/lib/utils";

export default async function DealsPage() {
  const deals = await listDeals();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-ink/10 pb-7">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-moss">
            <Sparkles size={16} />
            AcquireIQ
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-ink sm:text-5xl">SMB acquisition screening with cited deal intelligence.</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-moss">Upload CIMs, decks, financials, and diligence docs. AcquireIQ extracts metrics, flags red flags, and drafts an investment memo with source evidence.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SeedDemoButton />
          <CreateDealButton />
        </div>
      </header>

      <section className="mt-7 grid gap-4 md:grid-cols-3">
        <Panel>
          <BriefcaseBusiness className="text-clay" />
          <h2 className="mt-3 font-bold">Deal Workspace</h2>
          <p className="mt-1 text-sm text-moss">Organize documents, extracted metrics, risks, and memos by target.</p>
        </Panel>
        <Panel>
          <ShieldCheck className="text-clay" />
          <h2 className="mt-3 font-bold">Cited Risk Flags</h2>
          <p className="mt-1 text-sm text-moss">Every risk links back to document evidence instead of floating AI claims.</p>
        </Panel>
        <Panel>
          <Sparkles className="text-clay" />
          <h2 className="mt-3 font-bold">Memo Generator</h2>
          <p className="mt-1 text-sm text-moss">Export a first-pass investment memo for interviews and portfolio demos.</p>
        </Panel>
      </section>

      <section className="mt-7">
        <h2 className="mb-4 text-xl font-black">Deal Pipeline</h2>
        <div className="grid gap-4">
          {deals.map((deal) => (
            <div key={deal.id} className="group rounded-lg border border-ink/10 bg-white/80 p-5 shadow-soft transition hover:-translate-y-0.5 hover:bg-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black">{deal.name}</h3>
                    <Badge tone={deal.recommendation === "Pursue" ? "good" : deal.recommendation === "Review" ? "warn" : "bad"}>{deal.recommendation}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-moss">{deal.industry} · {deal.location} · Updated {formatDate(deal.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-black">{deal.fitScore}</p>
                    <p className="text-xs uppercase text-moss">Fit score</p>
                  </div>
                  <Link href={`/deals/${deal.id}`} className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss">
                    Open
                    <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </Link>
                  <DeleteDealButton dealId={deal.id} dealName={deal.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {!deals.length && (
          <div className="rounded-lg border border-dashed border-ink/20 bg-white/70 p-8 text-center">
            <h3 className="text-xl font-black">No deals yet</h3>
            <p className="mt-2 text-moss">Load synthetic deals to see the full workflow immediately, or create a blank deal and upload your own documents.</p>
            <div className="mt-5 flex justify-center gap-2">
              <SeedDemoButton />
              <CreateDealButton />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
