import { Dayjs } from "dayjs";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { VBox, Text, Spacer, HBox, HBoxSB, EventProgress, Avatar, UnRead } from "./elem";
import { DateFormats, getBeforeTimeText, getNiceDate, timeRange2Text } from "./utils/date";
import { Event } from './event';
import { Colors, Design } from "./theme";
import { CircularProgress } from "@material-ui/core";
import dayjs from './localDayJs'
import './css/event.css'


import { AccessTime, MicOutlined } from "@mui/icons-material";
//const myEvent = require('./icons/myEvent.svg');
import myEvent from './icons/myEvent.png'
import { AccessibilitySettingsData, UserElementProps } from "./types";
export default function EventElement({
    accessibilitySettings,
    event, single, firstInGroup,
    now, width, audioRef, showingKeyEvent, onSetRead }: UserElementProps

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
            if (audioRef && audioRef.current && audioRef.current?.src === event.audioUrl) {
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


    const titleSize = accessibilitySettings ? accessibilitySettings.titleSize : 1;
    const hourSize = accessibilitySettings ? accessibilitySettings.hoursSize : 1;
    const imageSize = accessibilitySettings ? accessibilitySettings.imageSize : 1;

    const t1 = dayjs(event.start).format(DateFormats.TIME)
    const t2 = dayjs(event.end).format(DateFormats.TIME)

    const eventProgress = Math.abs(now.diff(event.start, "minutes")) <= 1 ? 0 :
        now.isAfter(event.start) && now.isBefore(event.end) ?
            now.diff(event.start, "seconds") / dayjs(event.end).diff(event.start, "seconds") :
            -1;

    const minutesBefore = now.isBefore(event.start) ? -now.diff(event.start, "minutes") : 0;

    useEffect(() => {
        console.log(event.title, "mounted")
        return () => {
            console.log(event.title, "unmounted")
            if (audioRef)
                audioRef.current.src = ""
        }
    }, [])

    const titleAndLocation = <div className="title-location" >
        <div style={{ fontSize: titleSize + "em" }}>{event.title}</div>
        {event.location && <Text fontSize={0.7 * titleSize + "em"}>{event.location}</Text>}
    </div>

    const dateTime = event.allDay ? "כל היום" : t1 + " - " + t2 +
        (showingKeyEvent ? " " + getNiceDate(event.date, true) : "");


    if (audioRef?.current?.src !== event.audioUrl && playProgress > 0) {
        setPlayProgress(-1);
    }

    const isSingle = !!single;
    const widthPixels = window.innerWidth * (width / 100);
    return (
        <button
            className="event-container"
            aria-label={getAccessibleEventText(event)}
            style={{

                width: (isSingle ? widthPixels : widthPixels * 0.7) - 48,
                height: single ? Design.singleEventHeight : Design.multiEventHeight,
                background: playProgress >= 0 ?
                    `linear-gradient(to left,#D1DADD ${playProgress}%, white ${playProgress}% 100%)` :
                    "white",
                marginRight: firstInGroup ? 24 : 0,
            }}
            onClick={() => {
                if (event.unread === true && onSetRead) {
                    onSetRead();
                }

                // plays the audio if exists
                if (event.audioUrl && event.audioUrl !== "" && audioRef && audioRef.current) {
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
            {showingKeyEvent && event.unread && <UnRead onSetRead={onSetRead} />}


            {/** pin for personal events */
                event.isPersonal === true &&
                <div style={{ position: "absolute", top: -20, left: "45%", }}>
                    {/* <PushPin style={{ color: Colors.EventIcons, fontSize:30 , textShadow: "0 0 10px blue"}} /> */}
                    <img src={myEvent} style={{ width: 45, height: 45 }} />
                </div>
            }
            <div className="event-title">
                {
                    event.imageUrl && <img src={event.imageUrl} style={{
                        maxWidth: Design.eventImageSize * imageSize,
                        maxHeight: Design.eventImageSize * imageSize,
                        borderRadius: 10,
                        objectFit: "cover",
                    }} alt="תמונה"
                    />
                }
                {titleAndLocation}
            </div>
            <div className="event-footer-right">
                <AccessTime style={{ fontSize: hourSize + "em", color: Colors.EventIcons }} />
                <Text aria-hidden="true" fontSize={hourSize + "em"}>{dateTime}</Text>
            </div>

            <div className="event-footer-left">
                {event.guide && <Avatar size={Design.avatarSize} imageSrc={event.guide?.icon} />}
                {eventAudioLoading && <CircularProgress size={Design.buttonSize} />}
                {
                    event.audioUrl &&
                    <div style={{
                        height: Design.buttonSize, minWidth: Design.buttonSize,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "white",
                        backgroundColor: Colors.EventIcons,
                        borderRadius: Design.buttonSize / 2,
                    }}>
                        <MicOutlined style={{
                            fontSize: Design.buttonSize * .7,
                        }} />
                    </div>
                }
            </div>
            {/* <HBoxSB style={{ width: undefined, paddingRight: 10 }}>
                <VBox style={{ width: "75%" }}>
                    <HBox style={{ alignItems: "center", width: "100%" }}>
                        <AccessTime style={{ color: Colors.EventIcons }} />

                        <Spacer />
                        

                        <Text aria-hidden="true" fontSize={hourSize + "em"}>{dateTime}</Text>
                    </HBox>
                    <Spacer />
                    {eventProgress >= 0 && <EventProgress progress={eventProgress} event={event} />}
                </VBox>
                <HBox>
                    {eventAudioLoading && <CircularProgress size={Design.buttonSize} />}
                    {
                        event.audioUrl &&
                        <div style={{
                            height: Design.buttonSize, minWidth: Design.buttonSize,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: "white",
                            backgroundColor: Colors.EventIcons,
                            borderRadius: Design.buttonSize / 2,
                        }}>
                            <MicOutlined style={{
                                fontSize: Design.buttonSize * .7,
                            }} />
                        </div>
                    }
                    <Spacer />
                    {isSingle && event.guide ? <Avatar size={Design.avatarSize} imageSrc={event.guide?.icon} /> : isSingle && <Spacer width={Design.avatarSize} />}
                    <Spacer height={Design.avatarSize} />
                </HBox>
            </HBoxSB> */}

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
        </button >
    );
}

function getAccessibleEventText(evt: Event): string {
    let ret = evt.title + " בשעה " + timeRange2Text(evt.start, evt.end);
    if (evt.audioUrl) {
        ret += ". לשמיעה יש ללחוץ אנטר"
    }
    console.log(ret)
    return ret;

}