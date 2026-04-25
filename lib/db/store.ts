import { promises as fs } from "fs";
import path from "path";
import { Deal, DealBundle, DealDocument, DocumentChunk, ExtractedMetric, InvestmentMemo, RiskFlag, Store } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");

const emptyStore: Store = {
  deals: [],
  documents: [],
  chunks: [],
  metrics: [],
  risks: [],
  memos: []
};

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(emptyStore, null, 2));
  }
}

export async function readStore(): Promise<Store> {
  await ensureStore();
  const raw = await fs.readFile(storePath, "utf8");
  return JSON.parse(raw) as Store;
}

export async function writeStore(store: Store) {
  await ensureStore();
  await fs.writeFile(storePath, JSON.stringify(store, null, 2));
}

export async function resetStore(store: Store = emptyStore) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2));
}

export async function listDeals(): Promise<Deal[]> {
  const store = await readStore();
  return store.deals.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDealBundle(dealId: string): Promise<DealBundle | undefined> {
  const store = await readStore();
  const deal = store.deals.find((item) => item.id === dealId);
  if (!deal) return undefined;

  return {
    deal,
    documents: store.documents.filter((item) => item.dealId === dealId),
    chunks: store.chunks.filter((item) => item.dealId === dealId),
    metrics: store.metrics.filter((item) => item.dealId === dealId),
    risks: store.risks.filter((item) => item.dealId === dealId),
    memo: store.memos.find((item) => item.dealId === dealId)
  };
}

export async function getDocumentPreview(documentId: string) {
  const store = await readStore();
  const document = store.documents.find((item) => item.id === documentId);
  if (!document) return undefined;

  return {
    document,
    chunks: store.chunks.filter((item) => item.documentId === documentId)
  };
}

export async function deleteDeal(dealId: string) {
  const store = await readStore();
  const documents = store.documents.filter((item) => item.dealId === dealId);
  const deleted = store.deals.some((item) => item.id === dealId);

  store.deals = store.deals.filter((item) => item.id !== dealId);
  store.documents = store.documents.filter((item) => item.dealId !== dealId);
  store.chunks = store.chunks.filter((item) => item.dealId !== dealId);
  store.metrics = store.metrics.filter((item) => item.dealId !== dealId);
  store.risks = store.risks.filter((item) => item.dealId !== dealId);
  store.memos = store.memos.filter((item) => item.dealId !== dealId);

  await Promise.all(
    documents
      .filter((document) => !document.storagePath.startsWith("synthetic://"))
      .map((document) => fs.rm(document.storagePath, { force: true }).catch(() => undefined))
  );

  if (deleted) await writeStore(store);
  return deleted;
}

export async function upsertDeal(deal: Deal) {
  const store = await readStore();
  store.deals = store.deals.filter((item) => item.id !== deal.id).concat(deal);
  await writeStore(store);
}

export async function replaceDealAnalysis(
  deal: Deal,
  documents: DealDocument[],
  chunks: DocumentChunk[],
  metrics: ExtractedMetric[],
  risks: RiskFlag[],
  memo?: InvestmentMemo
) {
  const store = await readStore();
  store.deals = store.deals.filter((item) => item.id !== deal.id).concat(deal);
  const docIds = new Set(documents.map((doc) => doc.id));
  store.documents = store.documents.filter((item) => !docIds.has(item.id)).concat(documents);
  store.chunks = store.chunks.filter((item) => item.dealId !== deal.id).concat(chunks);
  store.metrics = store.metrics.filter((item) => item.dealId !== deal.id).concat(metrics);
  store.risks = store.risks.filter((item) => item.dealId !== deal.id).concat(risks);
  if (memo) {
    store.memos = store.memos.filter((item) => item.dealId !== deal.id).concat(memo);
  }
  await writeStore(store);
}

export async function saveDocument(document: DealDocument) {
  const store = await readStore();
  store.documents = store.documents.filter((item) => item.id !== document.id).concat(document);
  await writeStore(store);
}

export async function saveMemo(memo: InvestmentMemo) {
  const store = await readStore();
  store.memos = store.memos.filter((item) => item.dealId !== memo.dealId).concat(memo);
  await writeStore(store);
}
