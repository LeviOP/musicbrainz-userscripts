<template>
    <span class="mb-links" ref="links">
        <a v-for="mbid in mbids" :href="`https://musicbrainz.org/${type}/${mbid}`" target="_blank" rel="noopener noreferrer" title="View on MusicBrainz"></a>
    </span>
</template>

<style scoped>
    .mb-links img {
        width: 1em;
        height: 1em;
        vertical-align: -0.125em;
    }
</style>

<script lang="ts">
    import { PropType } from "vue";
    import { findEntities, cancel, EntityType } from "./lookup.js";
    import "./scroll-reprioritize.js";
    import ISWC from "./ISWC.js";

    export default {
        props: {
            type: {
                type: String as PropType<EntityType>,
                required: true,
            },
            identifier: {
                type: String,
                required: true,
            },
        },

        data() {
            return {
                mbids: [] as string[],
                loading: true,
            };
        },

        computed: {
            validIdentifier(): string | null {
                if (this.type === "work") {
                    if (this.identifier === " ") return null;
                    // ISWC.parse throws
                    try {
                        const iswc = ISWC.parse(this.identifier);
                        if (!iswc.isValid()) return null;
                        return iswc.toStringFormmated();
                    } catch (e) {
                        console.error(e);
                        return null;
                    }
                }

                // for artist and label IPI numbers
                if (this.identifier === "0") return null;
                return this.identifier;
            },
        },

        mounted() {
            if (this.validIdentifier === null) {
                this.loading = false;
                return;
            }

            this.renderIcon();

            findEntities(this.type, this.validIdentifier, this).then(([canceled, mbids]: [boolean, string[]]) => {
                if (canceled) return;
                this.loading = false;
                this.mbids = mbids;
            }).catch(() => {
                this.loading = false;
            });
        },

        beforeDestroy() {
            if (this.validIdentifier !== null) {
                cancel(this.type, this.validIdentifier, this);
            }
        },

        updated() {
            this.renderIcon();
        },

        methods: {
            renderIcon() {
                const container = this.$refs.links as HTMLElement;
                for (const child of Array.from(container.children)) if (child instanceof HTMLImageElement) child.remove();

                if (!this.loading && this.mbids.length === 0) return;
                if (this.loading) {
                    GM_addElement(container, "img", {
                        src: `https://musicbrainz.org/static/images/icons/loading.gif`,
                        [this.$options._scopeId]: "",
                    });
                    return;
                }

                for (const child of Array.from(container.children)) {
                    GM_addElement(child, "img", {
                        src: `https://musicbrainz.org/static/images/entity/${this.type}.svg`,
                        [this.$options._scopeId]: "",
                    });
                }
            }
        }
    };
</script>
