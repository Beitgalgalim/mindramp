import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";
import * as api from './api'
import { HourLines, VBox, Text, Spacer, NowLine } from "./elem";
import { DateFormats, day2DayName, explodeEvents, getDayDesc, getTimes, MonthMap2, sortEvents } from "./utils/date";
import { useLocation, useNavigate } from "react-router-dom";
import { UserEventsProps } from "./types";
import AudioPlayerRecorder from "./AudioRecorderPlayer";
const logo = require("./logo.png");

const headerSize = 60;
const eventsGapTop = 20;
const eventsGapRight = 45;
const eventsGapEnd = 5;
const footerSize = 40;
const mainBGColor = "black";

const profiles = ["basic", "large"];



function Event(props: any) {
    const borderWidth = 4
    const font1 = props.sliceWidth / 3;
    const font2 = props.sliceWidth / 4;
    const font3 = props.sliceWidth / 5;
    return (
        <div style={{
            position: "absolute", right: props.right, width: props.width - (2 * borderWidth), height: props.height - (2 * borderWidth), top: props.top,
            background: "white",
            borderStyle: "groove",
            borderWidth: borderWidth,
            borderColor: "yellow",
            opacity: 0.8,
            zIndex: 100
        }}>
            <div style={{
                display: 'flex', flexDirection: props.vertical ? 'row' : 'column', alignItems: 'center',
                height: "100%",
                width: "100%"
            }}>
                {props.event.imageUrl && <img src={props.event.imageUrl} style={{ maxWidth: props.width / 1.5, maxHeight: props.height / 2.5, padding: 10 }} alt="תמונה" />}
                {props.event.audioUrl &&
                    <AudioPlayerRecorder showRecordButton={false} showClearButton={false}
                        showPlayButton={props.event.audioUrl}
                        audioUrl={props.event.audioUrl}
                        buttonSize={props.vertical ? 25 : 35} />

                }
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    width: "35%"
                }} >
                    <Text textAlign="center" fontSize={font1}>{props.event.title}</Text>
                    <Text textAlign="center" fontSize={font2}>{dayjs(props.event.start).format(DateFormats.TIME) + " - " + dayjs(props.event.end).format(DateFormats.TIME)}</Text>
                </div>
                <Spacer height={25} />
                <Text width={"35%"} textAlign="center" fontSize={font3}>{props.event.notes || ""}</Text>
            </div>

        </div >
    );
}

//----------

// Inspired by https://stackoverflow.com/questions/11311410/visualization-of-calendar-events-algorithm-to-layout-events-with-maximum-width


/// Pick the left and right positions of each event, such that there are no overlap.
/// Step 3 in the algorithm.
function layoutEvents(events: any[]): any[] {

    let columns: any[][] = [];
    let lastEventEnding: any = null;

    //sort events first by start, then by end time
    events.sort((e1, e2) => {
        if (e1.start < e2.start) return -1;
        if (e1.start > e2.start) return 1;
        if (e1.end < e2.end) return -1;

        return 1;
    });

    events.forEach((ev) => {
        if (lastEventEnding !== null && ev.start >= lastEventEnding) {
            PackEvents(columns);
            columns = [];
            lastEventEnding = null;
        }
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
            const col = columns[i];

            if (!CollidesWith(col[col.length - 1], ev)) {
                col.push(ev);
                placed = true;
                break;
            }
        }

        if (!placed) {
            columns.push([ev]);
        }
        if (lastEventEnding == null || ev.end > lastEventEnding) {
            lastEventEnding = ev.end;
        }
    });

    if (columns.length > 0) {
        PackEvents(columns);
    }
    return events;
}

function CollidesWith(ev1: any, ev2: any) {
    return ev1.start < ev2.end && ev1.end > ev2.start;
}

/// Set the left and right positions for each event in the connected group.
/// Step 4 in the algorithm.
function PackEvents(columns: any[][]) {
    let numColumns = columns.length;
    let iColumn = 0;

    columns.forEach(col => {
        col.forEach((ev) => {
            let colSpan = ExpandEvent(ev, iColumn, columns);
            ev._left = iColumn / numColumns;
            ev._right = (iColumn + colSpan) / numColumns;
            ev._cols = numColumns;
        });

        iColumn++;
    });
}

