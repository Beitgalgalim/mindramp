import dayjs, { Dayjs } from "dayjs";
import { RecurrentEventField } from "../event";

export const DateFormats = {
    DATE_TIME: "YYYY-MM-DDTHH:mm",
    DATE_TIME_TS: "YYYY-MM-DDTHH:mm.SSS",
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

export const toMidNight = (d: Dayjs) => dayjs(d.format(DateFormats.DATE));

export function getDayDesc(date: Dayjs): string {

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
export function explodeEvents(events: any, daysBefore: number = 30, daysAfter: number = 30, startDate?: string): any[] {
    const ret: any[] = [];
    const today = startDate && startDate != "" ?
        toMidNight(dayjs(startDate)):
        toMidNight(dayjs());
        
    events.forEach((event: any) => {
        if (event.recurrent && !event.instanceStatus) {
            const rec: RecurrentEventField = event.recurrent;
            const start = toMidNight(dayjs(event.start));
            const weekDay = start.day();
            for (let i = -daysBefore; i < daysAfter; i++) {
                const date = today.add(i, "days");
                const dateStr = date.format(DateFormats.DATE);
                if (!rec.exclude?.includes(dateStr) && start.diff(date, "days") <= 0) {
                    if (rec.freq === "daily" || (rec.freq === "weekly" && date.day() === weekDay)) {
                        const eventObj = { ...event }
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

export function replaceDatePreserveTime(origin: string, newDate: Dayjs): string {
    const origDate = dayjs(origin);
    return newDate.format(DateFormats.DATE) + "T" + origDate.format(DateFormats.TIME);
}

export function replaceDatePreserveTime2(origin: string, newDate: any): string {
    if (origin) {
        const origDate = dayjs(origin);
        return dayjs(dayjs(newDate).format(DateFormats.DATE) + "T" + origDate.format(DateFormats.TIME)).format(DateFormats.DATE_TIME);
    }
    return dayjs(newDate).format(DateFormats.DATE_TIME);
}

export function sortEvents(events: any[]): any[] {
    return events.sort((e1, e2) => {
        if (e1.start < e2.start) return -1;
        if (e1.start > e2.start) return 1;
        if (e1.end < e2.end) return -1;

        return 1;
    });
}

function getDateFromTime(timeStr: string): Dayjs {
    if (!timeStr || timeStr.trim().length === 0) {
        throw new Error("Not a valid time");
    }
    timeStr = timeStr.replace("am", " am");
    timeStr = timeStr.replace("pm", " pm");


    return dayjs("2000-01-01 " + timeStr);

}

export function validTime(timeStr: string): boolean {
    if (!timeStr || timeStr.trim().length === 0) {
        return false;
    }
    const date = getDateFromTime(timeStr);
    return date.isValid();
}

export function timeRange2Text(timeStr1: string, timeStr2: string): string {
    return time2Text(timeStr1, timeStr2) + " עד " + time2Text(timeStr2)
}

export function time2Text(timeStr: string, omitAmPmIfSame: string | undefined = undefined): string {
    const d = getDateFromTime(timeStr);
    let omitAmPm = false;
    let result = "";
    let pm = d.hour() > 11;

    if (omitAmPmIfSame) {
        const d2 = getDateFromTime(omitAmPmIfSame);
        if (d2.hour() > 11 && pm) {
            omitAmPm = true;
        }
    }

    if (d.hour() <= 12) {
        result += number2Text(d.hour(), true);
    } else {
        result += number2Text(d.hour() - 12, true);
    }

    if (d.minute() > 0) {
        if (d.minute() < 10) {
            result += " ו" + number2Text(d.minute(), false) + " דקות";
        } else if (d.minute() % 10 === 0) {
            result += " ו" + number2Text(d.minute(), false);
        } else {
            result += " " + number2Text(Math.floor(d.minute() / 10) * 10, false) + " ו" + number2Text(d.minute() % 10, false);
        }
    }
    if (pm && !omitAmPm) {
        result += " אחר הצהריים"
    }

    return result;
}

function number2Text(num: number, isHour: boolean): string {
    switch (num) {
        case 0:
            return "אפס";
        case 1:
            return "אחת";
        case 2:
            return "שתיים";
        case 3:
            return "שלוש";
        case 4:
            return "ארבע";
        case 5:
            return "חמש";
        case 6:
            return "שש";
        case 7:
            return "שבע";
        case 8:
            return "שמונה";
        case 9:
            return "תשע";
        case 10:
            return "עשר";
        case 11:
            return "אחת עשרה";
        case 12:
            return "שתיים עשרה";
        case 20:
            return "עשרים";
        case 30:
            return "שלושים";
        case 40:
            return "ארבעים";
        case 50:
            return "חמישים";
    }
    return "";
}