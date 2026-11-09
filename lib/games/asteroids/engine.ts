import { H, POINTS, POWERUP_DROP_CHANCE, POWERUP_DURATION, W } from "./constants";
import { Asteroid } from "./entities/asteroid";
import { Bullet } from "./entities/bullet";
import { Particle } from "./entities/particle";
import { PowerUp } from "./entities/powerup";
import { Ship } from "./entities/ship";
import { createInput } from "./input";
import type {
  AsteroidsCallbacks,
  AsteroidsEngine,
  AsteroidsState,
  AsteroidsStatus,
} from "./types";
import { dist, rand } from "./utils";

const MAX_DT = 0.05;
const SAFE_DIST = 130;
const RESPAWN_DELAY = 2;
const GUARANTEED_DROP_KILLS = 5;

export function createAsteroids(
  canvas: HTMLCanvasElement,
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
  let powerUps: PowerUp[] = [];
  let score = 0;
  let lives = 3;
  let level = 1;
  let status: Exclude<AsteroidsStatus, "paused"> = "playing";
  let deadTimer = 0;
  let powerUpSpawned = false;
  let killsSinceSpawn = 0;
  let lastEmitted = "";

  let rafId = 0;
  let lastTime: number | null = null;
  let paused = false;
  let destroyed = false;

  function currentState(): AsteroidsState {
    // 3x timer is reported in 0.1 s steps to limit re-renders
    const triple = ship.tripleShot > 0 ? Math.ceil(ship.tripleShot * 10) / 10 : 0;
    return {
      score,
      lives,
      level,
      tripleShot: triple,
      status: paused && status !== "gameover" ? "paused" : status,
    };
  }

  function emit() {
    const st = currentState();
    const key = `${st.score}|${st.lives}|${st.level}|${st.tripleShot}|${st.status}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    cb.onState(st);
  }

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
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    score = 0;
    lives = 3;
    level = 1;
    status = "playing";
    deadTimer = 0;
    spawnAsteroids(4);
    emit();
  }

  function nextLevel() {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(3 + level);
  }

  function killShip() {
    explode(ship.x, ship.y, 14);
    ship.dead = true;
    ship.tripleShot = 0;
    lives--;
    if (lives <= 0) {
      status = "gameover";
      emit();
      cb.onGameOver(score);
    } else {
      status = "dead";
      deadTimer = RESPAWN_DELAY;
    }
  }

  function update(dt: number) {
    if (status === "gameover" || status === "dead") {
      input.pressed("Space"); // drain so a stale press doesn't fire on respawn
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      if (status === "dead") {
        asteroids.forEach((a) => a.update(dt));
        deadTimer -= dt;
        if (deadTimer <= 0) {
          status = "playing";
          ship.reset();
        }
      }
      return;
    }

    if (input.pressed("Space")) bullets.push(...ship.tryShoot());

    ship.update(dt, {
      left: input.isDown("ArrowLeft"),
      right: input.isDown("ArrowRight"),
      thrust: input.isDown("ArrowUp"),
    });
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    powerUps.forEach((p) => p.update(dt));
    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);
    powerUps = powerUps.filter((p) => !p.dead);

    for (const p of powerUps) {
      if (dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }

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
          if (!powerUpSpawned) {
            killsSinceSpawn++;
            const guaranteed = killsSinceSpawn >= GUARANTEED_DROP_KILLS;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(a.x, a.y));
              powerUpSpawned = true;
            }
          }
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(spawned);
    bullets = bullets.filter((b) => !b.dead);

    // Ship vs asteroid
    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip();
          return;
        }
      }
    }

    if (asteroids.length === 0) nextLevel();
  }

  function draw() {
    ctx!.fillStyle = "#000";
    ctx!.fillRect(0, 0, W, H);
    particles.forEach((p) => p.draw(ctx!));
    asteroids.forEach((a) => a.draw(ctx!));
    powerUps.forEach((p) => p.draw(ctx!));
    bullets.forEach((b) => b.draw(ctx!));
    ship.draw(ctx!);
  }

  function loop(ts: number) {
    if (destroyed) return;
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
    lastTime = ts;
    if (!paused) update(dt);
    emit();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  initGame();
  input.attach();
  rafId = requestAnimationFrame(loop);

  return {
    pause() {
      paused = true;
      emit();
    },
    resume() {
      paused = false;
      lastTime = null; // avoid a dt jump after the pause
      input.clear();
      emit();
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
