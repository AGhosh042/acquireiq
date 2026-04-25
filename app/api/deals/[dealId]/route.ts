import { NextResponse } from "next/server";
import { deleteDeal, getDealBundle } from "@/lib/db/store";

export async function GET(_: Request, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const bundle = await getDealBundle(dealId);
  if (!bundle) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  return NextResponse.json(bundle);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const deleted = await deleteDeal(dealId);
  if (!deleted) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
