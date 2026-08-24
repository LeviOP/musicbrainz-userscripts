<template>
    <a v-if="mbUrl" class="mb-link" :href="mbUrl" target="_blank" rel="noopener noreferrer" title="View on MusicBrainz" ref="anchor"></a>
    <span v-else-if="loading" class="mb-link" ref="anchor"></span>
</template>

<script lang="ts">
    import { findEntity, cancel } from "./lookup.js";
    import "./scroll-reprioritize.js";

    export default {
        props: {
            ipi: {
                type: String,
                required: true,
            },
            roleCode: {
                type: String,
                required: true,
            },
        },

        data() {
            return {
                mbUrl: null as string | null,
                loading: true
            };
        },

        computed: {
            entityType(): "label" | "artist" {
                return this.roleCode === "P" ? "label" : "artist";
            }
        },

        mounted() {
            this.renderIcon();

            if (this.ipi === "0") {
                this.loading = false;
                return;
            }

            findEntity(this.entityType, this.ipi, this).then(([canceled, mbid]: [boolean, string | null]) => {
                if (canceled) return;
                this.loading = false;
                if (mbid) this.mbUrl = `https://musicbrainz.org/${this.entityType}/${mbid}`;
            }).catch(() => {
                this.loading = false;
            });
        },

        beforeDestroy() {
            if (this.ipi !== "0") {
                cancel(this.entityType, this.ipi, this);
            }
        },

        updated(this: any) {
            this.renderIcon();
        },

        methods: {
            renderIcon(this: any) {
                if (!this.loading && !this.mbUrl) return;
                const anchor = this.$refs.anchor as HTMLElement;
                const url = this.loading
                    ? `https://musicbrainz.org/static/images/icons/loading.gif`
                    : `https://musicbrainz.org/static/images/entity/${this.entityType}.svg`
                GM_addElement(anchor, "img", {
                    src: url
                });
            }
        }
    };
</script>
