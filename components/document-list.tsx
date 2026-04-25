"use client";

import { useMemo, useState } from "react";
import { ExternalLink, FileText, Search, X } from "lucide-react";
import { Badge, SecondaryButton } from "@/components/ui";
import { documentCategoryLabel, inferDocumentCategory } from "@/lib/documents/categories";
import { DealDocument, DocumentChunk } from "@/lib/types";

export function DocumentList({ documents, chunks }: { documents: DealDocument[]; chunks: DocumentChunk[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const selected = documents.find((document) => document.id === selectedId);
  const selectedChunks = useMemo(() => {
    const matches = chunks.filter((chunk) => chunk.documentId === selectedId);
    if (!query.trim()) return matches;
    const needle = query.toLowerCase();
    return matches.filter((chunk) => `${chunk.locator} ${chunk.chunkType} ${chunk.text}`.toLowerCase().includes(needle));
  }, [chunks, query, selectedId]);

  if (!documents.length) return <p className="mt-3 text-sm text-moss">No documents uploaded yet.</p>;

  return (
    <div className="mt-3 space-y-2">
      {documents.map((document) => (
        <button
          key={document.id}
          className="focus-ring flex w-full items-center justify-between gap-2 rounded-md bg-paper/70 p-3 text-left text-sm transition hover:bg-mist/70"
          onClick={() => setSelectedId(document.id)}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <FileText size={16} className="shrink-0 text-clay" />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{document.fileName}</span>
              <span className="block text-xs text-moss">{documentCategoryLabel(document.category ?? inferDocumentCategory(document.fileName))}</span>
            </span>
          </span>
          <Badge tone={document.status === "complete" ? "good" : document.status === "failed" ? "bad" : "warn"}>{document.status}</Badge>
        </button>
      ))}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true">
          <div className="mx-auto flex max-h-[92vh] w-full max-w-5xl flex-col rounded-t-lg bg-white shadow-soft sm:rounded-lg">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="shrink-0 text-clay" size={20} />
                  <h2 className="truncate text-xl font-black">{selected.fileName}</h2>
                </div>
                <p className="mt-1 text-sm text-moss">{documentCategoryLabel(selected.category ?? inferDocumentCategory(selected.fileName))} · {selectedChunks.length} parsed source chunks · {selected.fileType || "document"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!selected.storagePath.startsWith("synthetic://") && (
                  <a
                    className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-mist/60"
                    href={`/api/documents/${selected.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={16} />
                    Open Original
                  </a>
                )}
                <SecondaryButton onClick={() => setSelectedId(null)}>
                  <X size={16} />
                  Close
                </SecondaryButton>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[280px_1fr]">
              <aside className="border-b border-ink/10 p-4 lg:border-b-0 lg:border-r">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-2.5 text-moss" size={16} />
                  <input
                    className="focus-ring w-full rounded-md border border-ink/15 bg-paper/60 py-2 pl-9 pr-3 text-sm"
                    placeholder="Search this document"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <div className="mt-4 space-y-2">
                  {documents.map((document) => (
                    <button
                      key={document.id}
                      className={`focus-ring w-full rounded-md p-3 text-left text-sm transition ${document.id === selected.id ? "bg-ink text-white" : "bg-paper/70 text-ink hover:bg-mist/70"}`}
                      onClick={() => {
                        setSelectedId(document.id);
                        setQuery("");
                      }}
                      type="button"
                    >
                      <span className="line-clamp-2 font-semibold">{document.fileName}</span>
                      <span className={document.id === selected.id ? "mt-1 block text-xs text-white/75" : "mt-1 block text-xs text-moss"}>
                        {documentCategoryLabel(document.category ?? inferDocumentCategory(document.fileName))}
                      </span>
                    </button>
                  ))}
                </div>
              </aside>

              <section className="min-h-0 overflow-auto p-5">
                {selectedChunks.map((chunk) => (
                  <article key={chunk.id} className="mb-4 rounded-md border border-ink/10 bg-paper/60 p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge>{chunk.chunkType}</Badge>
                      <span className="text-xs font-semibold text-moss">{chunk.locator}</span>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-7 text-ink">{chunk.text}</p>
                  </article>
                ))}
                {!selectedChunks.length && <p className="text-sm text-moss">No parsed text matched your search.</p>}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
