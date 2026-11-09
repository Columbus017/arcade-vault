import { H, W } from "./constants";
import { Bullet } from "./entities/bullet";
import { Ship } from "./entities/ship";
import { createInput } from "./input";
import type { AsteroidsCallbacks, AsteroidsEngine } from "./types";

const MAX_DT = 0.05;

export function createAsteroids(
  canvas: HTMLCanvasElement,
  // Used from step 8 onwards (state + game-over events).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cb: AsteroidsCallbacks,
): AsteroidsEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context not available");
  canvas.width = W;
  canvas.height = H;

  const input = createInput();
  const ship = new Ship();
  let bullets: Bullet[] = [];

  let rafId = 0;
  let lastTime: number | null = null;
  let paused = false;
  let destroyed = false;

  function update(dt: number) {
    if (input.pressed("Space")) bullets.push(...ship.tryShoot());

    ship.update(dt, {
      left: input.isDown("ArrowLeft"),
      right: input.isDown("ArrowRight"),
      thrust: input.isDown("ArrowUp"),
    });
    bullets.forEach((b) => b.update(dt));
    bullets = bullets.filter((b) => !b.dead);
  }

  function draw() {
    ctx!.fillStyle = "#000";
    ctx!.fillRect(0, 0, W, H);
    bullets.forEach((b) => b.draw(ctx!));
    ship.draw(ctx!);
  }

  function loop(ts: number) {
    if (destroyed) return;
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
    lastTime = ts;
    if (!paused) update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  input.attach();
  rafId = requestAnimationFrame(loop);

  return {
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
      lastTime = null; // avoid a dt jump after the pause
      input.clear();
    },
    restart() {
      ship.reset();
      ship.tripleShot = 0;
      bullets = [];
      lastTime = null;
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      input.detach();
    },
  };
}
