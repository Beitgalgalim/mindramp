import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState, useRef } from "react";
import * as api from './api'
import { HourLines, VBox, Text, Spacer, ComboBox } from "./elem";
import { DateFormats, day2DayName, getDayDesc, getTimes, MonthMap2 } from "./utils/date";
import { useLocation, useNavigate } from "react-router-dom";

const logo = require("./logo.png");

const headerSize = 60;
const eventsGapTop = 30;
const eventsGapBottom = 20;
const footerSize = 60;

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
        }}>
            <VBox>
                {props.event.imageUrl && <img src={props.event.imageUrl} style={{ maxWidth: props.width / 1.5, maxHeight: props.height / 2.5, padding: 10 }} alt="תמונה" />}
                <Text textAlign="center" fontSize={font1}>{props.event.title}</Text>
                <Text textAlign="center" fontSize={font2}>{dayjs(props.event.start).format(DateFormats.TIME) + " - " + dayjs(props.event.end).format(DateFormats.TIME)}</Text>
                <Spacer height={25} />
                <Text textAlign="center" fontSize={font3}>{props.event.notes || ""}</Text>

            </VBox>

        </div>
    );
}

function organizeEvents(events: any[]): any[][] {
    const eventsArray: any[][] = [];
    let eventsGroup = [];
    for (let i = 0; i < events.length; i++) {
        if (eventsGroup.length === 0) {
            eventsGroup.push(events[i]);
            eventsArray.push(eventsGroup);
            continue;
        }

        //look for more events in this time window
        if (events[i].start < eventsGroup[0].end) {
            eventsGroup.push(events[i]);
        } else {
            // close the group
            eventsGroup = [events[i]];
            eventsArray.push(eventsGroup);
        }
    }

    return eventsArray;
}

function getTimeOffset(event: any, showDate: Dayjs, startHour: number, sliceWidth: number, sliceEachHour: number) {
    // calculate the time from startHour to start:
    const startHourD = dayjs(showDate.format(DateFormats.DATE)).add(startHour, "hours");
    const diffMin = - startHourD.diff(event.start, "minutes");
    const minPerSlice = 60 / sliceEachHour;
    return (diffMin / minPerSlice) * sliceWidth;
}

function getTimeWidth(event: any, showDate: Dayjs, sliceWidth: number, sliceEachHour: number) {
    const start = dayjs(event.start);
    const diffMin = - start.diff(event.end, "minutes");
    const minPerSlice = 60 / sliceEachHour;
    return (diffMin / minPerSlice) * sliceWidth;
}

function getDebugNow(date: Dayjs) {
    return dayjs(date.format(DateFormats.DATE) + " " + dayjs().format(DateFormats.TIME));
}

export default function UserEvents(props: any) {
    const { windowSize } = props;

    const [events, setEvents] = useState<any[]>([]);
    const [now, setNow] = useState<Dayjs>(getDebugNow(dayjs()));
    const [profile, setProfile] = useState<number>(0);
    const [startHour, setStartHour] = useState<number>(8);
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
        if (!props.connected)
            return;
        api.getEvents().then(evts => setEvents(evts));
    }, [props.connected]);

    useEffect(() => {
        let intervalId = setInterval(updateNow, 2 * 1000)
        return (() => {
            clearInterval(intervalId)
        })
    }, [])

    const updateNow = () => {
        // For debugging, the Now is the time of the displayed day (and not the current date)
        setNow(getDebugNow(showDate));
        //setNow(dayjs());
    }

    //updateNow()


    const goBack = () => {
        navigate("#" + showDate.add(-1, "day").format(DateFormats.DATE))
        //        setShowDate(sd=>sd.add(-1, "day"));
    }
    const goForward = () => {
        navigate("#" + showDate.add(1, "day").format(DateFormats.DATE))
        //      setShowDate(sd=>sd.add(1, "day"));
    }



    const sliceEachHour = 2;
    const sliceWidth = windowSize.w / (workingHours.length * sliceEachHour);
    const eventsHeight = windowSize.h - headerSize - footerSize;

    const showingEvents = events.filter(e => e.start >= showDate.format(DateFormats.DATE) &&
        e.start < showDate.add(1, "day").format(DateFormats.DATE));

    const organizedEvents = organizeEvents(showingEvents);

    return <div dir="rtl" style={{ backgroundColor: "black", height: "100vh" }}>
        {/* Toolbar */}
        <div style={{
            display: "flex", flexDirection: "row",
            height: headerSize, width: "100%",
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
            height={eventsHeight}
            sliceWidth={sliceWidth}
            hours={workingHours}
            sliceEachHour={sliceEachHour}
        />

        {/*Footer */}
        <div style={{
            display: "flex", flexDirection: "row",
            height: headerSize, width: "100%",
            alignContent: "center"
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
            position: "absolute", right: 0, top: headerSize, width: windowSize.w,
            backgroundColor: "green"
        }} >
            {organizedEvents.map((group, g) => {
                const groupEl = [];
                for (let i = 0; i < group.length; i++) {


                    groupEl.push(<Event
                        key={g * 100 + i}
                        top={(eventsHeight - eventsGapTop - eventsGapBottom) / group.length * i + eventsGapTop}
                        height={(eventsHeight - eventsGapTop - eventsGapBottom) / group.length}
                        right={getTimeOffset(group[i], showDate, startHour, sliceWidth, sliceEachHour) + sliceWidth / 2 + 1}
                        width={getTimeWidth(group[i], showDate, sliceWidth, sliceEachHour)}
                        event={group[i]}
                        sliceWidth={sliceWidth}
                    />
                    );
                }
                return groupEl;
            })}
        </div>

        {/*Now line */}
        <div dir="rtl" style={{
            position: "absolute",
            right: getTimeOffset({ start: now }, showDate, startHour, sliceWidth, sliceEachHour) + sliceWidth / 2 + 1,
            top: headerSize,
            width: 5,
            border: 0,
            borderLeft: 5,
            height: eventsHeight,
            borderStyle: "solid",
            borderColor: "white",
            zIndex: 1500,
            opacity: 0.7,
        }} />
    </div>
}