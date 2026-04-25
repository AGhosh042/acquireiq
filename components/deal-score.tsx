import { Badge } from "@/components/ui";
import { Deal } from "@/lib/types";

export function DealScore({ deal }: { deal: Deal }) {
  const tone = deal.recommendation === "Pursue" ? "good" : deal.recommendation === "Review" ? "warn" : "bad";
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-24 w-24 place-items-center rounded-full border-8 border-gold/70 bg-white text-3xl font-black text-ink">{deal.fitScore}</div>
      <div>
        <Badge tone={tone}>{deal.recommendation}</Badge>
        <p className="mt-2 max-w-sm text-sm text-moss">First-pass screen based on cited document evidence, deterministic risk checks, and extracted financial facts.</p>
      </div>
    </div>
  );
}
