import { LeaderboardEntry } from '../types';

const STORAGE_KEY = 'zorigt_leaderboard_v1';
const PLAYER_NAME_KEY = 'zorigt_player_name_v1';
const UPDATE_EVENT = 'zorigt-leaderboard-updated';

export function getSavedPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name.trim().slice(0, 24));
  } catch {
    // Ignore storage quota errors
  }
}

export function getLeaderboardEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is LeaderboardEntry =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.playerName === 'string' &&
          typeof item.score === 'number'
      )
      .sort((a, b) => b.score - a.score || b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function addLeaderboardEntry(
  input: Omit<LeaderboardEntry, 'id' | 'createdAt'>
): LeaderboardEntry[] {
  const cleanName = input.playerName.trim().slice(0, 24) || 'Тоглогч';
  savePlayerName(cleanName);

  const nextEntry: LeaderboardEntry = {
    ...input,
    playerName: cleanName,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };

  const current = getLeaderboardEntries();
  const updated = [nextEntry, ...current]
    .sort((a, b) => b.score - a.score || b.createdAt - a.createdAt)
    .slice(0, 50);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }

  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  return updated;
}

export function clearLeaderboardEntries(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function subscribeLeaderboard(callback: () => void): () => void {
  const handleCustom = () => callback();
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };

  window.addEventListener(UPDATE_EVENT, handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(UPDATE_EVENT, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}
