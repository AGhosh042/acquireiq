import { NextResponse } from "next/server";
import { regenerateMemo } from "@/lib/pipeline";

export async function POST(_: Request, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  try {
    return NextResponse.json(await regenerateMemo(dealId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Memo generation failed" }, { status: 404 });
  }
}
