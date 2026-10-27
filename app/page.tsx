"use client";

import { ActivitySection } from "@/components/home/ActivitySection";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { GamesRail } from "@/components/home/GamesRail";
import { Hero } from "@/components/home/Hero";
import { StatsBand } from "@/components/home/StatsBand";
import { useReveal } from "@/hooks/useReveal";

export default function Home() {
  useReveal();
  return (
    <div className="home fade-in">
      <Hero />
      <FeatureGrid />
      <GamesRail />
      <StatsBand />
      <ActivitySection />
    </div>
  );
}
