import { init } from "userscript-webpack-patcher";
import MbLinkButton from "./MbLinkButton.vue";

init({
    patches: [
        {
            find: `name:"workCreditorsTable"`,
            replacement: [
                {
                    match: /creditorEntry:Object\(.\..\)\(.,function\(\){var (.)=this,(.)=\1\._self\._c;return \2\("tr",\[\2\("td",\[/,
                    replace: `$&$2($[MbLinkButton],{props:{ipi:$1.ipiNaNum,roleCode:$1.roleCode}}),`
                }
            ],
            inject: { MbLinkButton }
        }
    ]
});