/// Checks how many columns the event can expand into, without colliding with
/// other events.
/// Step 5 in the algorithm.
function ExpandEvent(ev: any, iColumn: number, columns: any[][]): number {
    let colSpan = 1;

    const iterOn = columns.slice(iColumn + 1);
    for (let i = 0; i < iterOn.length; i++) {
        const col = iterOn[i];
        for (let j = 0; j < col.length; j++) {
            const ev1 = col[j];
            if (CollidesWith(ev1, ev)) {
                return colSpan;
            }
        }
        colSpan++;
    }
    return colSpan;
}

function getTimeOffset(event: any, showDate: Dayjs, startHour: number, sliceWidth: number, sliceEachHour: number) {
    // calculate the time from startHour to start:
    const startHourD = dayjs(showDate.format(DateFormats.DATE)).add(startHour, "hours");
    const diffMin = - startHourD.diff(event.start, "minutes");
    const minPerSlice = 60 / sliceEachHour;
    return (diffMin / minPerSlice) * sliceWidth;
}

function getTimeWidth(event: any, sliceWidth: number, sliceEachHour: number) {
    const start = dayjs(event.start);
    const diffMin = - start.diff(event.end, "minutes");
    const minPerSlice = 60 / sliceEachHour;
    return (diffMin / minPerSlice) * sliceWidth;
}

function getDebugNow(date: Dayjs) {
    return dayjs(date.format(DateFormats.DATE) + " " + dayjs().format(DateFormats.TIME));
}

