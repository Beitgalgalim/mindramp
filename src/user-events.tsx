import { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import * as api from './api'
import { Text, HBox, EventsMain, VBoxC } from "./elem";
import { DateFormats, explodeEvents, organizeEventsForDisplay, sortEvents, toMidNight } from "./utils/date";
import { useLocation, useSearchParams } from "react-router-dom";
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


function syncLocalStorage(setFunction: any, equalsFunction: any, srcList: any[]) {
    setFunction((curr: any[]) => {
        const newItems = srcList.filter(srcItem => !curr?.some(c => Event.equals(srcItem, c)));
        const relevantExistingItems = curr?.filter(c => srcList.some(srcItem => Event.equals(srcItem, c))) || [];
        return [
            ...(relevantExistingItems),
            ...(newItems.map(srcItem => ({ ...srcItem, unread: true })))
        ];
    })
}

function messageEquals(msg1: MessageInfo, msg2: MessageInfo): boolean {
    return msg1.title === msg2.title && msg1.body === msg2.body;
}


export default function UserEvents({ connected, notify, user,
    notificationOn, onNotificationOnChange, onNotificationToken,
    onPushNotification }: UserEventsProps) {

    const [events, setEvents] = useState<any[]>([]);
    const [daysOffset, setDaysOffset] = useState(0);
    const [reload, setReload] = useState<number>(0);
    const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<string>("");
    const [showUserSettings, setShowUserSettings] = useState<boolean>(false);
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    const [notificationsPane, setNotificationsPane] = useState<number>(0);
    const [keyEvents, setKeyEvents, keyEventsMore] = useLocalStorageState<Event[]>("keyEvents");
    const [messages, setMessages] = useLocalStorageState<MessageInfo[]>("Messages");
    const [nickName, setNickName, nickNamesMore] = useLocalStorageState<any>("state");

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

    const [searchParams] = useSearchParams();
    const isTV = searchParams.get("isTv") === "true";

    useEffect(() => {
        if (!connected || startDate === "")
            return;
        setLoadingEvents(true);
        api.getPersonalizedEvents(user || "").then(evts => {
            const evtsWithId = evts.map((e, i) => {
                e.tag = e._ref?.id || ("" + i);
                return e;
            })
            const sortedEvents = sortEvents(explodeEvents(evtsWithId, 0, 3, startDate));

            const keyEvts = sortedEvents.filter(ev => ev.keyEvent).filter(ev=>ev.end > dateTimeNoOffset.format(DateFormats.DATE_TIME));
            const tomorrow = toMidNight(dateTimeNoOffset.add(1, "days")).format(DateFormats.DATE_TIME);
            const today = toMidNight(dateTimeNoOffset).format(DateFormats.DATE_TIME);
            const msgs = sortedEvents.filter(ev => ev.allDay).filter(ev=>ev.start <= today && ev.end >= tomorrow);

            setEvents(sortedEvents.filter(ev => !ev.allDay));

            syncLocalStorage(setKeyEvents, Event.equals, keyEvts);
            syncLocalStorage(setMessages, messageEquals, msgs.map(m => ({
                title: m.title,
                body: m.notes
            })));

        }).finally(() => setLoadingEvents(false));
    }, [user, connected, startDate]);

    useEffect(() => {
        let intervalId = setInterval(() => setReload(old => old + 1), 2 * 1000)
        return (() => {
            clearInterval(intervalId)
        })
    }, [])
    const days = [];
    const showingKeyEvents = showNotifications && notificationsPane == 1;
    const NoEventsMsg = "?????? ??????????????";

    if (!showNotifications) {
        const showingEvents = events.filter(e => e.start >= showDateTime.format(DateFormats.DATE) &&
            e.start < showDateTime.add(1, "day").format(DateFormats.DATE) && !showDateTime.isAfter(e.end));

        days.push({
            caption: "????????",
            emptyMsg: NoEventsMsg,
            eventGroup: organizeEventsForDisplay(showingEvents),
        });

        if (isTV) {
            // Also calculate tomorrow and 2 days ahead
            const tomorrow = events.filter(e => e.start >= showDateTime.add(1, "day").format(DateFormats.DATE) &&
                e.start < showDateTime.add(2, "day").format(DateFormats.DATE));

            days.push({
                caption: "??????",
                emptyMsg: NoEventsMsg,
                eventGroup: organizeEventsForDisplay(tomorrow),
            })

            const dayAfterTomorrow = events.filter(e => e.start >= showDateTime.add(2, "day").format(DateFormats.DATE) &&
                e.start < showDateTime.add(3, "day").format(DateFormats.DATE));

            days.push({
                caption: "??????????????",
                emptyMsg: NoEventsMsg,
                eventGroup: organizeEventsForDisplay(dayAfterTomorrow),
            })
        }
    } else {
        if (showingKeyEvents) {
            //const showingEvents = events.filter(e => e.keyEvent);

            days.push({
                caption: "?????????????? ??????????????",
                emptyMsg: NoEventsMsg,
                eventGroup: keyEvents ? organizeEventsForDisplay(keyEvents) : [],
            });
        } else if (notificationsPane == 0) {
            days.push({
                caption: "????????????",
                emptyMsg: "?????? ????????????",
                messages: messages,
            });
        }
    }


    const columnWidth = 100 / days.length;
    const newKeyEventsCount = keyEvents?.reduce((acc, ke) => ke.unread ? acc + 1 : acc, 0) || 0;
    const newMessagesCount = messages?.reduce((acc, ke) => ke.unread ? acc + 1 : acc, 0) || 0;

    const newNotificationCount = newKeyEventsCount + newMessagesCount;

    if (showUserSettings) {
        return <UserSettings
            user={user}
            onSaveNickName={(newNick) => {
                setNickName({ name: newNick });
            }}
            onClose={() => setShowUserSettings(false)}
            notificationOn={notificationOn}
            onNotificationOnChange={onNotificationOnChange}
            onNotificationToken={onNotificationToken}
            onPushNotification={onPushNotification}
            notify={notify} nickName={nickName?.name} />
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
            nickName={nickName?.name}
            onLogoDoubleClicked={() => setShowUserSettings(true)}
            notificationOn={notificationOn}
            onNotificationClick={() => setShowNotifications(prev => !prev)}
            showingNotifications={showNotifications}
            newNotificationCount={newNotificationCount}
            user={user}
        />

        <HBox style={{ backgroundColor: "#0078C3", justifyContent: "space-evenly" }}>
            {days.map((day, dayIndex) =>
                <EventsMain key={dayIndex} height={"88vh"} width={(columnWidth - 1) + "vw"}
                >
                    {!isTV && !showNotifications ? <EventsNavigation
                        height={"10vh"}
                        currentNavigation={daysOffset}
                        onNavigate={(offset: number) => setDaysOffset(offset)}
                        buttons={[{ caption: "????????" }, { caption: "??????" }, { caption: "??????????????" }]}
                    /> :
                        showNotifications && <EventsNavigation
                            height={"10vh"}
                            currentNavigation={notificationsPane}
                            onNavigate={(offset: number) => setNotificationsPane(offset)}
                            buttons={[{ caption: "????????????", badge: newMessagesCount }, { caption: "??????????????", badge: newKeyEventsCount }]}
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
                                                            return { ...ke, unread: false } as Event;
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
                                onSetRead={
                                    () => setMessages(curr =>
                                    (curr ?
                                        curr.map(m => {
                                            if (messageEquals(m, msg)) {
                                                return { ...m, unread: false } as MessageInfo;
                                            }
                                            return m
                                        }) :
                                        undefined))
                                }
                            />)
                        }
                        {(!day.messages || day.messages.length === 0) && (!day.eventGroup || day.eventGroup.length == 0) &&
                            <VBoxC style={{ height: "50vh" }}>
                                <Text textAlign={"center"} fontSize={"2em"}>{loadingEvents ? "????????..." : day.emptyMsg}</Text>
                                {loadingEvents && <CircularProgress size={Design.buttonSize} />}

                            </VBoxC>}
                    </EventsContainer>
                </EventsMain>
            )}
        </HBox>

    </div>
}