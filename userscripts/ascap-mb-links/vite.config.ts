import { defineConfig } from "vite";
import Vue2 from "@vitejs/plugin-vue2";
import Userscript from "vite-userscript-plugin";
import { name, description, version, author } from "./package.json";

export default defineConfig({
    define: {
        "process.env.NODE_ENV": JSON.stringify("production")
    },
    plugins: [
        Vue2(),
        Userscript({
            entry: "src/index.ts",
            header: {
                name,
                description,
                version,
                author,
                match: [
                    "https://www.ascap.com/repertory"
                ],
                "run-at": "document-start"
            },
            server: {
                port: 3000
            }
        })
    ]
});
