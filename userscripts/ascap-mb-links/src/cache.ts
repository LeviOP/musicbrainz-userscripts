const CACHE_TTL_MS = 4 * 7 * 24 * 60 * 60 * 1000; // 4 weeks

interface CacheEntry<T> {
    value: T;
    ts: number;
}

export function cacheGet<T>(key: string): T | undefined {
    const raw = GM_getValue(key) as string | undefined;
    if (!raw) return undefined;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
        GM_deleteValue(key);
        return undefined;
    }
    return entry.value;
}

export function cacheSet<T>(key: string, value: T): void {
    const entry: CacheEntry<T> = { value, ts: Date.now() };
    GM_setValue(key, JSON.stringify(entry));
}
