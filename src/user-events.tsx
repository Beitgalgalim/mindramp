import dayjs, { Dayjs } from "dayjs";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import * as api from './api'
import { VBox, Text, Spacer, HBox, EventsMain, HBoxSB, VBoxC, EventProgress, EventsContainer } from "./elem";
import { DateFormats, explodeEvents, sortEvents } from "./utils/date";
import { useLocation } from "react-router-dom";
import { UserEventsProps } from "./types";
import EventsHeader from "./events-header";
import EventsNavigation from "./events-navigation";
import { Event } from './event';

import { AccessTime, Mic, PermIdentity } from "@mui/icons-material";

const multipleFactor = .7;
const buttonSize = 50;

function isBetween(num: number, from: number, to: number) {
    return num >= from && num <= to;
}

function getBeforeTimeText(minutes: number): string {
    if (minutes <= 0)
        return ""

    if (isBetween(minutes, 0, 10)) {
        return "עוד כמה דקות";
    }

    if (isBetween(minutes, 10, 15)) {
        return "עוד רבע שעה";
    }

    if (isBetween(minutes, 15, 23)) {
        return "עוד 20 דקות";
    }
    if (isBetween(minutes, 23, 37)) {
        return "עוד חצי שעה";
    }
    if (isBetween(minutes, 37, 51)) {
        return "עוד שלושת רבעי שעה";
    }
    if (isBetween(minutes, 51, 75)) {
        return "עוד שעה";
    }
    if (isBetween(minutes, 75, 100)) {
        return "עוד שעה וחצי";
    }
    if (isBetween(minutes, 100, 130)) {
        return "עוד שעתיים";
    }

    return "עוד מעל שעתיים";
}


