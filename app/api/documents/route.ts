import { NextResponse } from "next/server";
import { getDealBundle } from "@/lib/db/store";
import { documentCategories } from "@/lib/documents/categories";
import { saveUpload } from "@/lib/documents/ingest";
import { runDealPipeline } from "@/lib/pipeline";
import { DocumentCategory } from "@/lib/types";

export async function POST(request: Request) {
  const form = await request.formData();
  const dealId = String(form.get("dealId") || "");
  const category = String(form.get("category") || "") as DocumentCategory;
  const files = form.getAll("files").filter((item): item is File => item instanceof File);
  const bundle = await getDealBundle(dealId);

  if (!bundle) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  if (!files.length) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  if (category && !documentCategories.some((item) => item.id === category)) {
    return NextResponse.json({ error: "Unsupported document category" }, { status: 400 });
  }

  try {
    const documents = await Promise.all(files.map((file) => saveUpload(dealId, file, category || undefined)));
    const result = await runDealPipeline(bundle.deal, [...bundle.documents, ...documents]);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
