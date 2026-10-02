const SCHEMA_VERSION = "0";
const SCHEMA_VERSION_KEY = "__schemaVersion";

const SCHEMA_FROM_TO_UPDATER_MAP: Record<string, Record<string, () => void>> = {
    "none": {
        "0": () => {
            // We are just going to assume everything is the way we left it here.
            const keys = GM_listValues();
            const records = GM_getValues<Record<string, string>>(keys);
            for (const key in records) {
                const existing = records[key];
                let cache: any;
                try {
                    cache = JSON.parse(existing);
                } catch {
                    console.log("parsing cache json failed");
                    continue;
                }

                if (Array.isArray(cache.value)) continue;

                if (cache.value === null) {
                    cache.value = [];
                } else {
                    cache.value = [cache.value];
                }

                records[key] = JSON.stringify(cache);
            }

            records[SCHEMA_VERSION_KEY] = SCHEMA_VERSION;

            GM_setValues(records);
        },
    },
};

export function update() {
    const keys = GM_listValues();
    if (keys.length === 0) {
        GM_setValue(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
        return;
    }

    let lastVersion: string;
    if (!keys.includes(SCHEMA_VERSION_KEY)) {
        lastVersion = "none";
    } else {
        const lastVersionRaw = GM_getValue(SCHEMA_VERSION_KEY);
        if (typeof lastVersionRaw !== "string") {
            console.log("Last version was corrupt!");
            return;
        } else {
            lastVersion = lastVersionRaw;
        }
    }

    // We are already at the current version :-)
    if (lastVersion === SCHEMA_VERSION) return;

    const lastVersionUpdaterMap = SCHEMA_FROM_TO_UPDATER_MAP[lastVersion];
    if (lastVersionUpdaterMap === undefined) {
        console.log("Unknown last schema version!", lastVersion);
        return;
    }
    const updater = lastVersionUpdaterMap[SCHEMA_VERSION];

    if (updater === undefined) {
        console.log("There is not a schema updater for this version!", lastVersion, SCHEMA_VERSION);
        return;
    }

    console.log(`Running schema updater (${lastVersion} => ${SCHEMA_VERSION})`);
    updater();
}
