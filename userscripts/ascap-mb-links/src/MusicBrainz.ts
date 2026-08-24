export default class MusicBrainz {
    API_ROOT = "https://musicbrainz.org/ws/2/";

    userAgent: string;

    constructor(userAgent: string) {
        this.userAgent = userAgent;
    }

    async search(entity: string, query: string) {
        return new Promise<Tampermonkey.Response<any>>((resolve, reject) => {
            GM_xmlhttpRequest({
                url: this.API_ROOT + entity + "/?fmt=json&query=" + query,
                responseType: "json",
                headers: {
                    "User-Agent": this.userAgent,
                },
                onload: resolve,
                onerror: reject,
            });
        })
    }
}
