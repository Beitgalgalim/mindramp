import { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import * as api from './api'
import { Text, HBox, EventsMain, VBoxC } from "./elem";
import { DateFormats, explodeEvents, organizeEventsForDisplay, sortEvents } from "./utils/date";
import { useLocation } from "react-router-dom";
import { MessageInfo, UserEventsProps } from "./types";
import EventsHeader from "./events-header";
import EventsNavigation from "./events-navigation";

import "./user-events.css";

import { Design } from "./theme";
import { CircularProgress } from "@material-ui/core";

import dayjs from './localDayJs'
import UserSettings from "./user-settings";
import EventElement from "./event-element";
import { EventsContainer } from "./events-container";
import Message from "./message";
import { Event } from './event'
import useLocalStorageState from "use-local-storage-state";

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
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    const [notificationsPane, setNotificationsPane] = useState<number>(0);
    const [alerts, setAlerts, alertsMore] = useLocalStorageState<MessageInfo[]>("alerts");
    const [keyEvents, setKeyEvents, keyEventsMore] = useLocalStorageState<Event[]>("keyEvents");

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
                e.tag = e._ref?.id || (""+i);
                return e;
            })
            const sortedEvents = sortEvents(explodeEvents(evtsWithId, 0, 3, startDate));
            setEvents(sortedEvents);

            const keyEvts = sortedEvents.filter(ev => ev.keyEvent);
            setKeyEvents(curr => {
                const newKeyEvents = keyEvts.filter(ke => !curr?.some(c => Event.equals(ke, c)));
                const relevantKeyEvents = curr?.filter(c => keyEvts.some(ke => Event.equals(ke,c ))) || [];
                return [
                    ...(relevantKeyEvents),
                    ...(newKeyEvents.map(ke => ({ ...ke, unread: true } as Event)))
                ];
            })

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
    const showingKeyEvents = showNotifications && notificationsPane == 2;
    const NoEventsMsg = "אין אירועים";

    if (!showNotifications) {
        const showingEvents = events.filter(e => e.start >= showDateTime.format(DateFormats.DATE) &&
            e.start < showDateTime.add(1, "day").format(DateFormats.DATE) && !showDateTime.isAfter(e.end));

        days.push({
            caption: "היום",
            emptyMsg: NoEventsMsg,
            eventGroup: organizeEventsForDisplay(showingEvents),
        });

        if (isTV) {
            // Also calculate tomorrow and 2 days ahead
            const tomorrow = events.filter(e => e.start >= showDateTime.add(1, "day").format(DateFormats.DATE) &&
                e.start < showDateTime.add(2, "day").format(DateFormats.DATE));

            days.push({
                caption: "מחר",
                emptyMsg: NoEventsMsg,
                eventGroup: organizeEventsForDisplay(tomorrow),
            })

            const dayAfterTomorrow = events.filter(e => e.start >= showDateTime.add(2, "day").format(DateFormats.DATE) &&
                e.start < showDateTime.add(3, "day").format(DateFormats.DATE));

            days.push({
                caption: "מחרתיים",
                emptyMsg: NoEventsMsg,
                eventGroup: organizeEventsForDisplay(dayAfterTomorrow),
            })
        }
    } else {
        if (showingKeyEvents) {
            //const showingEvents = events.filter(e => e.keyEvent);

            days.push({
                caption: "אירועים מיוחדים",
                emptyMsg: NoEventsMsg,
                eventGroup: keyEvents ? organizeEventsForDisplay(keyEvents) : [],
            });
        } else if (notificationsPane == 0) {
            days.push({
                caption: "התראות",
                emptyMsg: "אין התראות",
                messages: alerts,
            });
        } else if (notificationsPane == 1) {
            days.push({
                caption: "הודעות",
                emptyMsg: "אין הודעות",
                messages: [],
            });
        }
    }


    const columnWidth = 100 / days.length;
    const newNotificationCount = keyEvents?.reduce((acc, ke)=>ke.unread?acc+1: acc, 0) || 0;


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
            onNotificationClick={() => setShowNotifications(prev => !prev)}
            showingNotifications={showNotifications}
            newNotificationCount={newNotificationCount}
            user={user}
        />

        <HBox style={{ backgroundColor: "#0078C3", justifyContent: "space-evenly" }}>
            {days.map((day, dayIndex) =>
                <EventsMain height={"88vh"} width={(columnWidth - 1) + "vw"}
                >
                    {!isTV && !showNotifications ? <EventsNavigation
                        height={"10vh"}
                        currentNavigation={daysOffset}
                        onNavigate={(offset: number) => setDaysOffset(offset)}
                        buttons={[{ caption: "היום" }, { caption: "מחר" }, { caption: "מחרתיים" }]}
                    /> :
                        showNotifications && <EventsNavigation
                            height={"10vh"}
                            currentNavigation={notificationsPane}
                            onNavigate={(offset: number) => setNotificationsPane(offset)}
                            buttons={[{ caption: "התראות" }, { caption: "הודעות" }, { caption: "אירועים" }]}
                        />}

                    {isTV && <Text textAlign={"center"} fontSize={30}>{day.caption}</Text>}

                    <EventsContainer
                        vhHeight={78}
                        scrollTop={100}
                        autoScroll={isTV}
                    >
                        {day.eventGroup?.map((evGroup, i) =>
                            <HBox
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
                                        showingKeyEvent={showingKeyEvents}
                                        width={columnWidth - 1}
                                        single={ar.length === 1} firstInGroup={j === 0} event={ev} now={showDateTime}
                                        audioRef={audioRef}
                                        onSetRead={showingKeyEvents ?
                                            () => {
                                                setKeyEvents(curr =>
                                                (curr ?
                                                    curr.map(ke => {
                                                        if (Event.equals(ke, ev)) {
                                                            return {...ke, unread:false} as Event;
                                                        }
                                                        return ke
                                                    }) :
                                                    undefined));
                                            }
                                            : undefined}
                                    />))
                                }
                            </HBox>)
                        }
                        {day.messages?.map((msg, i) =>
                            <Message
                                msg={msg}
                                onSetRead={() =>
                                    // setAlerts((curr) => {
                                    //     const newMsg = { title: "הודעה" + (curr ? curr.length + 1 : 1), body: "", unread: true }
                                    //     return curr ? [...curr, newMsg] : [newMsg];
                                    // });
                                    setAlerts((curr) => curr?.map(alert => alert == msg ? { ...msg, unread: false } : alert))
                                }
                            />)
                        }
                        {(!day.messages || day.messages.length === 0) && (!day.eventGroup || day.eventGroup.length == 0) &&
                            <VBoxC style={{ height: "50vh" }}>
                                <Text textAlign={"center"} fontSize={"2em"}>{loadingEvents ? "טוען..." : day.emptyMsg}</Text>
                                {loadingEvents && <CircularProgress size={Design.buttonSize} />}

                            </VBoxC>}
                    </EventsContainer>
                </EventsMain>
            )}
        </HBox>

    </div>
}