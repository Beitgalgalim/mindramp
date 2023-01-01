import dayjs from "dayjs";

const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

// const dayjs = function(dateIn) {
//     // Safari does not support parsing dates with hyphens
//     if (dateIn && typeof dateIn === "string") {
//         //dateIn = dateIn.replace(/-/g, "/");
//     }
//     return origDayjs(dateIn)
// };

export default dayjs;
