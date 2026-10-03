import { STORAGE_KEYS } from '../../core/config';
import type { MatchRecord } from './types';

export interface PendingMatch {
    readonly record: MatchRecord;
    readonly attempts: number;          // failed sync rounds
    readonly lastError: string | null;
    readonly lastAttemptAt: string | null;
}

type Listener = () => void;

function readJson(key: string): unknown {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeJson(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* Storage full/unavailable: keep in-memory state */
    }
}

// --- Pending queue ---

const changeListeners = new Set<Listener>();
const syncListeners = new Set<Listener>();

const readQueue = (): readonly PendingMatch[] => {
    const value = readJson(STORAGE_KEYS.pendingMatches);
    return Array.isArray(value) ? (value as PendingMatch[]) : [];
};

let queue = readQueue();

function commit(next: readonly PendingMatch[]): void {
    queue = next;
    writeJson(STORAGE_KEYS.pendingMatches, next);
    changeListeners.forEach((l) => l());
}

function subscribe(listener: Listener): () => void {
    changeListeners.add(listener);
    return () => { changeListeners.delete(listener); };
}

function onSyncRequested(listener: Listener): () => void {
    syncListeners.add(listener);
    return () => { syncListeners.delete(listener); };
}

function requestSync(): void {
    syncListeners.forEach((l) => l());
}

function enqueue(record: MatchRecord): void {
    if (queue.some((p) => p.record.id === record.id)) return;
    commit([...queue, { record, attempts: 0, lastError: null, lastAttemptAt: null }]);
    requestSync();
}

function remove(id: string): void {
    if (!queue.some((p) => p.record.id === id)) return;
    commit(queue.filter((p) => p.record.id !== id));
}

function markFailed(id: string, message: string): void {
    commit(queue.map((p) => p.record.id === id
        ? { ...p, attempts: p.attempts + 1, lastError: message, lastAttemptAt: new Date().toISOString() }
        : p));
}

export const pendingQueue = {
    getSnapshot: () => queue,
    subscribe,
    onSyncRequested,
    requestSync,
    enqueue,
    remove,
    markFailed,
    clear: () => commit([]),
};

// Cross-tab consistency (app-lifetime singleton listener)
window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEYS.pendingMatches && e.key !== null) return;
    queue = readQueue();
    changeListeners.forEach((l) => l());
});

// --- Last completed match ---

export const lastResultStorage = {
    load(): MatchRecord | null {
        const value = readJson(STORAGE_KEYS.lastResult);
        return value && typeof value === 'object' && 'id' in value ? (value as MatchRecord) : null;
    },
    save: (record: MatchRecord) => writeJson(STORAGE_KEYS.lastResult, record),
    clear: () => localStorage.removeItem(STORAGE_KEYS.lastResult),
};
