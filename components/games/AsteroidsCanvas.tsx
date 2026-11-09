"use client";

import { useEffect, useRef } from "react";
import { createAsteroids } from "@/lib/games/asteroids/engine";
import { H, W } from "@/lib/games/asteroids/constants";
import type { AsteroidsEngine } from "@/lib/games/asteroids/types";
import type { GameCanvasProps } from "@/lib/games/registry";

export function AsteroidsCanvas({
  onState,
  onGameOver,
  paused,
  restartKey,
  onPauseRequest,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AsteroidsEngine | null>(null);
  const cbRef = useRef({ onState, onGameOver, onPauseRequest });
  const lastRestartKey = useRef(restartKey);

  useEffect(() => {
    cbRef.current = { onState, onGameOver, onPauseRequest };
  });

  // Create the engine once per mount; destroy on unmount (also covers Strict Mode double effects).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createAsteroids(canvas, {
      onState: (s) => cbRef.current.onState(s),
      onGameOver: (score) => cbRef.current.onGameOver(score),
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // The `paused` prop is the source of truth.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (paused) engine.pause();
    else engine.resume();
  }, [paused]);

  // Auto-pause when the tab/window loses focus. Resume only happens via the host (REANUDAR).
  useEffect(() => {
    const request = () => cbRef.current.onPauseRequest?.();
    const onVisibility = () => {
      if (document.hidden) request();
    };
    window.addEventListener("blur", request);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", request);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Bump restartKey to restart.
  useEffect(() => {
    if (lastRestartKey.current === restartKey) return;
    lastRestartKey.current = restartKey;
    engineRef.current?.restart();
  }, [restartKey]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}
