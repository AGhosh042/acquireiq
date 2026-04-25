import { NextResponse } from "next/server";
import { listDeals, upsertDeal } from "@/lib/db/store";
import { Deal } from "@/lib/types";
import { id } from "@/lib/utils";

export async function GET() {
  return NextResponse.json(await listDeals());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const now = new Date().toISOString();
  const deal: Deal = {
    id: id("deal"),
    name: body.name || "New Acquisition Target",
    industry: body.industry || "Unknown",
    location: body.location || "Unknown",
    status: "screening",
    fitScore: 50,
    recommendation: "Review",
    createdAt: now,
    updatedAt: now
  };
  await upsertDeal(deal);
  return NextResponse.json(deal, { status: 201 });
}
