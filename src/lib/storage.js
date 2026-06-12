import { env } from './env.js';

const PREFIX = env.storagePrefix;

export const loadState = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}:${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const saveState = (key, value) => {
  try {
    window.localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value));
  } catch {
    // Data URLs can exceed storage in a real browser. The UI still keeps state in memory.
  }
};
