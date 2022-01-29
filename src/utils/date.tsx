import dayjs from "dayjs";

export const DateFormats = {
    DATE_TIME: "YYYY-MM-DDTHH:mm",
    DATE: "YYYY-MM-DD",
    TIME_AM_PM: "hh:mma",
    TIME: "HH:mm"
};

export function getTimes(start:number = 0, end:number = 48, jump:number=30, fmt:string = DateFormats.TIME_AM_PM): string[] {
    const ret: string[] = [];
    const base = dayjs("2000-01-01 00:00");
    for (let i = start; i < end; i++) {
        ret.push(base.add(i * jump, "minutes").format(fmt));
    }
    return ret;
}

