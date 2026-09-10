import { cacheGet, cacheSet } from "./cache.js";
import MusicBrainz from "./MusicBrainz.js";
import { name, version } from "../package.json";
import type { ComponentPublicInstance } from "vue";

const musicbrainz = new MusicBrainz(`${name}/${version} ( https://github.com/LeviOP/musicbrainz-userscripts/issues )`);

export type RequestType = "artist" | "label";

export interface RequestComponentInstance {
    componentInstance: ComponentPublicInstance;
    resolve: ([canceled, mbid]: [boolean, string | null]) => void;
    reject: () => void;
}

export interface Request {
    type: RequestType;
    ipi: string;
    componentInstances: RequestComponentInstance[];
}

let active = false;
const requests = new Map<string, Request>();
export const requestQueue: Request[] = [];

const INTERVAL_MS = 1000;

export async function findEntity(type: RequestType, ipi: string, componentInstances: ComponentPublicInstance): Promise<[boolean, string | null]> {
    const key = type[0] + ipi;

    const cached = cacheGet<string | null>(key);
    if (cached !== undefined) return [false, cached];

    const existing = requests.get(key);
    if (existing) {
        return new Promise<[boolean, string | null]>((resolve, reject) => {
            existing.componentInstances.push({ componentInstance: componentInstances, resolve, reject });
        });
    }

    return new Promise<[boolean, string | null]>((resolve, reject) => {
        const request: Request = {
            type,
            ipi,
            componentInstances: [{ componentInstance: componentInstances, resolve, reject }],
        };
        requests.set(key, request);
        requestQueue.push(request);
        ensureRunning();
    });
}

export function cancel(type: RequestType, ipi: string, componentInstance: ComponentPublicInstance) {
    const key = type[0] + ipi;
    const request = requests.get(key);
    if (!request) return;

    const i = request.componentInstances.findIndex(e => e.componentInstance === componentInstance);
    if (i === -1) return;

    const [removed] = request.componentInstances.splice(i, 1);
    removed.resolve([true, null]);

    // if nobody else is waiting on this request anymore and it hasn't
    // started running yet, pull it out of the queue entirely
    if (request.componentInstances.length === 0) {
        const qi = requestQueue.indexOf(request);
        if (qi !== -1) requestQueue.splice(qi, 1);
        requests.delete(key);
    }
}

function ensureRunning() {
    if (active) return;
    active = true;
    tick();
}

function tick() {
    const request = requestQueue.shift();
    if (!request) {
        active = false;
        return;
    }

    const key = request.type[0] + request.ipi;

    musicbrainz.search(request.type, `ipi:${request.ipi}`)
        .then((res) => {
            if (isRetryable(res.status)) {
                requestQueue.unshift(request);
                return;
            }

            if (res.status < 200 || res.status >= 300) {
                alert("I DIDN'T EXPECT THIS TO HAPPEN");
                requests.delete(key);
                request.componentInstances.forEach(e => e.reject());
                return;
            }

            const data = res.response;
            const mbid = data?.[request.type + "s"]?.[0]?.id ?? null;
            cacheSet(key, mbid);
            requests.delete(key);
            request.componentInstances.forEach(e => e.resolve([false, mbid]));
        })
        .catch((reason) => {
            console.log(reason);
            // idk what causes GM_xmlhttpRequest to fail but we'll retry
            requestQueue.unshift(request);
        })
        .finally(() => {
            setTimeout(tick, INTERVAL_MS);
        });
}

function isRetryable(status: number): boolean {
    return status === 503 || status === 502 || status === 504;
}
