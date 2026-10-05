"use client";

const STORAGE_KEY = "geolatino-progress";

export function useLocalProgress() {
  function read() {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as unknown) : null;
  }

  function write(value: unknown) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  return { read, write };
}
