"use client";

import { Hero } from "@/components/home/Hero";
import { useReveal } from "@/hooks/useReveal";

export default function Home() {
  useReveal();
  return (
    <div className="home fade-in">
      <Hero />
    </div>
  );
}
