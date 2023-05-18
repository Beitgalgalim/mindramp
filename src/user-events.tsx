import { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import * as api from './api'
import { DateFormats, explodeEvents, sortEvents, toMidNight } from "./utils/date";
import { useLocation, useSearchParams } from "react-router-dom";
import { AccessibilitySettingsData, EventFilter, LocationInfo, MediaResource, MessageInfo, Roles, UserEventsProps, UserInfo } from "./types";
import EventsHeader from "./events-header";
import Events from './events';


import "./css/user-events.css";
import dayjs from './localDayJs'
import UserSettings from "./user-settings";
import { Event } from './event'
import useLocalStorageState from "use-local-storage-state";
import AccessibilitySettings from "./accessibility-settings";
import { beep, hasRole } from "./utils/common";
import { AccessibleView } from "./accessible-day-view";
import Users from "./users";
import Media from "./media";
import NotificationView from "./notification-view";

import { ReactComponent as CalBtn } from './icons/cal2.svg'
import { ReactComponent as UsersBtn } from './icons/users.svg'
import { ReactComponent as MediaBtn } from './icons/media.svg'
import SideMenu from "./side-menu";
import Login from "./login";
import { User } from "@firebase/auth";


const AdminBtn = ({
    selected,
    onPress,
    caption,
    style,
    icon }: any) => (<div
        className={"admin-pane-btn " + (selected ? " selected" : "")}
        style={style}
        onClick={() => onPress()} >
        {icon}
        <text>{caption}</text>
    </div>);

function syncLocalStorage(setFunction: any, equalsFunction: any, srcList: any[]) {
    setFunction((curr: any[]) => {
        const newItems = srcList.filter(srcItem => !curr?.some(c => equalsFunction(srcItem, c)));
        const relevantExistingItems = curr?.filter(c => srcList.some(srcItem => equalsFunction(srcItem, c))) || [];
        return [
            ...(relevantExistingItems),
            ...(newItems.map(srcItem => ({ ...srcItem, unread: true })))
        ];
    })
}

function messageEquals(msg1: MessageInfo, msg2: MessageInfo): boolean {
    return msg1.title === msg2.title && msg1.body === msg2.body;
}


export default function UserEvents({ connected, notify, user, roles, isGuide, kioskMode, avatarUrl,
    notificationOn, onNotificationOnChange, onNotificationToken,
    onPushNotification, onGoHome, nickName, onNickNameUpdate }: UserEventsProps) {
    const [rawEvents, setRawEvents] = useState<any[]>([]);
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [events, setEvents] = useState<any[]>([]);
    const [etag, setEtag] = useState<string | undefined>();
    const [reload, setReload] = useState<number>(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [refresh, setRefresh] = useState<number>(0);
    const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
    const [initialized, setInitialized] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<string>("");
    const [showUserSettings, setShowUserSettings] = useState<boolean>(false);
    const [showLogin, setShowLogin] = useState<boolean>(false);
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [keyEvents, setKeyEvents, keyEventsMore] = useLocalStorageState<Event[]>("keyEvents");
    const [messages, setMessages] = useLocalStorageState<MessageInfo[]>("Messages");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [beta, setBeta, betaMore] = useLocalStorageState<any>("beta");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [accSettings, setAccSettings, accSettingsMore] = useLocalStorageState<AccessibilitySettingsData>("accessibilitySettings");
    const [showAccessibilitySettings, setShowAccessibilitySettings] = useState<boolean>(false);
    const [daysOffset, setDaysOffset] = useState<number>(0);
    const [manageUsers, setManageUsers] = useState(false);
    const [manageMedia, setManageMedia] = useState(false);
    const [filter, setFilter] = useLocalStorageState<EventFilter>("eventsFilter", {
        defaultValue: {
            users: [],
            publicEvents: true,
            allPrivateEvents: true,
        }
    });
    const [accessibleCalendar, setAccessibleCalendar] = useLocalStorageState<boolean | undefined>("accessibleCalendar", { defaultValue: undefined });

    const [media, setMedia] = useState<MediaResource[]>([]);
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [locations, setLocations] = useState<LocationInfo[]>([]);

    const [reloadMedia, setReloadMedia] = useState<number>(0);
    const [reloadUsers, setReloadUsers] = useState<number>(0);


    const audioRef = useRef<HTMLAudioElement>(new Audio());
    const firstElemRef = useRef<HTMLButtonElement>(null);

    const location = useLocation();
    let refDate: Dayjs = dayjs();

    let showDateHash = decodeURIComponent(location.hash && location.hash.substr(1));
    // #2022-11-11 20:00
    if (showDateHash && showDateHash.length > 15 && dayjs(showDateHash).isValid()) {
        refDate = dayjs(showDateHash);
    }

    if (startDate !== refDate.format(DateFormats.DATE)) {
        setStartDate(refDate.format(DateFormats.DATE))
    }

    const [searchParams] = useSearchParams();
    const isTV = searchParams.get("isTv") === "true";
    isTV && console.log("TV mode")
    const accessibleCalendarAct = isTV || accessibleCalendar || !roles.length || (roles.length === 1 && roles[0].id === Roles.Kiosk);

    useEffect(() => {
        setEtag(undefined);
        setReload(old => old + 1);
    }, [user]);

    useEffect(() => {
        if (!connected || startDate === "")
            return;
        setLoadingEvents(true);
        console.log("reloading...")
        api.getPersonalizedEvents(user ? user : undefined, etag).then(eventsResponse => {
            setInitialized(true);
            if (eventsResponse.noChange) return;

            setEtag(eventsResponse.eTag);
            const evtsWithId = eventsResponse.events.map((e: any) => ({
                ...e.event, id: e.id, tag: e.id
            }));
            setRawEvents(evtsWithId);
        }).finally(() => setLoadingEvents(false));
    }, [connected, startDate, reload, etag, user]);

    useEffect(() => {
        if (!hasRole(roles, Roles.ContentAdmin) || !connected)
            return;

        api.getMedia().then((m: MediaResource[]) => setMedia(m));
        api.getLocations().then(locs => setLocations(locs));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected, roles, reloadMedia]);

    useEffect(() => {
        if (!roles.length || !connected)
            return;

        api.getUsers().then((g: UserInfo[]) => setUsers(g));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected, roles, reloadUsers]);


    useEffect(() => {
        if (initialized) {
            //const participantKey = Event.getParticipantKey(user || undefined);
            const evts = rawEvents
                // public events
                .filter(re => {
                    if (!re.participants || Object.entries(re.participants).length === 0) {
                        return filter.publicEvents;
                    }
                    if (filter.allPrivateEvents) return true;

                    return (filter.users.some(u =>
                        re.participants[Event.getParticipantKey(u)] !== undefined || re.guide?.email === u))
                })

            const sortedEvents = sortEvents(explodeEvents(evts, 30, 30, startDate));

            const keyEvts = sortedEvents.filter(ev => ev.keyEvent).filter(ev => ev.end >= refDate.format(DateFormats.DATE));
            const tomorrow = toMidNight(refDate.add(1, "days")).format(DateFormats.DATE_TIME);
            const today = toMidNight(refDate).format(DateFormats.DATE_TIME);
            const msgs = sortedEvents.filter(ev => ev.allDay).filter(ev => ev.start >= today && ev.end <= tomorrow);

            setEvents(sortedEvents);

            syncLocalStorage(setKeyEvents, Event.equals, keyEvts);
            syncLocalStorage(setMessages, messageEquals, msgs.map(m => ({
                title: m.title,
                body: m.notes
            })));
        }
        // Not include refDate as it creates a loop of reloads
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawEvents, initialized, filter, user, setKeyEvents, setMessages, startDate]);

    useEffect(() => {
        let intervalId = setInterval(() => {
            setRefresh(old => {
                if ((old + 1) % 15 === 0) {
                    //every 2.5 min
                    console.log("set reload")
                    setReload(reloadOld => reloadOld + 1);
                }
                return old + 1

            });
        }, 10 * 1000)

        return (() => {
            clearInterval(intervalId)
        })
    }, [])

    const newKeyEventsCount = keyEvents?.reduce((acc, ke) => ke.unread ? acc + 1 : acc, 0) || 0;
    const newMessagesCount = messages?.reduce((acc, ke) => ke.unread ? acc + 1 : acc, 0) || 0;

    const newNotificationCount = newKeyEventsCount + newMessagesCount;

    if (showAccessibilitySettings) {
        return <AccessibilitySettings
            accSettings={accSettings}
            onClose={() => setShowAccessibilitySettings(false)}
            onSettingsChange={(newSettings) => setAccSettings(newSettings)}
        />;
    }

    const removeEvents = (removedIDs: string[]) => {
        setRawEvents(evts => evts.filter(e => !removedIDs.includes(e.id)));
    };

    const upsertEvent = (event: Event, event2?: Event) => {
        setRawEvents(evts => {
            const uEvents = evts.filter(e => e.id !== event.id && (!event2 || e.id !== event2.id))
            uEvents.push(event);
            if (event2) {
                uEvents.push(event2);
            }
            return uEvents;
        });
    }

    if (showLogin) {
        return <Login
            notify={notify}
            onLogin={(u: User) => setShowLogin(false)}
            onError={(err: Error) => notify.error(err.toString())}
            onForgotPwd={() => {
                api.forgotPwd().then((info: any) => {
                    notify.success("להחלפת סיסמא, יש לשלוח הודעת ווטסאפ למספר: " +
                        info.phone +
                        ". דוגמא: 'סיסמא myNewPassword' להחלפה לסיסמא myNewPassword. יש לבחור סיסמא לפחות בת 6 תווים."
                        , undefined, 10000);
                })
            }}
            onCancel={()=>setShowLogin(false)}
        />
    }

    if (showUserSettings) {
        return <UserSettings
            onAccessibilitySettings={() => {
                setShowAccessibilitySettings(true)
            }}
            user={user}
            onSaveNickName={(newNick) => {
                user && api.updateNickName(user, newNick).then(
                    () => {
                        notify.success("כינוי עודכן בהצלחה");
                        onNickNameUpdate(newNick);
                    },
                    (err) => notify.error(err)
                )
            }}
            onClose={() => setShowUserSettings(false)}
            notificationOn={notificationOn}
            onNotificationOnChange={onNotificationOnChange}
            onNotificationToken={onNotificationToken}
            onPushNotification={onPushNotification}
            onBetaChange={(on) => setBeta(on)}
            onAccessibleCalendar={((on) => setAccessibleCalendar(on))}
            accessibleCalendar={accessibleCalendarAct}
            beta={beta === true}
            notify={notify}
            nickName={nickName}
            isKioskUser={kioskMode}
            isTV={isTV}
        />
    }
    const admin = hasRole(roles, Roles.ContentAdmin) || hasRole(roles, Roles.UserAdmin);
    return <div dir={"rtl"} className="userEventsContainer"

        onKeyDown={(e: any) => {
            if (e.key === "Tab" && !e.shiftKey) {
                if (kioskMode) beep(200, 50, 40)
                if (e.target.getAttribute("tab-marker") === "last") {
                    firstElemRef.current?.focus();
                    e.preventDefault();
                }
            }
        }}
    >

        <SideMenu
            open={showMenu}
            onClose={() => setShowMenu(false)}
            user={user}
            nickName={nickName}
            setNickName={(newNick:string) => {
                user && api.updateNickName(user, newNick).then(
                    () => {
                        notify.success("כינוי עודכן בהצלחה");
                        onNickNameUpdate(newNick);
                    },
                    (err) => notify.error(err)
                )
            }}
            avatarUrl={avatarUrl}
            onNotifications={() => {
                setShowNotifications(true);
                setShowMenu(false);
            }}
            onAccessibilitySettings={() => {
                setShowAccessibilitySettings(true);
                setShowMenu(false);
            }}
            onShowLogin={() => {
                setShowLogin(true);
                setShowMenu(false);
            }}
            isAdmin={admin}
            adminView={!accessibleCalendar}
            setAdminView={(isAdmin:boolean)=>setAccessibleCalendar(!isAdmin)}
            notify={notify}
            newNotificationCount={newNotificationCount}
        />



        <EventsHeader
            centered={isTV}
            height={"12vh"}
            showDateTime={refDate}
            nickName={nickName}
            roles={roles}
            isGuide={isGuide}
            // onLogoDoubleClicked={() => setShowUserSettings(true)}
            // onLogoTripleClicked={() => setShowAccessibilitySettings(true)}
            //notificationOn={notificationOn}
            //onNotificationClick={() => setShowNotifications(prev => !prev)}
            //showingNotifications={showNotifications}
            onMenuClick={() => setShowMenu(true)}
            newNotificationCount={newNotificationCount}
            user={user}
            kioskMode={kioskMode}
            avatarUrl={avatarUrl}
            onHome={() => setShowNotifications(false)}
            showHome={showNotifications}
            firstElemRef={firstElemRef}
            isTV={isTV}
        />

        <div style={{ height: admin ? "82vh" : "88vh" }}>

            {hasRole(roles, Roles.UserAdmin) && manageUsers && !showNotifications && <Users user={user} notify={notify} users={users} reload={() => setReloadUsers(old => old + 1)} roles={roles} />}
            {hasRole(roles, Roles.ContentAdmin) && manageMedia && !showNotifications && <Media notify={notify} media={media} reload={() => setReloadMedia(old => old + 1)} />}

            {showNotifications && <NotificationView
                kioskMode={kioskMode}
                messages={messages || []}
                keyEvents={keyEvents || []}
                accSettings={accSettings}
                onMessageSetRead={(msg) => setMessages(curr => (curr &&
                    curr.map(m => {
                        if (messageEquals(m, msg)) {
                            return { ...m, unread: false } as MessageInfo;
                        }
                        return m;
                    })))
                }
                onKeyEventSetRead={(keyEvt) => setKeyEvents(curr => (curr &&
                    curr.map(ke => {
                        if (Event.equals(ke, keyEvt)) {
                            return { ...ke, unread: false } as Event;
                        }
                        return ke;
                    })))
                }
                audioRef={audioRef}
                refDate={refDate}
            />}

            {!manageUsers && !manageMedia && !showNotifications && (accessibleCalendarAct ?
                <AccessibleView
                    events={events}
                    isTV={isTV}
                    refDate={refDate}
                    daysOffset={daysOffset}
                    kioskMode={kioskMode}
                    beta={beta}
                    accSettings={accSettings}
                    audioRef={audioRef}
                    onChangeDaysOffset={(newOffset) => setDaysOffset(newOffset)}
                    loading={loadingEvents}
                    height={admin ? 79 : 85}
                /> :

                <Events
                    events={events}
                    refDate={refDate}
                    daysOffset={daysOffset}
                    beta={beta}
                    audioRef={audioRef}
                    onChangeDaysOffset={(newOffset) => setDaysOffset(newOffset)}
                    media={media}
                    users={users}
                    locations={locations}
                    notify={notify}
                    onRemoveEvents={removeEvents}
                    onUpsertEvent={upsertEvent}
                    roles={roles}
                    filter={filter}
                    setFilter={setFilter}

                />)
            }
        </div>

        {admin && !accessibleCalendar && <div>
            <div className="admin-pane-btn-seperator" />
            <div className="admin-pane-btn-container">
                <AdminBtn
                    onPress={() => {
                        setManageMedia(false);
                        setManageUsers(false);
                        setShowNotifications(false);
                    }}
                    //icon={<img src={calPng} />}
                    //style={{backgroundImage:`url(${calPng})`}}
                    icon={<CalBtn />}
                    selected={!manageMedia && !manageUsers}
                    caption="יומן"
                />
                <AdminBtn
                    onPress={() => {
                        setManageMedia(false);
                        setManageUsers(true)
                        setShowNotifications(false);
                    }}
                    //icon={<img src={usersPng} />}
                    icon={<UsersBtn />}
                    selected={manageUsers}
                    caption="משתמשים"
                />
                <AdminBtn
                    onPress={() => {
                        setManageMedia(true);
                        setManageUsers(false)
                        setShowNotifications(false);
                    }}
                    icon={<MediaBtn />}
                    selected={manageMedia}
                    caption="מדיה"
                />
            </div>
        </div>
        }
    </div >
}