export default function UserEvents({ windowSize, connected }: UserEventsProps) {

    const [events, setEvents] = useState<any[]>([]);
    const [now, setNow] = useState<Dayjs>(getDebugNow(dayjs()));
    const [profile, setProfile] = useState<number>(0);
    const [startHour, setStartHour] = useState<number>(8);

    // eslint-disable-next-line no-unused-vars
    const [endHour, setEndHour] = useState<number>(16);
    const [workingHours, setWorkingHours] = useState<string[]>([]);

    //const [showDate, setShowDate] = useState<Dayjs>(dayjs());

    useEffect(() => {
        let s: number = 8, e: number = 16;
        switch (profile) {
            case 0:
                break;
            case 1:
                s = dayjs().hour() - 1;
                e = dayjs().hour() + 2;
                break;
        }
        setStartHour(s);
        setEndHour(e);
        setWorkingHours(getTimes(s, e, 60, "HH:mm"));
    }, [profile]);



    const location = useLocation();
    const navigate = useNavigate();
    let showDate: Dayjs;

    let showDateHash = location.hash && location.hash.substr(1);
    if (showDateHash && dayjs(showDateHash).isValid()) {
        showDate = dayjs(showDateHash);
    } else {
        showDate = dayjs();
    }

    const changeProfile = () => {
        setProfile(oldProfile => {
            oldProfile++;
            if (oldProfile >= profiles.length)
                oldProfile = 0;
            return oldProfile;
        })
    }


    useEffect(() => {
        if (!connected)
            return;
        api.getEvents().then(evts => setEvents(sortEvents(explodeEvents(evts))));
    }, [connected]);

    const updateNow = useCallback(() => {
        // For debugging, the Now is the time of the displayed day (and not the current date)
        setNow(getDebugNow(showDate));
        //setNow(dayjs());
    }, [showDate]);

    useEffect(() => {
        let intervalId = setInterval(updateNow, 2 * 1000)
        return (() => {
            clearInterval(intervalId)
        })
    }, [updateNow])



    //updateNow()


    const goBack = () => {
        navigate("#" + showDate.add(-1, "day").format(DateFormats.DATE))
        //        setShowDate(sd=>sd.add(-1, "day"));
    }
    const goForward = () => {
        navigate("#" + showDate.add(1, "day").format(DateFormats.DATE))
        //      setShowDate(sd=>sd.add(1, "day"));
    }


    const vertical = windowSize.w < windowSize.h;
    const sliceEachHour = 2;
    const availableHeight = windowSize.h - headerSize - footerSize;
    const sliceWidth = (vertical ? availableHeight : windowSize.w) / (workingHours.length * sliceEachHour);
    const eventsGapStart = vertical ? eventsGapRight : eventsGapTop
    const showingEvents = events.filter(e => e.start >= showDate.format(DateFormats.DATE) &&
        e.start < showDate.add(1, "day").format(DateFormats.DATE));

    const layouted = layoutEvents(showingEvents);

    //     let msg = ""
    //     layouted.forEach(ev => {
    //         msg += `(${ev._left},${ev._right}, ${ev._cols}) ${ev.title} 
    // `;
    //     })
    //     console.log("-----Tree----\n", msg)
    const slotSize = (vertical ? windowSize.w : availableHeight) - eventsGapStart - eventsGapEnd;;

    //eventsGapStart = 0;
    const eventsArray = layouted.map((ev, key) => {
        const vTOPhRIGHT = getTimeOffset(ev, showDate, startHour, sliceWidth, sliceEachHour) + sliceWidth / 2;
        const vRIGHThTOP = ev._left * slotSize;
        const vWIDTHhHeight = (ev._right - ev._left) * slotSize;
        const vHEIGHThWIDTH = getTimeWidth(ev, sliceWidth, sliceEachHour);
        return <Event
            key={key}
            top={vertical ? vTOPhRIGHT : vRIGHThTOP + eventsGapStart}
            height={vertical ? vHEIGHThWIDTH : vWIDTHhHeight}
            right={vertical ? vRIGHThTOP + eventsGapStart : vTOPhRIGHT}
            width={vertical ? vWIDTHhHeight : vHEIGHThWIDTH}
            event={ev}
            sliceWidth={sliceWidth}
            vertical={vertical}
        />
    });

    return <div dir="rtl" style={{ backgroundColor: mainBGColor, height: "100vh" }}>
        {/* Toolbar */}
        <div style={{
            display: "flex", flexDirection: "row",
            maxHeight: headerSize,
            height: headerSize,
            width: "100%",
            alignContent: "center"
        }}>
            <div style={{ display: "flex", alignContent: "flex-start", width: "33%" }}>
                <img onClick={() => changeProfile()} src={logo} style={{ height: headerSize - 20, }} alt={"לוגו של בית הגלגלים"} />
            </div>
            <Text color="white" textAlign="center" alignSelf="center" fontSize={20}>
                {`${getDayDesc(showDate)}: יום ${day2DayName[showDate.day()]}, ${showDate.date()} ב${MonthMap2[showDate.month()]}`}
            </Text>
            <div style={{ display: "flex", alignContent: "flex-end", width: "33%" }}>
                <Text color="white" textAlign="left" alignSelf="center" fontSize={20}>{now.format(DateFormats.TIME_AM_PM)}</Text>
            </div>
        </div>

        {/* Grid */}
        <HourLines
            height={availableHeight}
            sliceWidth={sliceWidth}
            hours={workingHours}
            sliceEachHour={sliceEachHour}
            vertical={vertical}
            windowSize={windowSize}
        />

        {/*Footer */}
        <div style={{
            display: "flex", flexDirection: "row",
            height: footerSize, width: "100%",
            alignContent: "center",
            backgroundColor: mainBGColor,
            zIndex: 1000
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", width: "33%" }}>
                <div style={{ display: "flex", alignContent: "center", justifyContent: "center", height: 24, width: 130, border: 1, borderColor: "white", borderRadius: 12, borderStyle: 'outset', color: "white" }}
                    onClick={() => goBack()}>&rarr;  אתמול</div>
            </div>
            <div style={{ display: "flex", width: "33%" }}>
                {/* <Text color="white" textAlign="center" alignSelf="center" fontSize={20}>
                    {`היום: יום ${day2DayName[showDate.day()]}, ${showDate.date()} ב${MonthMap2[showDate.month()]}`}
                </Text> */}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", width: "33%" }}>
                <div style={{ display: "flex", alignContent: "center", justifyContent: "center", height: 24, width: 130, border: 1, borderColor: "white", borderRadius: 12, borderStyle: 'outset', color: "white" }}
                    onClick={() => goForward()}>מחר  &larr;</div>
            </div>
        </div>



        {/* Event */}
        <div dir="rtl" style={{
            position: "absolute", right: 0, top: headerSize, left: 0, height: 0
        }} >
            {eventsArray}
        </div>

        {/*Now line */}
        <NowLine 
            vertical={vertical} 
            start={vertical? headerSize:headerSize}
            length={vertical? windowSize.w: availableHeight}
            offset={getTimeOffset({ start: now }, showDate, startHour, sliceWidth, sliceEachHour) + sliceWidth / 2 + 1}
        />
    </div>
}