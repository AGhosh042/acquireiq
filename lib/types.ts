export type DealStatus = "screening" | "review" | "pursue" | "pass";
export type ProcessingStatus = "queued" | "processing" | "complete" | "failed";
export type ChunkType = "business" | "financial" | "customer" | "operations" | "legal" | "management" | "other";
export type RiskSeverity = "low" | "medium" | "high";
export type DocumentCategory = "cim" | "financials" | "customers" | "legal" | "tax" | "hr" | "operations" | "other";

export type Citation = {
  chunkId: string;
  documentName: string;
  locator: string;
  excerpt: string;
};

export type Deal = {
  id: string;
  name: string;
  industry: string;
  location: string;
  status: DealStatus;
  fitScore: number;
  recommendation: "Pass" | "Review" | "Pursue";
  createdAt: string;
  updatedAt: string;
};

export type DealDocument = {
  id: string;
  dealId: string;
  fileName: string;
  fileType: string;
  category?: DocumentCategory;
  storagePath: string;
  status: ProcessingStatus;
  uploadedAt: string;
  error?: string;
};

export type DocumentChunk = {
  id: string;
  dealId: string;
  documentId: string;
  documentName: string;
  locator: string;
  chunkType: ChunkType;
  text: string;
};

export type ExtractedMetric = {
  id: string;
  dealId: string;
  name: string;
  value: string;
  period?: string;
  confidence: number;
  citations: Citation[];
};

export type RiskFlag = {
  id: string;
  dealId: string;
  category: "Financial" | "Operational" | "Legal" | "Customer" | "Management";
  severity: RiskSeverity;
  title: string;
  explanation: string;
  diligenceQuestion: string;
  citations: Citation[];
};

export type MemoSection = {
  title: string;
  body: string;
  citations: Citation[];
};

export type InvestmentMemo = {
  id: string;
  dealId: string;
  sections: MemoSection[];
  markdown: string;
  generatedAt: string;
};

export type Store = {
  deals: Deal[];
  documents: DealDocument[];
  chunks: DocumentChunk[];
  metrics: ExtractedMetric[];
  risks: RiskFlag[];
  memos: InvestmentMemo[];
};

export type DealBundle = {
  deal: Deal;
  documents: DealDocument[];
  chunks: DocumentChunk[];
  metrics: ExtractedMetric[];
  risks: RiskFlag[];
  memo?: InvestmentMemo;
};
