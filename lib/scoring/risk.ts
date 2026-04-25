import { Deal, DocumentChunk, ExtractedMetric, RiskFlag } from "@/lib/types";
import { citation } from "@/lib/ai/extraction";
import { id } from "@/lib/utils";

export function scoreRisks(deal: Deal, chunks: DocumentChunk[], metrics: ExtractedMetric[]): { risks: RiskFlag[]; fitScore: number; recommendation: Deal["recommendation"] } {
  const risks: RiskFlag[] = [];
  const text = chunks.map((chunk) => chunk.text).join("\n").toLowerCase();

  const concentration = numericMetric(metrics, "Customer Concentration");
  if (concentration && concentration > 25) {
    const chunk = findChunk(chunks, /top customer|largest customer|customer concentration/i);
    risks.push(risk(deal.id, "Customer", "high", "Customer concentration exceeds 25%", "A single customer appears to represent an outsized share of revenue, increasing renewal and pricing risk.", "Which customers represent more than 10% of revenue, and what are their contract terms?", chunk));
  }

  if (/(revenue|sales).{0,80}(declined|decreased|down)/i.test(text)) {
    risks.push(risk(deal.id, "Financial", "high", "Revenue decline disclosed", "The documents mention a revenue decline, which needs normalization before valuation work.", "What caused the decline, and has monthly revenue recovered?", findChunk(chunks, /declined|decreased|down/i)));
  }

  if (/(margin|ebitda).{0,80}(compressed|declined|decreased|down)/i.test(text)) {
    risks.push(risk(deal.id, "Financial", "medium", "Margin deterioration", "Profitability appears to be weakening, which can reduce debt capacity and valuation support.", "Break down gross margin and EBITDA margin by month for the last 24 months.", findChunk(chunks, /margin|ebitda/i)));
  }

  const addBacks = numericMetric(metrics, "Add-backs");
  const ebitda = numericMetric(metrics, "EBITDA") || numericMetric(metrics, "SDE");
  if (addBacks && ebitda && addBacks / ebitda > 0.2) {
    risks.push(risk(deal.id, "Financial", "medium", "Large add-backs relative to earnings", "Add-backs appear material compared with reported earnings and should be validated individually.", "Which add-backs are non-recurring, owner-specific, and supported by invoices or payroll records?", findChunk(chunks, /add-?backs?/i)));
  }

  if (/(owner|founder).{0,80}(sales|relationships|operations|central|day-to-day|runs)/i.test(text)) {
    risks.push(risk(deal.id, "Management", "high", "Owner dependency", "The business appears reliant on the owner for sales, operations, or customer relationships.", "What responsibilities can transfer to managers before close, and will the owner provide transition support?", findChunk(chunks, /owner|founder/i)));
  }

  if (!/(monthly financial|month-by-month|monthly p&l|monthly profit)/i.test(text)) {
    risks.push(risk(deal.id, "Financial", "medium", "Monthly financials not found", "The uploaded materials do not appear to include monthly financial statements.", "Can the seller provide monthly P&L, balance sheet, and revenue detail for the last 36 months?", chunks.find((chunk) => chunk.chunkType === "financial") ?? chunks[0]));
  }

  if (/(working capital|inventory|accounts receivable|ar).{0,80}(unclear|not included|excluded|seasonal)/i.test(text)) {
    risks.push(risk(deal.id, "Financial", "medium", "Working capital needs require diligence", "The materials suggest working capital treatment may affect effective purchase price.", "What normalized working capital peg is assumed, and what assets/liabilities transfer at close?", findChunk(chunks, /working capital|inventory|accounts receivable/i)));
  }

  const price = numericMetric(metrics, "Asking Price");
  if (price && ebitda && price / ebitda > 5.5) {
    risks.push(risk(deal.id, "Financial", "medium", "High asking multiple", "The implied valuation multiple is high for many SMB acquisitions and needs growth or quality support.", "What comparable transactions or strategic rationale supports the requested multiple?", findChunk(chunks, /asking price|purchase price|valuation/i)));
  }

  if (/recurring revenue/i.test(text) && !/(contract|subscription|renewal|retention)/i.test(text)) {
    risks.push(risk(deal.id, "Customer", "medium", "Recurring revenue needs support", "Recurring revenue is mentioned, but the uploaded materials do not clearly evidence contracts, subscriptions, or retention.", "Provide customer cohorts, renewal rates, and contract terms supporting recurring revenue claims.", findChunk(chunks, /recurring revenue/i)));
  }

  if (/(change of control|consent required|assignment restriction|landlord consent)/i.test(text)) {
    risks.push(risk(deal.id, "Legal", "high", "Consent or change-of-control issue", "Contracts or leases may require consent before assignment or acquisition close.", "Which contracts, leases, licenses, or payor agreements require third-party consent?", findChunk(chunks, /change of control|consent required|assignment restriction|landlord consent/i)));
  }

  const fitScore = Math.max(35, 92 - risks.reduce((sum, item) => sum + (item.severity === "high" ? 14 : item.severity === "medium" ? 8 : 4), 0));
  const recommendation = fitScore >= 78 ? "Pursue" : fitScore >= 58 ? "Review" : "Pass";
  return { risks, fitScore, recommendation };
}

function numericMetric(metrics: ExtractedMetric[], name: string) {
  const value = metrics.find((metric) => metric.name === name)?.value;
  if (!value) return undefined;
  return Number(value.replace(/[$,%]/g, "").replace(/M$/i, "")) || undefined;
}

function findChunk(chunks: DocumentChunk[], regex: RegExp) {
  return chunks.find((chunk) => regex.test(chunk.text));
}

function risk(dealId: string, category: RiskFlag["category"], severity: RiskFlag["severity"], title: string, explanation: string, diligenceQuestion: string, chunk?: DocumentChunk): RiskFlag {
  return {
    id: id("risk"),
    dealId,
    category,
    severity,
    title,
    explanation,
    diligenceQuestion,
    citations: chunk ? [citation(chunk)] : []
  };
}
