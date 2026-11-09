import { H, POINTS, W } from "./constants";
import { Asteroid } from "./entities/asteroid";
import { Bullet } from "./entities/bullet";
import { Particle } from "./entities/particle";
import { Ship } from "./entities/ship";
import { createInput } from "./input";
import type { AsteroidsCallbacks, AsteroidsEngine } from "./types";
import { dist, rand } from "./utils";

const MAX_DT = 0.05;
const SAFE_DIST = 130;

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
  let asteroids: Asteroid[] = [];
  let particles: Particle[] = [];
  let score = 0;
  let level = 1;

  let rafId = 0;
  let lastTime: number | null = null;
  let paused = false;
  let destroyed = false;

  function spawnAsteroids(count: number) {
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      asteroids.push(new Asteroid(x, y, 3));
    }
  }

  function explode(x: number, y: number, count = 8) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
  }

  function initGame() {
    ship.reset();
    ship.tripleShot = 0;
    bullets = [];
    asteroids = [];
    particles = [];
    score = 0;
    level = 1;
    spawnAsteroids(4);
  }

  function nextLevel() {
    level++;
    bullets = [];
    particles = [];
    ship.reset();
    spawnAsteroids(3 + level);
  }

  function update(dt: number) {
    if (input.pressed("Space")) bullets.push(...ship.tryShoot());

    ship.update(dt, {
      left: input.isDown("ArrowLeft"),
      right: input.isDown("ArrowRight"),
      thrust: input.isDown("ArrowUp"),
    });
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);

    // Bullet vs asteroid
    const spawned: Asteroid[] = [];
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          spawned.push(...a.split());
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(spawned);
    bullets = bullets.filter((b) => !b.dead);

    if (asteroids.length === 0) nextLevel();
  }

  function draw() {
    ctx!.fillStyle = "#000";
    ctx!.fillRect(0, 0, W, H);
    particles.forEach((p) => p.draw(ctx!));
    asteroids.forEach((a) => a.draw(ctx!));
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

  initGame();
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
      initGame();
      lastTime = null;
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      input.detach();
    },
  };
}
