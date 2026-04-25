import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getDocumentPreview } from "@/lib/db/store";

const contentTypes: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword"
};

export async function GET(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const preview = await getDocumentPreview(documentId);

  if (!preview) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (preview.document.storagePath.startsWith("synthetic://")) {
    return NextResponse.json({ error: "Synthetic demo documents do not have original file binaries." }, { status: 404 });
  }

  try {
    const buffer = await fs.readFile(preview.document.storagePath);
    const extension = preview.document.fileName.split(".").pop()?.toLowerCase() ?? "bin";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": contentTypes[extension] ?? "application/octet-stream",
        "content-disposition": `inline; filename="${preview.document.fileName.replace(/"/g, "")}"`
      }
    });
  } catch {
    return NextResponse.json({ error: "Original file could not be loaded." }, { status: 404 });
  }
}
