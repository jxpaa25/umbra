import type { Metadata } from "next";
import TokenomicsIntro from "@/components/tokenomics/TokenomicsIntro";
import DistributionDonut from "@/components/tokenomics/DistributionDonut";
import TokenomicsClosing from "@/components/tokenomics/TokenomicsClosing";

export const metadata: Metadata = {
  title: "$UMBRA — Tokenomics",
  description: "Supply, distribution, and contract details for $UMBRA.",
};

/** $UMBRA — full tokenomics breakdown. */
export default function TokenomicsPage() {
  return (
    <main>
      <TokenomicsIntro />
      <DistributionDonut />
      <TokenomicsClosing />
    </main>
  );
}
