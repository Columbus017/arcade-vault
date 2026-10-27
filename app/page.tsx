"use client";

import { ActivitySection } from "@/components/home/ActivitySection";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { FinalCta } from "@/components/home/FinalCta";
import { GamesRail } from "@/components/home/GamesRail";
import { Hero } from "@/components/home/Hero";
import { PricingSection } from "@/components/home/PricingSection";
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
      <PricingSection />
      <FinalCta />
    </div>
  );
}
