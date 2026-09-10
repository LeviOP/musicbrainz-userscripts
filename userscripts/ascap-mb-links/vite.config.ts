import { defineConfig } from "vite";
import Vue2 from "@vitejs/plugin-vue2";
import UserscriptPlugin from "vite-userscript-plugin";
import { name, displayName, description, version, author } from "./package.json" with { type: "json" };
import { namespace, homepage as homepageURL, bugs } from "../../package.json" with { type: "json" };
import { optimize } from "svgo";
import { readFileSync } from "node:fs";

const ICON_PATH = "src/assets/icon.svg";

export default defineConfig({
    define: {
        "process.env.NODE_ENV": JSON.stringify("production")
    },
    plugins: [
        Vue2(),
        UserscriptPlugin({
            entry: "src/main.ts",
            header: {
                name: displayName,
                namespace,
                version: process.env.USERSCRIPT_VERSION || version,
                description,
                icon: optimize(
                    readFileSync(ICON_PATH, "utf-8"),
                    { path: ICON_PATH, datauri: "enc" },
                ).data,
                author,
                homepageURL,
                supportURL: bugs.url,
                match: [
                    "https://www.ascap.com/repertory"
                ],
                "run-at": "document-start",
                downloadURL: process.env.USERSCRIPT_DOWNLOAD_URL,
                updateURL: process.env.USERSCRIPT_UPDATE_URL,
            },
            server: {
                file: true,
            },
            metaFile: process.env.USERSCRIPT_DOWNLOAD_URL !== "none",
            fileName: name,
        })
    ],
    build: {
        minify: true,
    },
});
