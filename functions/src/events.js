const dayjs = require("dayjs");

const DATE_FORMAT = "YYYY-MM-DD";
const TIME_FORMAT = "HH:mm";
const toMidNight = (d) => dayjs(d.format(DATE_FORMAT));

const adjustEvent = (evt, date) => {
    evt.start = replaceDatePreserveTime(evt.start, date);
    evt.end = replaceDatePreserveTime(evt.end, date);
};

const replaceDatePreserveTime = (origin, newDate) => {
    const origDate = dayjs(origin);
    return newDate.format(DATE_FORMAT) + "T" + origDate.format(TIME_FORMAT);
};


module.exports.explodeEvents = (events, daysBefore, daysAfter, startDate) => {
    // Defaults
    if (daysBefore === undefined) {
        daysBefore = 30;
    }

    if (daysAfter === undefined) {
        daysAfter = 60;
    }

    const ret = [];
    const today = startDate && startDate !== "" ?
        toMidNight(dayjs(startDate)) :
        toMidNight(dayjs());

    events.forEach((event) => {
        if (event.recurrent && !event.instanceStatus) {
            const rec = event.recurrent;
            const start = toMidNight(dayjs(event.start));
            const weekDay = start.day();

            for (let i = -daysBefore; i < daysAfter; i++) {
                const date = today.add(i, "days");
                const dateStr = date.format(DATE_FORMAT);
                const daysSinceStart = - start.diff(date, "days");

                if (!rec.exclude?.includes(dateStr) && daysSinceStart >= 0) {
                    if (rec.freq === "daily" ||
                        (rec.freq === "weekdays" && date.day() >= 0 && date.day() <= 4) ||
                        (rec.freq === "weekly" && date.day() === weekDay) ||
                        (rec.freq === "biWeekly" && date.day() === weekDay && daysSinceStart % 14 === 0)
                    ) {
                        const eventObj = { ...event };
                        adjustEvent(eventObj, date);
                        ret.push(eventObj);
                    }
                }
            }
        } else {
            ret.push(event);
        }
    });
    return ret;
};

const MonthMap = {
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


const day2DayName = {
    0: "ראשון",
    1: "שני",
    2: "שלישי",
    3: "רביעי",
    4: "חמישי",
    5: "שישי",
    6: "שבת",
};

exports.getNiceDate = (d) => {
    const djs = dayjs(d);
    let date = MonthMap[djs.format("MMM")] + "-" + djs.format("DD");
    if (djs.year() !== dayjs().year()) {
        date += ", " + djs.year();
    }
    const day = day2DayName[djs.day()];
    return {
        date,
        day,
        hour: djs.format("HH:mm"),
    };
};