import { Citation, Deal, DocumentChunk, ExtractedMetric } from "@/lib/types";
import { id } from "@/lib/utils";

type ExtractionResult = {
  dealUpdates: Partial<Deal>;
  metrics: ExtractedMetric[];
};

const metricPatterns: Array<{ name: string; regex: RegExp; period?: (match: RegExpMatchArray) => string | undefined }> = [
  { name: "Revenue", regex: /(?:revenue|sales)[^\d$]{0,30}\$?([\d,.]+)\s?(m|million|k|thousand)?/i },
  { name: "EBITDA", regex: /ebitda[^\d$]{0,30}\$?([\d,.]+)\s?(m|million|k|thousand)?/i },
  { name: "SDE", regex: /sde[^\d$]{0,30}\$?([\d,.]+)\s?(m|million|k|thousand)?/i },
  { name: "Asking Price", regex: /(?:asking price|purchase price|valuation)[^\d$]{0,30}\$?([\d,.]+)\s?(m|million|k|thousand)?/i },
  { name: "Customer Concentration", regex: /(?:top customer|largest customer|customer concentration)[^\d%]{0,40}([\d.]+)%/i },
  { name: "Add-backs", regex: /add-?backs?[^\d$]{0,30}\$?([\d,.]+)\s?(m|million|k|thousand)?/i }
];

export function extractDealFacts(deal: Deal, chunks: DocumentChunk[]): ExtractionResult {
  const metrics: ExtractedMetric[] = [];
  const allText = chunks.map((chunk) => chunk.text).join("\n");
  const firstChunk = chunks[0];
  const updates: Partial<Deal> = {};

  const company = allText.match(/(?:company|target|business):\s*([A-Z][A-Za-z0-9 &.-]{3,70})/);
  if (company?.[1]) updates.name = company[1].trim();

  const industry = allText.match(/(?:industry|sector):\s*([A-Za-z &-]{3,60})/);
  if (industry?.[1]) updates.industry = industry[1].trim();

  const location = allText.match(/(?:location|headquarters|hq):\s*([A-Za-z ,.]{3,60})/);
  if (location?.[1]) updates.location = location[1].trim();

  for (const pattern of metricPatterns) {
    const chunk = chunks.find((item) => pattern.regex.test(item.text));
    if (!chunk) continue;
    const match = chunk.text.match(pattern.regex);
    if (!match) continue;
    metrics.push({
      id: id("metric"),
      dealId: deal.id,
      name: pattern.name,
      value: formatMetricValue(pattern.name, match[1], match[2]),
      period: inferPeriod(chunk.text),
      confidence: 0.82,
      citations: [citation(chunk, match[0])]
    });
  }

  const growth = inferGrowth(chunks);
  if (growth) metrics.push(growth);

  if (!metrics.some((metric) => metric.name === "Business Summary") && firstChunk) {
    metrics.push({
      id: id("metric"),
      dealId: deal.id,
      name: "Business Summary",
      value: firstChunk.text.slice(0, 220),
      confidence: 0.72,
      citations: [citation(firstChunk, firstChunk.text.slice(0, 160))]
    });
  }

  return { dealUpdates: updates, metrics };
}

export function citation(chunk: DocumentChunk, excerpt?: string): Citation {
  return {
    chunkId: chunk.id,
    documentName: chunk.documentName,
    locator: chunk.locator,
    excerpt: (excerpt || chunk.text).replace(/\s+/g, " ").slice(0, 220)
  };
}

function formatMetricValue(name: string, value: string, suffix?: string) {
  if (name === "Customer Concentration") return `${value}%`;
  const clean = value.replace(/,/g, "");
  const number = Number(clean);
  if (Number.isNaN(number)) return value;
  if (suffix?.toLowerCase().startsWith("m")) return `$${number.toFixed(number >= 10 ? 0 : 1)}M`;
  if (suffix?.toLowerCase().startsWith("k")) return `$${Math.round(number).toLocaleString()}K`;
  return number > 1000 ? `$${number.toLocaleString()}` : `$${number}M`;
}

function inferPeriod(text: string) {
  return text.match(/20\d{2}|LTM|TTM|FY\d{2}/i)?.[0];
}

function inferGrowth(chunks: DocumentChunk[]): ExtractedMetric | undefined {
  const chunk = chunks.find((item) => /(growth|grew|decline|decreased|increased).{0,60}(\d+)%/i.test(item.text));
  if (!chunk) return undefined;
  const match = chunk.text.match(/(growth|grew|decline|decreased|increased).{0,60}(\d+)%/i);
  if (!match) return undefined;
  return {
    id: id("metric"),
    dealId: chunk.dealId,
    name: "Growth Trend",
    value: `${/decline|decreased/i.test(match[1]) ? "-" : "+"}${match[2]}%`,
    confidence: 0.77,
    citations: [citation(chunk, match[0])]
  };
}