function EventElement({ event, single, firstInGroup, now, audioRef, startTimer, stopTimer }:
    {
        event: Event, single: boolean, firstInGroup: boolean, now: Dayjs,
        audioRef: MutableRefObject<HTMLAudioElement>,
        startTimer: (callback: () => void, delay: number) => void,
        stopTimer: () => void,
    }
) {
    const [playProgress, setPlayProgress] = useState(-1);
    const t1 = dayjs(event.start).format(DateFormats.TIME)
    const t2 = dayjs(event.end).format(DateFormats.TIME)

    const eventProgress = Math.abs(now.diff(event.start, "minutes")) <= 1 ? 0 :
        now.isAfter(event.start) && now.isBefore(event.end) ?
            now.diff(event.start, "seconds") / dayjs(event.end).diff(event.start, "seconds") :
            -1;

    const minutesBefore = now.isBefore(event.start) ? -now.diff(event.start, "minutes") : 0;

    const baseWidth = window.innerWidth;

    useEffect(() => {
        console.log(event.title, "mounted")
        return ()=> {
            console.log(event.title, "unmounted")
            audioRef.current.src = ""
        }
    }, [])

    const titleAndRoom = <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: "flex-start",
        paddingRight: 15,
    }} >
        <Text role="text">{event.title}</Text>
        <Spacer height={2} />
        <Text role="text" fontSize="0.7em">חדר מולטימדיה</Text>
    </div>

    const isSingle = !!single;
    return (
        <div style={{
            flex: "0 0 auto",
            width: (isSingle ? baseWidth : baseWidth * multipleFactor) - 48,
            height: isSingle ? 150 : 230,
            background: playProgress >= 0 ?
                `linear-gradient(to left,#D1DADD ${playProgress}%, white ${playProgress}% 100%)` :
                "white",
            borderRadius: 10,
            marginRight: firstInGroup ? 24 : 0,
            marginLeft: 24,
            marginBottom: 30,
            marginTop: 1,
            boxShadow: "0px 18px 22px rgba(44, 85, 102, 0.12)", //rgb(46 66 77 / 15%)"
        }}
            onClick={(e: any) => {
                const timerHandler = () => {
                    const { currentTime, duration } = audioRef.current;
                    const prog = Math.floor(currentTime / duration * 100);
                    setPlayProgress(prog)
                }

                // plays the audio if exists
                if (event.audioUrl && event.audioUrl !== "" && audioRef.current) {
                    console.log(e.detail)
                    if (!audioRef.current.paused) {
                        audioRef.current.pause();
                        stopTimer();
                        return;
                    } else if (audioRef.current.currentTime > 0) {
                        audioRef.current.play()
                        startTimer(timerHandler, 200)
                        return;
                    }

                    audioRef.current.src = event.audioUrl;
                    audioRef.current.onended = () => {
                        stopTimer();
                        console.log("ended")
                        setPlayProgress(-1);
                    }
                    audioRef.current.play();
                    startTimer(timerHandler, 200);
                }
            }}

        >
            {/* {playProgress > -1 && <div style={{
                backgroundColor: 'green',
                float:"right",
                position:"relative",
                left:0,
                height:"100%",
                width: playProgress*100 + "%"
            }} />} */}


            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: "flex-start",
                height: 78,
                paddingTop: 10,
                paddingRight: 10,
                paddingLeft: 10,
                justifyContent: isSingle ? "flex-start" : event.imageUrl ? "space-between" : "flex-end",
            }}>
                {
                    event.imageUrl && <div style={{ width: 78 }}>
                        <img src={event.imageUrl} style={{ maxWidth: 78, maxHeight: 78 }} alt="תמונה" />
                    </div>
                }
                {!isSingle && <PermIdentity style={{ fontSize: buttonSize }} />}
                {isSingle && titleAndRoom}
            </div>
            <Spacer height={5} />
            {!isSingle && titleAndRoom}
            {!isSingle && <Spacer height={25} />}
            <HBoxSB style={{ width: undefined, paddingRight: 10, paddingLeft: 10 }}>
                <VBox style={{ width: "75%" }}>
                    <HBox style={{ alignItems: "flex-start", width: "100%" }}>
                        <AccessTime style={{ color: "#6F9CB6" }} />
                        <Spacer />
                        <Text aria-hidden="true" fontSize="0.7em">{t1 + " - " + t2}</Text>
                    </HBox>
                    <Spacer />
                    {eventProgress >= 0 && <EventProgress progress={eventProgress} event={event} />}
                </VBox>
                <HBox>
                    {
                        event.audioUrl && <div style={{ height: buttonSize, width: buttonSize, display: "flex" }}>
                            {/* <AudioPlayerRecorder showRecordButton={false} showClearButton={false}
                                showPlayButton={event.audioUrl !== ""}
                                audioUrl={event.audioUrl}
                                buttonSize={buttonSize - 5} 
                                onPlayProgress={()=>{}}
                                /> */}
                            <Mic style={{ fontSize: buttonSize }} />
                        </div>
                    }
                    {isSingle && <PermIdentity style={{ fontSize: buttonSize }} />}
                </HBox>
            </HBoxSB>

            {
                minutesBefore > 0 && minutesBefore < 120 && <div style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    bottom: 0,
                    right: 10,
                    height: 25,
                    width: "fit-content",
                    backgroundColor: "#C4C4C4",
                    fontSize: "0.7em",
                    borderRadius: 5,
                    paddingLeft: 10,
                    paddingRight: 10,
                }}>
                    <Text>{getBeforeTimeText(minutesBefore)}</Text>
                </div>
            }
        </div >
    );
}

