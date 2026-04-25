"use client";

import { useState } from "react";
import { CheckCircle2, Circle, FilePlus2, Upload } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { documentCategories, inferDocumentCategory } from "@/lib/documents/categories";
import { DealDocument, DocumentCategory } from "@/lib/types";

export function DocumentUploader({ dealId, documents }: { dealId: string; documents: DealDocument[] }) {
  const [filesByCategory, setFilesByCategory] = useState<Partial<Record<DocumentCategory, FileList | null>>>({});
  const [status, setStatus] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(category: DocumentCategory) {
    const files = filesByCategory[category];
    if (!files?.length) return;
    setBusy(true);
    setActiveCategory(category);
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
      setActiveCategory(null);
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

      <div className="mt-4 grid gap-3">
        {documentCategories.map((category) => {
          const uploadedCount = documents.filter((document) => (document.category ?? inferDocumentCategory(document.fileName)) === category.id).length;
          const inputId = `documents-${category.id}`;
          const selectedCount = filesByCategory[category.id]?.length ?? 0;

          return (
            <section key={category.id} className="rounded-md border border-ink/10 bg-paper/60 p-3">
              <div className="flex items-start gap-3">
                {uploadedCount ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={18} /> : <Circle className="mt-0.5 shrink-0 text-moss" size={18} />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="font-semibold text-ink" htmlFor={inputId}>{category.label}</label>
                    {category.required && <Badge tone="warn">important</Badge>}
                    {!!uploadedCount && <Badge tone="good">{uploadedCount} uploaded</Badge>}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-moss">{category.description}</p>
                  <p className="mt-1 text-xs text-moss">Examples: {category.examples}</p>
                  <input
                    id={inputId}
                    type="file"
                    multiple
                    accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.txt"
                    className="mt-3 block w-full rounded-md border border-ink/15 bg-white p-2 text-xs"
                    onChange={(event) => setFilesByCategory((current) => ({ ...current, [category.id]: event.target.files }))}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button className="px-3 py-1.5 text-xs" onClick={() => upload(category.id)} disabled={busy || !selectedCount}>
                      {busy && activeCategory === category.id ? <Upload size={14} /> : <FilePlus2 size={14} />}
                      {busy && activeCategory === category.id ? "Analyzing..." : `Add ${category.label}`}
                    </Button>
                    <span className="text-xs text-moss">{selectedCount ? `${selectedCount} selected` : "PDF, Excel, Word, CSV, TXT"}</span>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-moss">{status}</p>
    </div>
  );
}
