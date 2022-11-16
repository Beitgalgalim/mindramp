import { CircularProgress } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { LegacyRef, MutableRefObject, useState } from "react";
import { EventsMain, HBox, Text, VBoxC } from "./elem";
import { Event } from "./event";
import EventElement from "./event-element";
import EventElementNew from "./event-element-new";
import { EventsContainer } from "./events-container";
import EventsNavigation from "./events-navigation";
import Message from "./message";
import { Design } from "./theme";
import { AccessibilitySettingsData } from "./types";
import { DateFormats, organizeEventsForDisplay } from "./utils/date";



export function AccessibleView({ events, isTV, refDate, daysOffset, kioskMode, beta, accSettings,
    audioRef,
    onChangeDaysOffset,
    loading
}:
    {
        events: any[], isTV: boolean,
        refDate: Dayjs, // normally this is now
        daysOffset: number, // the offset in days from refDate
        kioskMode: boolean, beta: boolean,
        accSettings?: AccessibilitySettingsData,
        audioRef: MutableRefObject<HTMLAudioElement>
        onChangeDaysOffset: (newOffet: number) => void,
        loading:boolean,
    }) {

    const days = [];

    const NoEventsMsg = "אין אירועים";
    let showingEvents = [];
    const showDateTime = daysOffset === 0 ? refDate : dayjs(refDate.add(daysOffset, "days").format(DateFormats.DATE) + " 00:00");

    showingEvents = events.filter(e => !e.allDay && e.start >= showDateTime.format(DateFormats.DATE) &&
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

    const columnWidth = 100 / days.length;

    return (<HBox style={{ justifyContent: "space-evenly" }}>
        {days.map((day, dayIndex) =>
            <EventsMain key={dayIndex} height={"88vh"} width={(columnWidth - 1) + "vw"}
            >
                {!isTV && <EventsNavigation
                    height={"10vh"}
                    currentNavigation={daysOffset}
                    onNavigate={(offset: number) => onChangeDaysOffset(offset)}
                    buttons={[{ caption: "היום" }, { caption: "מחר" }, { caption: "מחרתיים" }]}
                    tabMarker={day.eventGroup && day.eventGroup.length > 0 ? "" : "last"}
                    kiosk={kioskMode}
                />}

                {isTV && <Text textAlign={"center"} fontSize={30}>{day.caption}</Text>}

                <EventsContainer
                    vhHeight={78}
                    scrollTop={100}
                    autoScroll={isTV}
                >
                    {day.eventGroup?.map((evGroup, i) =>
                        beta ?
                            evGroup.map((ev, j, ar) => (<EventElementNew
                                kioskMode={kioskMode}
                                tabMarker={i == day.eventGroup.length - 1 && j == evGroup.length - 1 ? "last" : ""}
                                key={ev.tag}
                                itemHeightPixels={Design.singleEventHeight}
                                accessibilitySettings={accSettings}
                                showingKeyEvent={false}
                                width={columnWidth - 1}
                                single={true} firstInGroup={true} event={ev} now={showDateTime}
                                audioRef={audioRef}

                            />))
                            :

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
                                        kioskMode={kioskMode}
                                        tabMarker={i == day.eventGroup.length - 1 && j == evGroup.length - 1 ? "last" : ""}
                                        accessibilitySettings={accSettings}
                                        showingKeyEvent={false}
                                        width={columnWidth - 1}
                                        single={ar.length === 1} firstInGroup={j === 0} event={ev} now={showDateTime}
                                        audioRef={audioRef}

                                    />))
                                }
                            </HBox>)
                    }
                    {<VBoxC style={{ height: "50vh" }}>
                        <Text textAlign={"center"} fontSize={"2em"}>{loading ? "טוען..." : day.emptyMsg}</Text>
                        {loading && <CircularProgress size={Design.buttonSize} />}

                    </VBoxC>}

                </EventsContainer>
            </EventsMain>
        )}
    </HBox>);
}