export default function UserEvents({ windowSize, connected }: UserEventsProps) {

    const [events, setEvents] = useState<any[]>([]);
    const [daysOffset, setDaysOffset] = useState(0);
    const [reload, setReload] = useState<number>(0);
    const [startDate, setStartDate] = useState<string>("");

    const audioRef = useRef<HTMLAudioElement>(new Audio());
    const intervalRef = useRef<NodeJS.Timer>();

    const startTimer = (callback: () => void, delay: number) => {
        // Clear any timers already running
        if (intervalRef.current)
            clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            callback()
        }, delay);
    }

    const stopTimer = () => {
        if (intervalRef.current)
            clearInterval(intervalRef.current);
        intervalRef.current = undefined;
    }

    const location = useLocation();
    let showDateTime: Dayjs;

    let showDateHash = decodeURIComponent(location.hash && location.hash.substr(1));
    if (showDateHash && dayjs(showDateHash).isValid()) {
        showDateTime = dayjs(showDateHash);
    } else {
        showDateTime = dayjs();
    }

    const dateTimeNoOffset = showDateTime;
    if (daysOffset > 0) {
        showDateTime = dayjs(showDateTime.add(daysOffset, "days").format(DateFormats.DATE) + " 00:00");
    }

    if (startDate !== showDateTime.format(DateFormats.DATE)) {
        setStartDate(showDateTime.format(DateFormats.DATE))
    }

    useEffect(() => {
        if (!connected || startDate === "")
            return;

        api.getEvents().then(evts => {
            const evtsWithId = evts.map((e, i) => {
                e.tag = "" + i
                return e;
            })
            setEvents(sortEvents(explodeEvents(evtsWithId, 0, 3, startDate)));
        })
    }, [connected, startDate]);


    useEffect(() => {
        let intervalId = setInterval(() => setReload(old => old + 1), 2 * 1000)
        return (() => {
            clearInterval(intervalId)
        })
    }, [])


    const showingEvents = events.filter(e => e.start >= showDateTime.format(DateFormats.DATE) &&
        e.start < showDateTime.add(1, "day").format(DateFormats.DATE));

    const eventsArray: any[][] = [];

    let groupCount = 0;
    let eventGroupIndex = -1;
    for (let i = 0; i < showingEvents.length; i++) {
        const ev = showingEvents[i];

        // check if event is in the past
        if (showDateTime.isAfter(ev.end)) {
            continue;
        }

        if (groupCount === 0) {
            //Previous group finished

            eventGroupIndex++;
            //look ahead to group all events in same time slot
            for (let j = i + 1; j < showingEvents.length; j++) {
                if (showingEvents[j].start === ev.start) {
                    groupCount++;
                } else {
                    break;
                }
            }
        } else {
            groupCount--;
        }

        if (eventsArray.length === eventGroupIndex) {
            eventsArray.push([]);
        }
        eventsArray[eventGroupIndex].push(ev);
    }


    return <div dir={"rtl"} style={{
        backgroundColor: "#0078C3",
        fontSize: 24, //default text size 
        color: "#495D68", //default text color
        height: "100vh",

    }}
    >

        <EventsHeader height={"12vh"} showDateTime={dateTimeNoOffset}/>
        <EventsMain height={"88vh"}>
            <EventsNavigation height={"10vh"} currentNavigation={daysOffset} onNavigate={(offset: number) => setDaysOffset(offset)} />
            <EventsContainer height={"78vh"}>
                {eventsArray.map((evGroup, i) => (<HBox
                    style={{
                        width: "100vw",
                        overflowX: evGroup.length > 1 ? "auto" : "hidden",
                        flexWrap: "nowrap",
                    }}
                    key={evGroup.length > 0 ? evGroup[0].tag : i}>
                    {
                        evGroup.map((ev, j, ar) => (<EventElement key={ev.tag}
                            single={ar.length === 1} firstInGroup={j === 0} event={ev} now={showDateTime}
                            audioRef={audioRef}
                            startTimer={startTimer}
                            stopTimer={stopTimer}
                        />))
                    }
                </HBox>))}
                {eventsArray.length === 0 && <VBoxC style={{ height: "50vh" }}>
                    <Text textAlign={"center"} fontSize={"2em"}>אין אירועים</Text>
                </VBoxC>}
            </EventsContainer>
        </EventsMain>

    </div>
}