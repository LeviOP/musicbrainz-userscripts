import { cacheGet, cacheSet } from "./cache.js";
import MusicBrainz from "./MusicBrainz.js";
import { name, version } from "../package.json";
import type { ComponentPublicInstance } from "vue";

const musicbrainz = new MusicBrainz(`${name}/${version} ( https://github.com/LeviOP/musicbrainz-userscripts/issues )`);

export type EntityType = "artist" | "label" | "work";

export interface RequestComponentInstance {
    componentInstance: ComponentPublicInstance,
    resolve: ([canceled, mbid]: [boolean, string[]]) => void,
    reject: () => void,
}

export interface Request {
    type: EntityType,
    query: string,
    componentInstances: RequestComponentInstance[],
}

let active = false;
const requests = new Map<string, Request>();
export const requestQueue: Request[] = [];

const INTERVAL_MS = 1000;

export async function findEntities(type: EntityType, query: string, componentInstance: ComponentPublicInstance): Promise<[boolean, string[]]> {
    const key = type[0] + query;

    const cached = cacheGet<string[]>(key);
    console.log("cached", query, cached);
    if (cached !== undefined) return [false, cached];

    const existing = requests.get(key);
    if (existing) {
        return new Promise<[boolean, string[]]>((resolve, reject) => {
            existing.componentInstances.push({ componentInstance: componentInstance, resolve, reject });
        });
    }

    return new Promise<[boolean, string[]]>((resolve, reject) => {
        const request: Request = {
            type,
            query,
            componentInstances: [{ componentInstance: componentInstance, resolve, reject }],
        };
        requests.set(key, request);
        requestQueue.push(request);
        ensureRunning();
    });
}

export function cancel(type: EntityType, query: string, componentInstance: ComponentPublicInstance) {
    const key = type[0] + query;
    const request = requests.get(key);
    if (!request) return;

    const i = request.componentInstances.findIndex(e => e.componentInstance === componentInstance);
    if (i === -1) return;

    const [removed] = request.componentInstances.splice(i, 1);
    removed.resolve([true, []]);

    // if nobody else is waiting on this request anymore and it hasn't
    // started running yet, pull it out of the queue entirely
    // TODO: maybe we want this info anyway for good measure? we could just put it at the back of the queue
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

    const key = request.type[0] + request.query;

    let promise;
    if (request.type === "work") {
        promise = musicbrainz.lookup("iswc", request.query.replace(/^(T)(\d{3})(\d{3})(\d{3})(\d)$/, "$1-$2.$3.$4-$5"))
    } else {
        promise = musicbrainz.search(request.type, `ipi:${request.query}`)
    }

    promise
        .then((res) => {
            if (isRetryable(res.status)) {
                requestQueue.unshift(request);
                return;
            }

            if ((res.status < 200 || res.status >= 300) && res.status !== 404) {
                alert("I DIDN'T EXPECT THIS TO HAPPEN");
                console.log(res);
                requests.delete(key);
                request.componentInstances.forEach(e => e.reject());
                return;
            }

            let mbids: string[];
            // lookups (which we use to query works) return 404 instead of empty list
            if (res.status === 404) {
                mbids = [];
            } else {
                const data = res.response;
                mbids = (data?.[request.type + "s"] as { id: string }[])?.map((entity) => entity.id);
            }

            cacheSet(key, mbids);
            requests.delete(key);
            request.componentInstances.forEach(e => e.resolve([false, mbids]));
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
