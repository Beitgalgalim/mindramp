import origDayjs from "dayjs";

const dayjs = function(datStr) {
    // Safari does not support parsing dates with hyphens
    return origDayjs(datStr?.replace(/-/g, "/"))
};

export default dayjs;
