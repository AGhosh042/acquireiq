import { extractDealFacts } from "@/lib/ai/extraction";
import { generateMemo } from "@/lib/ai/memo";
import { parseDocument } from "@/lib/documents/ingest";
import { getDealBundle, replaceDealAnalysis, saveMemo } from "@/lib/db/store";
import { scoreRisks } from "@/lib/scoring/risk";
import { Deal, DealDocument } from "@/lib/types";

export async function runDealPipeline(deal: Deal, documents: DealDocument[]) {
  const processedDocuments = documents.map((document) => ({ ...document, status: "processing" as const }));
  const chunks = (await Promise.all(processedDocuments.map(parseDocument))).flat();
  const extraction = extractDealFacts(deal, chunks);
  const updatedDeal: Deal = {
    ...deal,
    ...extraction.dealUpdates,
    updatedAt: new Date().toISOString()
  };
  const scored = scoreRisks(updatedDeal, chunks, extraction.metrics);
  const finalDeal: Deal = {
    ...updatedDeal,
    fitScore: scored.fitScore,
    recommendation: scored.recommendation,
    status: scored.recommendation === "Pass" ? "pass" : scored.recommendation === "Pursue" ? "pursue" : "review"
  };
  const completeDocuments = processedDocuments.map((document) => ({ ...document, status: "complete" as const }));
  const bundle = {
    deal: finalDeal,
    documents: completeDocuments,
    chunks,
    metrics: extraction.metrics,
    risks: scored.risks
  };
  const memo = generateMemo(bundle);
  await replaceDealAnalysis(finalDeal, completeDocuments, chunks, extraction.metrics, scored.risks, memo);
  return { ...bundle, memo };
}

export async function regenerateMemo(dealId: string) {
  const bundle = await getDealBundle(dealId);
  if (!bundle) throw new Error("Deal not found");
  const memo = generateMemo(bundle);
  await saveMemo(memo);
  return memo;
}
