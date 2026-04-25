import { promises as fs } from "fs";
import path from "path";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { inferDocumentCategory } from "@/lib/documents/categories";
import { ChunkType, DealDocument, DocumentCategory, DocumentChunk } from "@/lib/types";
import { id } from "@/lib/utils";

const uploadDir = path.join(process.cwd(), "data", "uploads");
const supported = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/plain",
  "text/csv"
]);

export function isSupportedDocument(fileType: string, fileName: string) {
  const lower = fileName.toLowerCase();
  return (
    supported.has(fileType) ||
    lower.endsWith(".pdf") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".txt")
  );
}

export async function saveUpload(dealId: string, file: File, category?: DocumentCategory): Promise<DealDocument> {
  if (!isSupportedDocument(file.type, file.name)) {
    throw new Error("Unsupported file type. Upload PDF, Excel, Word, CSV, or TXT files.");
  }

  await fs.mkdir(uploadDir, { recursive: true });
  const documentId = id("doc");
  const extension = path.extname(file.name) || ".bin";
  const storagePath = path.join(uploadDir, `${documentId}${extension}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storagePath, buffer);

  return {
    id: documentId,
    dealId,
    fileName: file.name,
    fileType: file.type || extension.replace(".", ""),
    category: category ?? inferDocumentCategory(file.name),
    storagePath,
    status: "queued",
    uploadedAt: new Date().toISOString()
  };
}

export async function parseDocument(document: DealDocument): Promise<DocumentChunk[]> {
  const buffer = await fs.readFile(document.storagePath);
  const fileName = document.fileName.toLowerCase();

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
    return parseSpreadsheet(document, buffer);
  }

  if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
    const result = await mammoth.extractRawText({ buffer });
    return chunkText(document, result.value, "Page 1");
  }

  if (fileName.endsWith(".pdf")) {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      return chunkText(document, result.text, "PDF text");
    } catch {
      return chunkText(document, "PDF text could not be extracted in this environment. Add a text-based PDF for full parsing.", "PDF fallback");
    }
  }

  return chunkText(document, buffer.toString("utf8"), "Text file");
}

function parseSpreadsheet(document: DealDocument, buffer: Buffer): DocumentChunk[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames.flatMap((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const text = rows
      .slice(0, 250)
      .map((row) => Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(" | "))
      .join("\n");

    return chunkText(document, text || XLSX.utils.sheet_to_csv(sheet), `Sheet: ${sheetName}`, "financial");
  });
}

function chunkText(document: DealDocument, text: string, locatorPrefix: string, forcedType?: ChunkType): DocumentChunk[] {
  const cleaned = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) {
    return [
      {
        id: id("chunk"),
        dealId: document.dealId,
        documentId: document.id,
        documentName: document.fileName,
        locator: locatorPrefix,
        chunkType: forcedType ?? "other",
        text: "No extractable text found."
      }
    ];
  }

  const paragraphs = cleaned.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + paragraph).length > 1200) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current += `${current ? "\n\n" : ""}${paragraph}`;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.map((chunk, index) => ({
    id: id("chunk"),
    dealId: document.dealId,
    documentId: document.id,
    documentName: document.fileName,
    locator: `${locatorPrefix}${chunks.length > 1 ? `, chunk ${index + 1}` : ""}`,
    chunkType: forcedType ?? classifyChunk(chunk),
    text: chunk
  }));
}

export function classifyChunk(text: string): ChunkType {
  const lower = text.toLowerCase();
  if (/(revenue|ebitda|sde|gross margin|add-?back|asking price|purchase price|financial)/.test(lower)) return "financial";
  if (/(customer|concentration|churn|retention|contract)/.test(lower)) return "customer";
  if (/(owner|founder|management|key employee|dentist|technician)/.test(lower)) return "management";
  if (/(change of control|consent|lease|legal|regulatory|license)/.test(lower)) return "legal";
  if (/(operations|location|facility|workflow|dispatch|production)/.test(lower)) return "operations";
  if (/(overview|company|founded|market|industry)/.test(lower)) return "business";
  return "other";
}
