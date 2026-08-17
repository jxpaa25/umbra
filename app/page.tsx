import EclipseHero from "@/components/hero/EclipseHero";
import Manifesto from "@/components/sections/Manifesto";
import TokenomicsTeaser from "@/components/sections/TokenomicsTeaser";
import RoadmapTeaser from "@/components/sections/RoadmapTeaser";
import HowToBuy from "@/components/sections/HowToBuy";
import CommunityFooter from "@/components/sections/CommunityFooter";

/** $UMBRA — home. Signature hero, then the long-scroll story. */
export default function UmbraHome() {
  return (
    <main>
      <EclipseHero />
      <Manifesto />
      <TokenomicsTeaser />
      <RoadmapTeaser />
      <HowToBuy />
      <CommunityFooter />
    </main>
  );
}
