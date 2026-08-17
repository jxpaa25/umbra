import type { Metadata } from "next";
import RoadmapIntro from "@/components/roadmap/RoadmapIntro";
import RoadmapTimeline from "@/components/roadmap/RoadmapTimeline";
import RoadmapClosing from "@/components/roadmap/RoadmapClosing";

export const metadata: Metadata = {
  title: "$UMBRA — Roadmap",
  description: "The four phases of the eclipse: what is done, moving, and ahead.",
};

/** $UMBRA — the full roadmap, phase by phase to totality. */
export default function RoadmapPage() {
  return (
    <main>
      <RoadmapIntro />
      <RoadmapTimeline />
      <RoadmapClosing />
    </main>
  );
}
