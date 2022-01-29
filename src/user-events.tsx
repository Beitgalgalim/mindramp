import dayjs from "dayjs";
import { useEffect, useState } from "react";
import * as api from './api'
import { HourLines, Spacer, HeaderText, VBox, Text } from "./elem";
import { MediaResource } from "./types";
import { DateFormats, getTimes } from "./utils/date";

const startHour = 8;
const endHour = 16
const workingHours = getTimes(startHour, endHour, 60, "HH:mm");
const logo = require("./logo.png");

const headerSize = 60;
const eventsGapTop = 30;
const eventsGapBottom = 20;
const footerSize = 60;
const showDate = dayjs();


function Event(props: any) {
    const borderWidth = 4
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
                {props.event.imageUrl && <img src={props.event.imageUrl} style={{ width: props.width / 3, padding: 10 }} alt="תמונה" />}
                <Text textAlign="center">{props.event.title}</Text>
                <Text textAlign="center">{dayjs(props.event.start).format(DateFormats.TIME) + " - " + dayjs(props.event.end).format(DateFormats.TIME)}</Text>
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

function getTimeOffset(event: any, sliceWidth: number, sliceEachHour: number) {
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

export default function UserEvents(props: any) {
    const { windowSize } = props;

    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        if (!props.connected)
            return;
        api.getEvents().then(evts => setEvents(evts));
    }, [props.connected]);

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
            <div style={{ display:"flex", alignContent:"flex-start",width: "33%" }}>
                <img src={logo} style={{ height: headerSize - 20, }} />
            </div>
            <div style={{ display:"flex", width: "33%" }}>
            <Text color="white" textAlign="center" alignSelf="center" fontSize={20}>בוקר טוב</Text>
            </div>
            <div style={{display:"flex", alignContent:"flex-end", width: "33%" }}>
                <Text color="white" textAlign="left" alignSelf="center" fontSize={20}>{dayjs().format(DateFormats.TIME_AM_PM)}</Text>
            </div>
        </div>

        {/* Grid */}
        <HourLines
            height={eventsHeight}
            sliceWidth={sliceWidth}
            hours={workingHours}
            sliceEachHour={sliceEachHour}
        />

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
                        right={getTimeOffset(group[i], sliceWidth, sliceEachHour) + sliceWidth / 2 + 1}
                        width={getTimeWidth(group[i], sliceWidth, sliceEachHour)}
                        event={group[i]}
                    />
                    );
                }
                return groupEl;
            })}
        </div>

    </div>
}