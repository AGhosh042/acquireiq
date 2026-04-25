import { extractDealFacts } from "@/lib/ai/extraction";
import { generateMemo } from "@/lib/ai/memo";
import { resetStore } from "@/lib/db/store";
import { inferDocumentCategory } from "@/lib/documents/categories";
import { scoreRisks } from "@/lib/scoring/risk";
import { Deal, DealDocument, DocumentChunk, Store } from "@/lib/types";
import { id } from "@/lib/utils";

const now = () => new Date().toISOString();

const demos = [
  {
    name: "BrightLine HVAC Services",
    industry: "Residential HVAC Services",
    location: "Raleigh, NC",
    files: [
      {
        name: "BrightLine CIM.pdf",
        text: `Company: BrightLine HVAC Services
Industry: Residential HVAC Services
Location: Raleigh, NC
Founded in 2014, BrightLine provides residential HVAC maintenance, replacement, and emergency repair across Wake County. Revenue is $8.4M for 2025 with EBITDA of $1.35M. Asking price is $6.2M.

The company grew 11% over the last year and has a service agreement base that produces repeat demand. The owner still runs commercial relationships and approves larger replacement jobs. Monthly financials are available upon request but were not included in this packet.`
      },
      {
        name: "BrightLine Financials.xlsx",
        text: `Revenue 2023 $6.9M
Revenue 2024 $7.6M
Revenue 2025 $8.4M
EBITDA 2025 $1.35M
Add-backs $0.18M
Top customer concentration 8%`
      }
    ]
  },
  {
    name: "LedgerLoop SaaS",
    industry: "Vertical SaaS",
    location: "Austin, TX",
    files: [
      {
        name: "LedgerLoop Broker Deck.pdf",
        text: `Company: LedgerLoop SaaS
Industry: Vertical SaaS
Location: Austin, TX
LedgerLoop sells recurring revenue workflow software to small accounting firms. Revenue is $2.2M and EBITDA is $0.42M. Asking price is $3.4M.

Recurring revenue is described as 82% of sales, but customer contracts are month-to-month and the largest customer represents 31% of revenue. Net revenue retention decreased 7% after a pricing change.`
      },
      {
        name: "LedgerLoop Customer Export.xlsx",
        text: `Top customer concentration 31%
Revenue declined 7%
EBITDA margin decreased
Add-backs $0.16M
Customer churn 18%`
      }
    ]
  },
  {
    name: "Northstar Dental Group",
    industry: "Dental Practice Management",
    location: "Columbus, OH",
    files: [
      {
        name: "Northstar Dental Overview.docx",
        text: `Company: Northstar Dental Group
Industry: Dental Practice Management
Location: Columbus, OH
Northstar operates three general dentistry locations with 11 hygienists and 4 dentists. Revenue is $5.9M with EBITDA of $1.62M. Asking price is $7.8M.

The founding dentist is central to referrals and high-value implant cases. Associate dentist retention is strong, but two leases include landlord consent required before a change of control.`
      },
      {
        name: "Northstar Financials.xlsx",
        text: `Revenue 2025 $5.9M
EBITDA 2025 $1.62M
Top customer concentration 2%
Add-backs $0.31M
Working capital seasonal due to insurance receivables`
      }
    ]
  }
];

export async function seedSyntheticDeals() {
  const store: Store = { deals: [], documents: [], chunks: [], metrics: [], risks: [], memos: [] };

  for (const demo of demos) {
    const createdAt = now();
    const baseDeal: Deal = {
      id: id("deal"),
      name: demo.name,
      industry: demo.industry,
      location: demo.location,
      status: "screening",
      fitScore: 50,
      recommendation: "Review",
      createdAt,
      updatedAt: createdAt
    };
    const documents: DealDocument[] = demo.files.map((file) => ({
      id: id("doc"),
      dealId: baseDeal.id,
      fileName: file.name,
      fileType: file.name.split(".").pop() ?? "txt",
      category: inferDocumentCategory(file.name),
      storagePath: `synthetic://${file.name}`,
      status: "complete",
      uploadedAt: createdAt
    }));
    const chunks: DocumentChunk[] = demo.files.map((file, index) => ({
      id: id("chunk"),
      dealId: baseDeal.id,
      documentId: documents[index].id,
      documentName: file.name,
      locator: file.name.endsWith(".xlsx") ? "Sheet: Financials" : "Page 1",
      chunkType: file.name.endsWith(".xlsx") ? "financial" : "business",
      text: file.text
    }));
    const extraction = extractDealFacts(baseDeal, chunks);
    const interimDeal = { ...baseDeal, ...extraction.dealUpdates };
    const scored = scoreRisks(interimDeal, chunks, extraction.metrics);
    const deal: Deal = {
      ...interimDeal,
      fitScore: scored.fitScore,
      recommendation: scored.recommendation,
      status: scored.recommendation === "Pass" ? "pass" : scored.recommendation === "Pursue" ? "pursue" : "review"
    };
    const bundle = { deal, documents, chunks, metrics: extraction.metrics, risks: scored.risks };
    const memo = generateMemo(bundle);

    store.deals.push(deal);
    store.documents.push(...documents);
    store.chunks.push(...chunks);
    store.metrics.push(...extraction.metrics);
    store.risks.push(...scored.risks);
    store.memos.push(memo);
  }

  await resetStore(store);
  return { deals: store.deals.length, documents: store.documents.length };
}

if (require.main === module) {
  seedSyntheticDeals().then((result) => {
    console.log(`Seeded ${result.deals} synthetic deals with ${result.documents} documents.`);
  });
}
