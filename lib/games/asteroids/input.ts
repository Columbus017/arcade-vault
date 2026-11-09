const PREVENT = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export interface Input {
  attach(): void;
  detach(): void;
  isDown(code: string): boolean;
  /** True once per key press (consumed on read). */
  pressed(code: string): boolean;
  clear(): void;
}

/** Per-instance keyboard state. Listeners live on `window` between attach() and detach(). */
export function createInput(): Input {
  const keys: Record<string, boolean> = {};
  const justPressed: Record<string, boolean> = {};

  const onKeyDown = (e: KeyboardEvent) => {
    if (PREVENT.has(e.code)) e.preventDefault();
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (PREVENT.has(e.code)) e.preventDefault();
    keys[e.code] = false;
  };

  const clear = () => {
    for (const k of Object.keys(keys)) keys[k] = false;
    for (const k of Object.keys(justPressed)) justPressed[k] = false;
  };

  return {
    attach() {
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
    },
    detach() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clear();
    },
    isDown: (code) => !!keys[code],
    pressed(code) {
      const val = !!justPressed[code];
      justPressed[code] = false;
      return val;
    },
    clear,
  };
}
