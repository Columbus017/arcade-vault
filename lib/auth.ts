export interface FakeUser {
  name: string;
}

export interface ScoreEntry {
  game: string;
  score: number;
  name: string;
  at: number;
}

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

export function getStoredUser(): FakeUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setStoredUser(user: FakeUser | null): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // localStorage unavailable — login state won't persist
  }
}

export function clearStoredUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // localStorage unavailable
  }
}

export function pushStoredScore(entry: Omit<ScoreEntry, "at">): void {
  try {
    const all: ScoreEntry[] = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {
    // localStorage unavailable — score won't persist
  }
}
