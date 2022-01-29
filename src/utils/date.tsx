import dayjs from "dayjs";

export const DateFormats = {
    DATE_TIME: "YYYY-MM-DDTHH:mm",
    DATE: "YYYY-MM-DD",
    TIME_AM_PM: "hh:mma"
};

export function getTimes(): string[] {
    const ret: string[] = [];
    const base = dayjs("2000-01-01 00:00");
    for (let i = 0; i < 48; i++) {
        ret.push(base.add(i * 30, "minutes").format(DateFormats.TIME_AM_PM));
    }
    return ret;
}