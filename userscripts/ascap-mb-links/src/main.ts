import { init } from "userscript-webpack-patcher";
import MBEntityLinks from "./MBEntityLinks.vue";
import { update } from "./storage-schema";

update();

init({
    patches: [
        {
            find: `name:"workCreditorsTable"`,
            replacement: [
                {
                    match: /creditorEntry:Object\(.\..\)\(.,function\(\){var (.)=this,(.)=\1\._self\._c;return \2\("tr",\[\2\("td",\[/,
                    replace: `$&$2($[MBEntityLinks],{props:{type:$1.roleCode==="P"?"label":"artist",query:$1.ipiNaNum}}),`,
                },
                {
                    match: /function\(\){var (.)=this,(.)=\1._self\._c;return \2\("div",{class:{"has-marker":\1.songview}},\[\2\("div",{staticClass:"row"},\[\2\("div",{staticClass:"col-sm-6"},\[\2\("h2",{staticClass:"[^"]*",class:{[^}]*}},\[/,
                    replace: `$&$2($[MBEntityLinks],{props:{type:"work",query:$1.cardInfo.ISWCCde}}),`,
                },
            ],
            inject: { MBEntityLinks }
        }
    ]
});
