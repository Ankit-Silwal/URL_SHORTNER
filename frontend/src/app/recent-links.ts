// A tiny localStorage-backed store for "your recent links".
// Uses useSyncExternalStore so the server render (empty list) and the browser agree.
import { useSyncExternalStore } from "react";

export type RecentLink = { code: string; shortUrl: string; url: string; createdAt: number };

const KEY = "shortly:recent";
const MAX = 10;
const EMPTY: RecentLink[] = [];

let cache: RecentLink[] | null = null;
const listeners = new Set<() => void>();

function read(): RecentLink[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(links: RecentLink[]) {
  cache = links;
  try {
    localStorage.setItem(KEY, JSON.stringify(links));
  } catch {
    // Private mode / storage full: keep the in-memory copy, that's fine.
  }
  listeners.forEach((l) => l());
}

export function addRecent(link: RecentLink) {
  write([link, ...read().filter((l) => l.code !== link.code)].slice(0, MAX));
}

export function clearRecent() {
  write(EMPTY);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRecentLinks() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
