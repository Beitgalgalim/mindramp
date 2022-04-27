import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";
import * as api from './api'
import { HourLines, VBox, Text, Spacer, NowLine, HBox, EventsMain, HBoxSB, HBoxC, VBoxC, EventProgress } from "./elem";
import { DateFormats, day2DayName, explodeEvents, getDayDesc, getTimes, MonthMap2, sortEvents, time2Text, timeRange2Text } from "./utils/date";
import { useLocation, useNavigate } from "react-router-dom";
import { UserEventsProps } from "./types";
import AudioPlayerRecorder from "./AudioRecorderPlayer";
import { Style } from "./elem"
import EventsHeader from "./events-header";
import EventsNavigation from "./events-navigation";
import Events from "./events";
import { AccessTime, PermIdentity, Timer } from "@mui/icons-material";

const logo = require("./logo.png");


const headerSize = 60;
const eventsGapTop = 20;
const eventsGapRight = 45;
const eventsGapEnd = 5;
const footerSize = 40;
const mainBGColor = "black";

const profiles = ["basic", "large"];

const multipleFactor = .7;
const buttonSize = 50;

function Event(props: any) {
    const t1 = dayjs(props.event.start).format(DateFormats.TIME)
    const t2 = dayjs(props.event.end).format(DateFormats.TIME)
    const baseWidth = window.innerWidth;

    const titleAndRoom = <div style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: "flex-start",
        paddingRight: 15,
    }} >
        <Text role="text">{props.event.title}</Text>
        <Spacer height={2} />
        <Text role="text" fontSize="0.7em">חדר מולטימדיה</Text>
    </div>

    const isSingle = !!props.single;
    return (
        <div style={{
            flex: "0 0 auto",
            width: (isSingle ? baseWidth : baseWidth * multipleFactor) - 48,
            height: isSingle ? 150 : 230,
            background: "white",
            borderRadius: 10,
            marginRight: props.secondInGroup ? 0 : 24,
            marginLeft: 24,
            marginBottom: 30,
            marginTop: 1,
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: "flex-start",
                height: 78,
                paddingTop: 10,
                paddingRight:10,
                paddingLeft:10,
                justifyContent:isSingle?"flex-start": props.event.imageUrl? "space-between":"flex-end",
            }}>
                {
                    props.event.imageUrl && <div style={{ width: 78 }}>
                        <img src={props.event.imageUrl} style={{ maxWidth: 78, maxHeight: 78}} alt="תמונה" />
                    </div>
                }
                {!isSingle && <PermIdentity style={{ fontSize: buttonSize }} />}
                {isSingle && titleAndRoom}
            </div>
            <Spacer height={5} />
            {!isSingle && titleAndRoom}
            {!isSingle && <Spacer height={25} />}
            <HBoxSB style={{width:undefined, paddingRight:10, paddingLeft:10 }}>
                <VBox style={{width:"75%"}}>
                    <HBox style={{ alignItems: "flex-start", width:"100%" }}>
                        <AccessTime style={{ color: "#6F9CB6" }} />
                        <Spacer />
                        <Text aria-hidden="true" fontSize="0.7em">{t1 + " - " + t2}</Text>
                    </HBox>
                    <Spacer />
                    <EventProgress progress={0.6} event={props.event} />
                </VBox>
                <HBox>
                    {
                        props.event.audioUrl && <div style={{ height: buttonSize, width: buttonSize, display: "flex" }}>
                            <AudioPlayerRecorder showRecordButton={false} showClearButton={false}
                                showPlayButton={props.event.audioUrl}
                                audioUrl={props.event.audioUrl}
                                buttonSize={buttonSize} />
                        </div>
                    }
                    {!!props.single && <PermIdentity style={{ fontSize: buttonSize }} />}
                </HBox>
            </HBoxSB>
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

    //eventsGapStart = 0;
    const eventsArray: any[][] = [];

    let groupCount = 0;
    let eventGroupIndex = -1;
    for (let i = 0; i < layouted.length; i++) {
        const ev = layouted[i];

        if (groupCount === 0) {
            //Previous group finished

            eventGroupIndex++;
            //look ahead to group all events in same time slot
            for (let j = i + 1; j < layouted.length; j++) {
                if (layouted[j].start < ev.end) {
                    groupCount++;
                } else {
                    break;
                }
            }
        } else {
            groupCount--;
        }

        if (eventsArray.length == eventGroupIndex) {
            eventsArray.push([]);
        }
        eventsArray[eventGroupIndex].push(ev);
    }

    //console.log("13:05", time2Text("13:55"));

    return <div dir={"rtl"} style={{
        backgroundColor: "#3962B0",
        fontSize: 24, //default text size for whole page
        color: "#495D68", //default text color
    }}>

        <EventsHeader />
        <EventsMain >
            <EventsNavigation />
            {eventsArray.map((evGroup, i) => (<HBox
                style={{
                    width: "100vw",
                    overflowX: evGroup.length > 1 ? "auto" : "hidden",
                    flexWrap: "nowrap",
                }}
                key={i}>
                {
                    evGroup.map((ev, j, ar) => (<Event key={j} single={ar.length === 1} secondInGroup={j > 0} event={ev} />))
                }
            </HBox>))}
            {eventsArray.length === 0 && <VBoxC style={{height:"50vh"}}>
                <Text textAlign={"center"} fontSize={"2em"}>אין אירועים</Text>
            </VBoxC>}
        </EventsMain>

    </div>
}