export type AsteroidsStatus = "playing" | "dead" | "gameover" | "paused";

export interface AsteroidsState {
  score: number;
  lives: number;
  level: number;
  tripleShot: number; // seconds left, 0 = inactive
  status: AsteroidsStatus;
}

export interface AsteroidsCallbacks {
  onState: (s: AsteroidsState) => void; // fired when any field changes
  onGameOver: (finalScore: number) => void;
}

export interface AsteroidsEngine {
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void; // cancels rAF, removes key listeners
}
