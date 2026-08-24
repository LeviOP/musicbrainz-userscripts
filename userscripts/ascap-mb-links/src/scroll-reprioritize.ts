import { requestQueue } from "./lookup.js";

let scheduled = false;
let lastRun = 0;
const throttleMs = 800;

function onScroll() {
    const now = Date.now();
    if (scheduled) return;
    scheduled = true;

    const delay = Math.max(0, throttleMs - (now - lastRun));
    setTimeout(() => {
        lastRun = Date.now();
        scheduled = false;
        reprioritizeByViewportDistance();
    }, delay);
}

window.addEventListener("scroll", onScroll, { passive: true });

function getStickyHeaderOffset(): number {
    const header = document.querySelector<HTMLDivElement>("div.c-sticky-element");
    if (header === null) return 0;

    const rect = header.getBoundingClientRect();
    return rect.bottom;
}

// Margin for prioritizing loading things right outside of the top of the viewport
const TOP_MARGIN = 60;

function reprioritizeByViewportDistance() {
    const topOffset = getStickyHeaderOffset();
    const visibleHeight = window.innerHeight - topOffset;

    const scored = requestQueue.map(request => {
        const distances = request.vueInstances.map((requestVueInstance) => {
            const el = requestVueInstance.vueInstance.$el;
            if (!el.isConnected) return Infinity;
            const rect = el.getBoundingClientRect();
            const distanceFromVisibleTop = rect.top - topOffset;
            return distanceFromVisibleTop >= -TOP_MARGIN
                ? Math.abs(distanceFromVisibleTop)
                : visibleHeight - distanceFromVisibleTop;
        });
        return {
            request,
            score: distances.length ? Math.min(...distances) : Infinity
        };
    });

    scored.sort((a, b) => a.score - b.score);
    requestQueue.length = 0;
    requestQueue.push(...scored.map(s => s.request));
}
