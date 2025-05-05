import { CircularProgress } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Text, VBoxC } from "./elem";
import EventElement from "./event-element";
import EventsNavigationNew from "./events-navigation-new";
import { Design } from "./theme";
import { AccessibilitySettingsData } from "./types";
import { DateFormats, getNiceDay, organizeEventsForDisplay } from "./utils/date";
import * as api from './api'

import "./css/event.css";


const scrollInterval = 600;
const scrollIncrement = 10;

export function AccessibleView({ events, isTV, refDate, daysOffset, kioskMode, beta, accSettings,
    audioRef,
    onChangeDaysOffset,
    loading,
}:
    {
        events: any[], isTV: boolean,
        refDate: Dayjs, // normally this is now
        daysOffset: number, // the offset in days from refDate
        kioskMode: boolean, beta: boolean,
        accSettings?: AccessibilitySettingsData,
        audioRef: MutableRefObject<HTMLAudioElement>
        onChangeDaysOffset: (newOffet: number) => void,
        loading: boolean
    }) {

    const [scrollingColumn, setScrollingColumn] = useState(0);
    const [scroll, setScroll] = useState<number>(0);
    const scrollElem = useRef<HTMLDivElement>(null);
    const days = [];

    useEffect(() => {
        if (isTV) {
            console.log("setup interval for scroll")
            let intervalId = setInterval(() => {
                // do interval logic
                if (scrollElem.current) {
                    console.log("scroll tv mode")
                    const h = scrollElem.current.scrollHeight;
                    scrollElem.current.scrollBy({ behavior: "smooth", top: scrollIncrement });
                    setScroll(old => {
                        console.log(old, scrollElem.current && h - scrollElem.current.clientHeight)
                        if (scrollElem.current) {
                            if (old > h - scrollElem?.current?.clientHeight) {
                                setScrollingColumn(oldCol => {
                                    console.log("promoteCol", oldCol)
                                    if (scrollElem.current) scrollElem.current.scrollBy({ behavior: "smooth", top: - old });
                                    if (oldCol < 2) return oldCol + 1;
                                    return 0;
                                })
                                //reset scroll

                                return 0;
                            }
                            return old + scrollIncrement;
                        }
                        return old;
                    })
                }
            }, scrollInterval)

            return (() => {
                clearInterval(intervalId)
            })
        }
    }, [isTV])



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
        if (showDateTime.add(1, "day").day() < 5) {
            const tomorrow = events.filter(e => e.start >= showDateTime.add(1, "day").format(DateFormats.DATE) &&
                e.start < showDateTime.add(2, "day").format(DateFormats.DATE));

            days.push({
                caption: "מחר",
                emptyMsg: NoEventsMsg,
                eventGroup: organizeEventsForDisplay(tomorrow),
            })
        }
        // const dayAfterTomorrow = events.filter(e => e.start >= showDateTime.add(2, "day").format(DateFormats.DATE) &&
        //     e.start < showDateTime.add(3, "day").format(DateFormats.DATE));

        // days.push({
        //     caption: "מחרתיים",
        //     emptyMsg: NoEventsMsg,
        //     eventGroup: organizeEventsForDisplay(dayAfterTomorrow),
        // })
    }

    const columnWidth = 100 / days.length;
    const nav = !isTV &&
        <EventsNavigationNew
            height={"80px"}
            currentNavigation={daysOffset}
            onNavigate={(offset: number) => {
                if (offset > 0) {
                    api.logAnalyticEvent("NavButton", { offset });
                }
                onChangeDaysOffset(offset);
            }}
            buttons={[{ widthPercent: 40, caption: "היום, " + getNiceDay(refDate.day()) }, { widthPercent: 26, caption: "מחר" }, { widthPercent: 30, caption: "מחרתיים" }]}
            //tabMarker={day.eventGroup && day.eventGroup.length > 0 ? "" : "last"}
            kiosk={kioskMode}
        />


    return (
        <div className="events-container-with-nav">
            <div className="events-main-container">
                {days.map((day, dayIndex) =>
                    <div className="events-main" key={dayIndex} style={{
                        height: "calc(87vh - 80px)", width: columnWidth + "vw"
                    }}>

                        {accSettings?.navigationBottom ? null : nav}


                        {isTV && <Text textAlign={"center"} fontSize={30}>{day.caption}</Text>}
                        {isTV && <div className="events-top-seperator" />}

                        <div className="events-scroll-container"
                            ref={isTV && dayIndex == scrollingColumn ? scrollElem : undefined}>
                            {/* <EventsContainer
                    backgroundColor={beta?"white": "#EBF0F2"}
                    
                    vhHeight={height - 8}

                > */}
                            {
                                day.eventGroup?.map((evGroup, i) => (
                                    <div className={evGroup.length > 1 ? "multiple-events-container" : ""} key={i}>
                                        {
                                            evGroup.map((ev, j, ar) => (<EventElement key={ev.tag}
                                                isTv={isTV}
                                                groupIndex={i}
                                                kioskMode={kioskMode}
                                                tabMarker={i == day.eventGroup.length - 1 && j == evGroup.length - 1 ? "last" : ""}
                                                accessibilitySettings={accSettings}
                                                showingKeyEvent={false}
                                                width={columnWidth}
                                                single={ar.length === 1}
                                                firstInGroup={j === 0}
                                                event={ev}
                                                now={showDateTime}
                                                audioRef={audioRef}
                                            />))
                                        }
                                    </div>))
                            }
                            {isTV && <div className="event-day-seperator" />}
                        </div>
                        {day.eventGroup.length == 0 && <VBoxC style={{ height: "50vh" }}>
                            <Text textAlign={"center"} fontSize={"2em"}>{loading ? "טוען..." : day.emptyMsg}</Text>
                            {loading && <CircularProgress size={Design.buttonSize} />}

                        </VBoxC>}
                    </div>

                )}

            </div>
            {accSettings?.navigationBottom ? nav : null}

        </div>);
}