import dayjs, { Dayjs } from "dayjs";
import { RecurrentEventField } from "../types";

export const DateFormats = {
    DATE_TIME: "YYYY-MM-DDTHH:mm",
    DATE: "YYYY-MM-DD",
    TIME_AM_PM: "hh:mma",
    TIME: "HH:mm"
};

export function getTimes(start: number = 0, end: number = 48, jump: number = 30, fmt: string = DateFormats.TIME_AM_PM): string[] {
    const ret: string[] = [];
    const base = dayjs("2000-01-01 00:00");
    for (let i = start; i < end; i++) {
        ret.push(base.add(i * jump, "minutes").format(fmt));
    }
    return ret;
}

export const MonthMap: { [id: string]: string; } = {
    Jan: "ינו",
    Feb: "פבר",
    Mar: "מרץ",
    Apr: "אפר",
    May: "מאי",
    Jun: "יוני",
    Jul: "יולי",
    Aug: "אוג",
    Sep: "ספט",
    Oct: "אוק",
    Nov: "נוב",
    Dec: "דצמ",
};


export const MonthMap2: { [id: number]: string; } = {
    0: "ינואר",
    1: "פברואר",
    2: "מרץ",
    3: "אפריל",
    4: "מאי",
    5: "יוני",
    6: "יולי",
    7: "אוגוסט",
    8: "ספטמבר",
    9: "אוקטובר",
    10: "נובמבר",
    11: "דצמבר",
};


export const day2DayName: { [id: number]: string; } = {
    0: "ראשון",
    1: "שני",
    2: "שלישי",
    3: "רביעי",
    4: "חמישי",
    5: "שישי",
    6: "שבת",
};

export function getDayDesc(date: Dayjs): string {

    const toMidNight = (d: Dayjs) => dayjs(d.format(DateFormats.DATE));


    const now = toMidNight(dayjs());
    const diff = date.diff(toMidNight(now), "days");

    switch (diff) {
        case 0: return "היום";
        case 1: return "מחר";
        case 2: return "מחרתיים";
        case -1: return "אתמול";
        case -2: return "שלשום";
        default:
            return `${diff < 0 ? "לפני" : "עוד"} ${Math.abs(diff)} ימים`;

    }


}

/*
 * look for a field recurrent which is a map with following fields
     freq: "daily" | "weekly" | custom
     daysOfWeek: [days] - only when freq is custom. array of int days, where 0 is sunday and 6 is Sat
     groudId: string - a unique ID grouping events together. 
                       this is useful when an exception is created, to remove it with the recurrent meeting
     exclude: [dates] - an array of dates in which not to have the recurrent meeting. useful to change a specific instance, which becomes own event, 
                        with same groupID and its date is fed here

    logic:
    when exploding, we explode from *daysBefore* today until *daysAfter* today
 }
 */
export function explodeEvents(events: any, daysBefore: number = 30, daysAfter: number = 30): any[] {
    const ret: any[] = [];
    const today = dayjs();
    events.forEach((event: any) => {
        if (event.recurrent && !event.instanceStatus) {
            const rec: RecurrentEventField = event.recurrent;
            const weekDay = dayjs(event.start).day();
            for (let i = -daysBefore; i < daysAfter; i++) {
                const date = today.add(i, "days");
                const dateStr = date.format(DateFormats.DATE);
                if (!rec.exclude?.includes(dateStr)) {
                    if (rec.freq === "daily" || (rec.freq == "weekly" && date.day() == weekDay)) {
                        const eventObj = {...event}
                        adjustEvent(eventObj, date);
                        ret.push(eventObj);
                    }
                }
            }
        } else {
            ret.push(event);
        }
    })
    return ret;
}

function adjustEvent(evt: any, date: Dayjs) {
    evt.start = replaceDatePreserveTime(evt.start, date);
    evt.end = replaceDatePreserveTime(evt.end, date);
}

function replaceDatePreserveTime(origin: string, newDate: Dayjs): string {
    const origDate = dayjs(origin);
    return newDate.format(DateFormats.DATE) + " " + origDate.format(DateFormats.TIME);
}