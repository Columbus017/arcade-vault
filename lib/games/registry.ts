import type { ComponentType } from "react";
import { AsteroidsCanvas } from "@/components/games/AsteroidsCanvas";
import type { AsteroidsState } from "@/lib/games/asteroids/types";

export interface GameCanvasProps {
  onState: (s: AsteroidsState) => void; // widened to a shared GameState when a 2nd game lands
  onGameOver: (finalScore: number) => void;
  paused: boolean;
  restartKey: number; // bump to restart
}

export const GAME_CANVASES: Record<string, ComponentType<GameCanvasProps>> = {
  asteroids: AsteroidsCanvas,
};
