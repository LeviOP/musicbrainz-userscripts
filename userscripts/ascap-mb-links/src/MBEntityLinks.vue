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

    export default {
        props: {
            type: {
                type: String as PropType<EntityType>,
                required: true,
            },
            query: {
                type: String,
                required: true,
            },
        },

        data() {
            return {
                mbids: [] as string[],
                loading: true
            };
        },

        mounted() {
            if ((this.type !== "work" && this.query === "0") || (this.type === "work" && this.query === " ")) {
                this.loading = false;
                return;
            }

            this.renderIcon();

            // TODO: sanitize / standardize iswcs in some way
            findEntities(this.type, this.query, this).then(([canceled, mbids]: [boolean, string[]]) => {
                if (canceled) return;
                this.loading = false;
                this.mbids = mbids;
            }).catch(() => {
                this.loading = false;
            });
        },

        beforeDestroy() {
            if ((this.type !== "work" && this.query !== "0") || (this.type === "work" && this.query !== " ")) {
                cancel(this.type, this.query, this);
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
