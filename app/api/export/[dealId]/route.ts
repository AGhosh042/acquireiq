import { NextResponse } from "next/server";
import { getDealBundle } from "@/lib/db/store";

export async function GET(_: Request, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const bundle = await getDealBundle(dealId);
  if (!bundle?.memo) return NextResponse.json({ error: "Memo not found" }, { status: 404 });

  return new NextResponse(bundle.memo.markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${bundle.deal.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-memo.md"`
    }
  });
}
