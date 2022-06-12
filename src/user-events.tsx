import { Dayjs } from "dayjs";
import { useEffect, useRef, useState, Fragment } from "react";
import * as api from './api'
import { Text, HBox, EventsMain, VBoxC, Spacer } from "./elem";
import { DateFormats, explodeEvents, organizeEventsForDisplay, sortEvents } from "./utils/date";
import { useLocation } from "react-router-dom";
import { UserEventsProps } from "./types";
import EventsHeader from "./events-header";
import EventsNavigation from "./events-navigation";

import "./user-events.css";

import { Design } from "./theme";
import { CircularProgress } from "@material-ui/core";

import dayjs from './localDayJs'
import UserSettings from "./user-settings";
import EventElement from "./event-element";
import { EventsContainer } from "./events-container";

export default function UserEvents({ connected, notify, user,
    notificationOn, onNotificationOnChange, onNotificationToken, onPushNotification }: UserEventsProps) {

    const [events, setEvents] = useState<any[]>([]);
    const [daysOffset, setDaysOffset] = useState(0);
    const [reload, setReload] = useState<number>(0);
    const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<string>("");
    const [showUserSettings, setShowUserSettings] = useState<boolean>(false);
    const [nickName, setNickName] = useState<string>("");
    const [isTV, setIsTV] = useState<boolean>(false);
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
            setIsTV(obj.isTV);
        }
    }, [])

    useEffect(() => {
        let intervalId = setInterval(() => setReload(old => old + 1), 2 * 1000)
        return (() => {
            clearInterval(intervalId)
        })
    }, [])
    const days = [];

    const showingEvents = events.filter(e => e.start >= showDateTime.format(DateFormats.DATE) &&
        e.start < showDateTime.add(1, "day").format(DateFormats.DATE) && !showDateTime.isAfter(e.end));

    days.push({
        caption: "היום",
        events: organizeEventsForDisplay(showingEvents),
    });

    if (isTV) {
        // Also calculate tomorrow and 2 days ahead
        const tomorrow = events.filter(e => e.start >= showDateTime.add(1, "day").format(DateFormats.DATE) &&
            e.start < showDateTime.add(2, "day").format(DateFormats.DATE));

        days.push({
            caption: "מחר",
            events: organizeEventsForDisplay(tomorrow),
        })

        const dayAfterTomorrow = events.filter(e => e.start >= showDateTime.add(2, "day").format(DateFormats.DATE) &&
            e.start < showDateTime.add(3, "day").format(DateFormats.DATE));

        days.push({
            caption: "מחרתיים",
            events: organizeEventsForDisplay(dayAfterTomorrow),
        })
    }

    const columnWidth = 100 / days.length;


    if (showUserSettings) {
        return <UserSettings
            user={user}
            isTV={isTV}
            onDone={(newNick, newIsTV) => {
                setShowUserSettings(false);
                setNickName(newNick);
                setIsTV(newIsTV);
            }}
            notificationOn={notificationOn}
            onNotificationOnChange={onNotificationOnChange}
            onNotificationToken={onNotificationToken}
            onPushNotification={onPushNotification}
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
        <EventsHeader
            centered={isTV}
            height={"12vh"}
            showDateTime={dateTimeNoOffset}
            nickName={nickName}
            onLogoDoubleClicked={() => setShowUserSettings(true)}
            user={user}
        />
        <HBox style={{ backgroundColor: "#0078C3", justifyContent: "space-evenly" }}>
            {days.map((day, dayIndex) =>
                <EventsMain height={"88vh"} width={(columnWidth - 1) + "vw"}
                >
                    {!isTV && <EventsNavigation height={"10vh"} currentNavigation={daysOffset} onNavigate={(offset: number) => setDaysOffset(offset)} />}

                    {isTV && <Text textAlign={"center"} fontSize={30}>{day.caption}</Text>}
                    <EventsContainer
                        vhHeight={78}
                        scrollTop={100}
                        autoScroll={isTV}
                    >
                        {day.events.map((evGroup, i) => (<HBox
                            style={{
                                width: "100%",
                                overflowX: evGroup.length > 1 ? "auto" : "hidden",
                                flexWrap: "nowrap",
                            }}
                            key={evGroup.length > 0 ? evGroup[0].tag : i}
                            itemHeightPixels={evGroup.length > 0 ? Design.multiEventHeight : Design.singleEventHeight}
                        >
                            {
                                evGroup.map((ev, j, ar) => (<EventElement key={ev.tag}
                                    width={columnWidth - 1}
                                    single={ar.length === 1} firstInGroup={j === 0} event={ev} now={showDateTime}
                                    audioRef={audioRef}
                                />))
                            }
                        </HBox>))}
                        {day.events.length === 0 && <VBoxC style={{ height: "50vh" }}>
                            <Text textAlign={"center"} fontSize={"2em"}>{loadingEvents ? "טוען..." : "אין אירועים"}</Text>
                            {loadingEvents && <CircularProgress size={Design.buttonSize} />}

                        </VBoxC>}
                    </EventsContainer>
                </EventsMain>
            )}
        </HBox>
    </div>
}