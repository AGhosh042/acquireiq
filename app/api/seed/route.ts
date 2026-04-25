import { NextResponse } from "next/server";
import { seedSyntheticDeals } from "@/scripts/seed-synthetic-deals";

export async function POST() {
  const result = await seedSyntheticDeals();
  return NextResponse.json(result);
}
