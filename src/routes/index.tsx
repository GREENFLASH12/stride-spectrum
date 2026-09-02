import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/dashboard/Header";
import { TodayCard } from "@/components/dashboard/TodayCard";
import { HeatStrip } from "@/components/dashboard/HeatStrip";
import { Charts } from "@/components/dashboard/Charts";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { Legend } from "@/components/dashboard/Legend";
import { ThresholdCards } from "@/components/dashboard/ThresholdCards";
import { ReadinessCards } from "@/components/dashboard/ReadinessCards";
import { profiles, today } from "@/lib/snapshot";
import { zoneStates } from "@/lib/metrics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Breathing Readiness — Athlete Recovery Dashboard" },
      {
        name: "description",
        content:
          "Explainable fatigue and recovery dashboard fusing ventilatory efficiency, HRV/RHR and training load to answer: should you train hard today?",
      },
      { property: "og:title", content: "Breathing Readiness — Athlete Recovery Dashboard" },
      {
        property: "og:description",
        content:
          "Ventilatory efficiency, overnight autonomics and training load fused into one explainable daily readiness call.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const states = zoneStates(profiles);
  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-8 sm:px-6 sm:py-12">
      <Header />
      {today && <TodayCard day={today} />}
      <ThresholdCards states={states} />
      {today && <ReadinessCards day={today} states={states} />}
      <HeatStrip days={profiles} />
      <Charts days={profiles} />
      <HistoryTable days={profiles} />
      <Legend />
    </main>
  );
}
