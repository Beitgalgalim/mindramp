import { Dayjs } from "dayjs";
import { MutableRefObject, useEffect, useRef, useState, Fragment } from "react";
import * as api from './api'
import { VBox, Text, Spacer, HBox, EventsMain, HBoxSB, VBoxC, EventProgress, EventsContainer, Avatar } from "./elem";
import { DateFormats, explodeEvents, sortEvents } from "./utils/date";
import { useLocation } from "react-router-dom";
import { UserEventsProps } from "./types";
import EventsHeader from "./events-header";
import EventsNavigation from "./events-navigation";
import { Event } from './event';

import { AccessTime, Mic } from "@mui/icons-material";
import "./user-events.css";

import { Design } from "./theme";
import { CircularProgress } from "@material-ui/core";

import dayjs from './localDayJs'
import UserSettings from "./user-settings";



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


function EventElement({ event, single, firstInGroup, now, audioRef }:
    {
        event: Event, single: boolean, firstInGroup: boolean, now: Dayjs,
        audioRef: MutableRefObject<HTMLAudioElement>
    }
) {
    const [playProgress, setPlayProgress] = useState(-1);
    const [eventAudioLoading, setEventAudioLoading] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timer>();

    const startTimer = () => {
        // Clear any timers already running
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            if (audioRef?.current?.src === event.audioUrl) {
                const { currentTime, duration } = audioRef.current;
                const prog = Math.floor(currentTime / duration * 100);
                if (prog > 0) {
                    console.log("audio loading off 1", event.title)
                    setEventAudioLoading(false);
                }

                setPlayProgress(prog)
            } else {
                stopTimer();
                setPlayProgress(-1);
            }
        }, 200);
    }

    const stopTimer = () => {
        if (intervalRef.current)
            clearInterval(intervalRef.current);

        setEventAudioLoading(false);
        intervalRef.current = undefined;
    }



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
        return () => {
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
        {/* <Text role="text" fontSize="0.7em">חדר מולטימדיה</Text> */}
    </div>

    if (audioRef?.current?.src !== event.audioUrl && playProgress > 0) {
        setPlayProgress(-1);
    }

    const isSingle = !!single;
    return (
        <div style={{
            flex: "0 0 auto",
            width: (isSingle ? baseWidth : baseWidth * multipleFactor) - 48,
            height: isSingle ? 150 : 205,
            background: playProgress >= 0 ?
                `linear-gradient(to left,#D1DADD ${playProgress}%, white ${playProgress}% 100%)` :
                "white",
            borderRadius: 10,
            marginRight: firstInGroup ? 24 : 0,
            marginLeft: 24,
            marginBottom: 30,
            marginTop: 1,
            boxShadow: Design.boxShadow,
        }}
            onClick={() => {
                // plays the audio if exists
                if (event.audioUrl && event.audioUrl !== "" && audioRef.current) {
                    // console.log(e.detail)
                    if (audioRef.current.src === event.audioUrl) {
                        // avoid multiple clicks
                        if (eventAudioLoading) {
                            console.log("audio is still loading - ignore click")
                            return;
                        }

                        if (audioRef.current.paused) {
                            audioRef.current.play().then(() => startTimer());
                        } else {
                            audioRef.current.pause();
                            stopTimer();
                            setEventAudioLoading(false);
                            console.log("audio loading off 2")
                        }

                        return;
                    }

                    setEventAudioLoading(true);
                    console.log("audio start loading")
                    audioRef.current.src = event.audioUrl;
                    audioRef.current.onended = () => {
                        stopTimer();
                        console.log("ended")
                        setEventAudioLoading(false);
                        setPlayProgress(-1);
                    }
                    audioRef.current.play().then(() => startTimer());
                }
            }}

        >

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
                        <img src={event.imageUrl} style={{ maxWidth: Design.eventImageSize, maxHeight: Design.eventImageSize }} alt="תמונה" />
                    </div>
                }
                {!isSingle && event.guideUrl && <Avatar size={buttonSize} imageSrc={event.guideUrl} />}
                {/* {<Spacer height={buttonSize} />} */}
                {isSingle && titleAndRoom}
            </div>
            <Spacer height={5} />
            {!isSingle && titleAndRoom}
            {!isSingle && <Spacer height={25} />}
            <HBoxSB style={{ width: undefined, paddingRight: 10 }}>
                <VBox style={{ width: "75%" }}>
                    <HBox style={{ alignItems: "center", width: "100%" }}>
                        <AccessTime style={{ color: "#6F9CB6" }} />
                        <Spacer />
                        <Text aria-hidden="true" fontSize="0.7em">{t1 + " - " + t2}</Text>
                    </HBox>
                    <Spacer />
                    {eventProgress >= 0 && <EventProgress progress={eventProgress} event={event} />}
                </VBox>
                <HBox>
                    {eventAudioLoading && <CircularProgress size={buttonSize} />}
                    {
                        event.audioUrl && <div style={{ height: buttonSize, minWidth: buttonSize, display: "flex", justifyContent: "flex-end" }}>
                            <Mic style={{ fontSize: buttonSize }} />
                        </div>
                    }
                    {isSingle && event.guideUrl ? <Avatar size={buttonSize} imageSrc={event.guideUrl} /> : isSingle && <Spacer width={buttonSize} />}
                    {<Spacer height={buttonSize} />}
                </HBox>
            </HBoxSB>

            {
                minutesBefore > 0 && minutesBefore < 120 && <div style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    bottom: 5,
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

export default function UserEvents({ windowSize, connected, notify, user, 
    notificationOn, onNotificationOnChange, onNotificationToken }: UserEventsProps) {

    const [events, setEvents] = useState<any[]>([]);
    const [daysOffset, setDaysOffset] = useState(0);
    const [reload, setReload] = useState<number>(0);
    const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<string>("");
    const [showUserSettings, setShowUserSettings] = useState<boolean>(false);
    const [nickName, setNickName] = useState<string>("");

    const audioRef = useRef<HTMLAudioElement>(new Audio());

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

    if (startDate !== dateTimeNoOffset.format(DateFormats.DATE)) {
        setStartDate(dateTimeNoOffset.format(DateFormats.DATE))
    }

    useEffect(() => {
        if (!connected || startDate === "")
            return;
        setLoadingEvents(true);
        api.getEvents().then(evts => {
            const evtsWithId = evts.map((e, i) => {
                e.tag = "" + i
                return e;
            })
            setEvents(sortEvents(explodeEvents(evtsWithId, 0, 3, startDate)));
        }).finally(() => setLoadingEvents(false));
    }, [connected, startDate]);

    useEffect(() => {
        // Init personalized name on mount
        const savedState = localStorage.getItem("state");
        if (savedState && savedState.length > 0) {
            const obj = JSON.parse(savedState)
            setNickName(obj.name);
        }
    }, [])

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

    if (showUserSettings) {
        return <UserSettings user={user} onDone={(newNick) => {
            setShowUserSettings(false);
            setNickName(newNick);

        }}
            notificationOn={notificationOn}
            onNotificationOnChange={onNotificationOnChange}
            onNotificationToken={onNotificationToken}
            notify={notify} nickName={nickName} />
    }


    return <div dir={"rtl"} style={{
        backgroundColor: "#0078C3",
        fontSize: 24, //default text size 
        fontFamily: "Assistant",
        fontWeight: 700,
        color: "#495D68", //default text color
        height: "100vh",

    }}
    >


        <EventsHeader height={"12vh"} showDateTime={dateTimeNoOffset} nickName={nickName} 
            onLogoDoubleClicked={() => setShowUserSettings(true)}
            user={user}
        />
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
                        />))
                    }
                </HBox>))}
                {eventsArray.length === 0 && <VBoxC style={{ height: "50vh" }}>
                    <Text textAlign={"center"} fontSize={"2em"}>{loadingEvents ? "טוען..." : "אין אירועים"}</Text>
                    {loadingEvents && <CircularProgress size={buttonSize} />}

                </VBoxC>}
            </EventsContainer>
        </EventsMain>
    </div>
}