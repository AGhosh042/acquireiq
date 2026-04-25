import { Citation, DealBundle, InvestmentMemo, MemoSection } from "@/lib/types";
import { id, metricValue } from "@/lib/utils";

export function generateMemo(bundle: DealBundle): InvestmentMemo {
  const { deal, metrics, risks } = bundle;
  const keyCitation = metrics[0]?.citations ?? risks[0]?.citations ?? [];
  const revenue = metricValue(metrics, ["Revenue"]) ?? "not extracted";
  const ebitda = metricValue(metrics, ["EBITDA", "SDE"]) ?? "not extracted";
  const price = metricValue(metrics, ["Asking Price"]) ?? "not extracted";
  const concentration = metricValue(metrics, ["Customer Concentration"]) ?? "not extracted";
  const highRisks = risks.filter((risk) => risk.severity === "high");

  const sections: MemoSection[] = [
    section("Executive Summary", `${deal.name} is an SMB acquisition target in ${deal.industry || "an unspecified sector"} with a current AcquireIQ fit score of ${deal.fitScore}/100 and a preliminary recommendation to ${deal.recommendation}. The screen highlights ${risks.length} diligence flags, including ${highRisks.length} high-severity items.`, keyCitation),
    section("Company Overview", `${deal.name} operates in ${deal.location || "an undisclosed market"}. Uploaded materials describe the target as ${summaryMetric(metrics)}.`, metricCitations(metrics, "Business Summary")),
    section("Transaction Snapshot", `Asking price is ${price}. Revenue is ${revenue}. EBITDA/SDE is ${ebitda}. Customer concentration is ${concentration}.`, allMetricCitations(metrics)),
    section("Financial Summary", `The first-pass financial view should focus on validating revenue quality, normalized EBITDA/SDE, add-backs, working capital, and monthly performance trends before submitting an LOI.`, allMetricCitations(metrics)),
    section("Valuation View", `The valuation screen should compare asking price to normalized EBITDA/SDE and pressure-test debt service under downside revenue and margin assumptions.`, allMetricCitations(metrics)),
    section("Key Strengths", strengths(bundle), keyCitation),
    section("Key Risks", risks.length ? risks.map((risk) => `${risk.title}: ${risk.explanation}`).join("\n\n") : "No major risks were identified from the uploaded evidence.", risks.flatMap((risk) => risk.citations).slice(0, 4)),
    section("Diligence Questions", risks.length ? risks.map((risk) => `- ${risk.diligenceQuestion}`).join("\n") : "- Request monthly financials, customer detail, contracts, and transition plan.", risks.flatMap((risk) => risk.citations).slice(0, 4)),
    section("Preliminary Recommendation", `${deal.recommendation}. This recommendation is evidence-limited and should be updated after quality of earnings, customer calls, legal review, and working capital diligence.`, keyCitation)
  ];

  return {
    id: id("memo"),
    dealId: deal.id,
    sections,
    markdown: toMarkdown(deal.name, sections),
    generatedAt: new Date().toISOString()
  };
}

function section(title: string, body: string, citations: Citation[] = []): MemoSection {
  return { title, body, citations };
}

function summaryMetric(metrics: DealBundle["metrics"]) {
  return metrics.find((metric) => metric.name === "Business Summary")?.value ?? "requiring further diligence based on the uploaded documents";
}

function metricCitations(metrics: DealBundle["metrics"], name: string) {
  return metrics.find((metric) => metric.name === name)?.citations ?? [];
}

function allMetricCitations(metrics: DealBundle["metrics"]) {
  return metrics.flatMap((metric) => metric.citations).slice(0, 5);
}

function strengths(bundle: DealBundle) {
  const text = bundle.chunks.map((chunk) => chunk.text).join(" ").toLowerCase();
  const strengths = [];
  if (/recurring|retention|repeat/i.test(text)) strengths.push("Evidence of repeat or recurring revenue should be validated and may support deal quality.");
  if (/growth|grew|increased/i.test(text)) strengths.push("The materials reference growth, which may support a more constructive underwriting case.");
  if (/manager|team|staff/i.test(text)) strengths.push("The presence of managers or staff depth may reduce transition risk.");
  return strengths.length ? strengths.join("\n\n") : "The core strength is a packaged acquisition opportunity with enough initial information to guide focused diligence.";
}

function toMarkdown(dealName: string, sections: MemoSection[]) {
  return [`# ${dealName} Investment Memo`, ...sections.map((item) => `## ${item.title}\n${item.body}\n${formatCitations(item)}`)].join("\n\n");
}

function formatCitations(section: MemoSection) {
  if (!section.citations.length) return "";
  return section.citations.map((citation, index) => `[${index + 1}] ${citation.documentName}, ${citation.locator}: ${citation.excerpt}`).join("\n");
}
