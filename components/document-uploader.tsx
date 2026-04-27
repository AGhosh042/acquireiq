"use client";

import { useState } from "react";
import { CheckCircle2, Circle, FilePlus2, Upload } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { documentCategories, inferDocumentCategory } from "@/lib/documents/categories";
import { DealDocument, DocumentCategory } from "@/lib/types";

export function DocumentUploader({ dealId, documents }: { dealId: string; documents: DealDocument[] }) {
  const [category, setCategory] = useState<DocumentCategory>("financials");
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!files?.length) return;
    setBusy(true);
    setStatus("Processing documents...");
    const form = new FormData();
    form.append("dealId", dealId);
    form.append("category", category);
    Array.from(files).forEach((file) => form.append("files", file));
    const response = await fetch("/api/documents", { method: "POST", body: form });
    const body = await response.json();
    if (!response.ok) {
      setStatus(body.error || "Upload failed.");
      setBusy(false);
      return;
    }
    setStatus("Analysis complete. Refreshing...");
    window.location.reload();
  }

  return (
    <div className="rounded-lg border border-dashed border-ink/25 bg-white/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-ink">Upload diligence documents</h3>
          <p className="mt-1 text-xs leading-relaxed text-moss">Choose the section first so the deal room stays organized.</p>
        </div>
        <Badge>{documents.length} files</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {documentCategories.map((item) => {
          const uploadedCount = documents.filter((document) => (document.category ?? inferDocumentCategory(document.fileName)) === item.id).length;

          return (
            <button
              key={item.id}
              className={`focus-ring rounded-md border p-2 text-left transition ${
                item.id === category
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-ink/10 bg-paper/60 hover:bg-mist/60"
              }`}
              onClick={() => setCategory(item.id)}
              type="button"
            >
              <span className="flex items-center gap-2">
                {uploadedCount ? <CheckCircle2 className="shrink-0 text-emerald-700" size={15} /> : <Circle className="shrink-0 text-moss" size={15} />}
                <span className="truncate text-xs font-bold text-ink">{item.label}</span>
              </span>
              <span className="mt-1 block text-xs text-moss">{uploadedCount ? `${uploadedCount} uploaded` : item.required ? "Important" : "Optional"}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-ink/10 bg-paper/60 p-3">
        <label className="text-xs font-bold text-ink" htmlFor="document-category">Document section</label>
        <select
          id="document-category"
          className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white p-2 text-sm"
          value={category}
          onChange={(event) => setCategory(event.target.value as DocumentCategory)}
        >
          {documentCategories.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
        <p className="mt-2 text-xs leading-relaxed text-moss">
          {documentCategories.find((item) => item.id === category)?.description}
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.txt"
          className="mt-3 block w-full rounded-md border border-ink/15 bg-white p-2 text-xs"
          onChange={(event) => setFiles(event.target.files)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button className="px-3 py-1.5 text-xs" onClick={upload} disabled={busy || !files?.length}>
            {busy ? <Upload size={14} /> : <FilePlus2 size={14} />}
            {busy ? "Analyzing..." : "Upload & Analyze"}
          </Button>
          <span className="text-xs text-moss">{files?.length ? `${files.length} selected` : "PDF, Excel, Word, CSV, TXT"}</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-moss">{status}</p>
    </div>
  );
}
