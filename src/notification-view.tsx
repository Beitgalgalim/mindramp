import { useState } from "react";
import EventsNavigation from "./events-navigation";
import { NotificationViewProps } from "./types";
import { Event } from './event'
import { EventsMain, Text, VBoxC } from "./elem";
import { EventsContainer } from "./events-container";
import Message from "./message";
import EventElement from "./event-element";

const EmptyMsg = (msg: string) => {
    return <VBoxC style={{ height: "50vh" }}>
        <Text textAlign={"center"} fontSize={"2em"}>{msg}</Text>
    </VBoxC>
}

export default function NotificationView({
    keyEvents,
    messages,
    kioskMode,
    accSettings,
    onMessageSetRead,
    onKeyEventSetRead,
    audioRef,
    refDate,
}: NotificationViewProps) {
    const [notificationsPane, setNotificationsPane] = useState<number>(0);

    const newKeyEventsCount = keyEvents?.reduce((acc, ke) => ke.unread ? acc + 1 : acc, 0) || 0;
    const newMessagesCount = messages?.reduce((acc, ke) => ke.unread ? acc + 1 : acc, 0) || 0;



    return (<EventsMain height={"100%"}>
        <EventsNavigation
            height={"10vh"}
            currentNavigation={notificationsPane}
            onNavigate={(offset: number) => setNotificationsPane(offset)}
            buttons={[{ caption: "הודעות", badge: newMessagesCount }, { caption: "אירועים", badge: newKeyEventsCount }]}
            //tabMarker={day.eventGroup && day.eventGroup.length > 0?"":"last"}
            kiosk={kioskMode}
        />

        {notificationsPane === 0 && messages.length == 0 && EmptyMsg("אין הודעות")}
        {notificationsPane === 1 && keyEvents.length == 0 && EmptyMsg("אין אירועים")}
        <EventsContainer>

            {notificationsPane === 0 ?
                // Messages
                 messages.map(msg => (<Message
                    msg={msg}
                    onSetRead={() => onMessageSetRead(msg)}
                />)) 

                :
                // Key Events
                keyEvents.map((keyEvt, i) => (<EventElement key={keyEvt.tag}
                    groupIndex={0}
                    kioskMode={kioskMode}
                    tabMarker={i == keyEvents.length - 1 ? "last" : ""}
                    accessibilitySettings={accSettings}
                    showingKeyEvent={true}
                    single={true}
                    firstInGroup={true}
                    width={100}
                    event={keyEvt}
                    now={refDate}
                    audioRef={audioRef}
                    onSetRead={() => onKeyEventSetRead(keyEvt)}
                />)) 
            }
        </EventsContainer>




    </EventsMain>)
}