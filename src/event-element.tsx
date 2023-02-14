import { Dayjs } from "dayjs";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { VBox, Text, Spacer, HBox, HBoxSB, EventProgress, Avatar, UnRead } from "./elem";
import { DateFormats, getBeforeTimeText, getNiceDate, timeRange2Text } from "./utils/date";
import { Event } from './event';
import { Colors, Design } from "./theme";
import { CircularProgress } from "@mui/material";
import dayjs from './localDayJs'
import './css/event.css'
import genericEventImg from './icons/generic-event.png';
import personalEventImg from './icons/personal-event.png';


import { AccessTime, MicOutlined, PeopleAlt, PlayArrow, VolumeUp } from "@mui/icons-material";
//const myEvent = require('./icons/myEvent.svg');
import myEvent from './icons/myEvent.png'
import { AccessibilitySettingsData, UserElementProps } from "./types";
export default function EventElement({
    accessibilitySettings,
    event, single, firstInGroup,
    now, width, audioRef, showingKeyEvent, onSetRead, tabMarker, kioskMode, isTv }: UserElementProps

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
    const heightSingle = accessibilitySettings && accessibilitySettings.imageSize > 1 ? 7 : 9.375;
    const heightDouble = accessibilitySettings && accessibilitySettings.imageSize > 1 ? 11 : 15.625;
    let height = single ? heightSingle + "rem" : heightDouble + "rem"
    if ( accessibilitySettings && accessibilitySettings.imageSize > 1 )
    {
        height = single ? heightSingle * imageSize + "rem" : heightDouble * imageSize + "rem"
    }
     

    const t1 = dayjs(event.start).format(DateFormats.TIME)
    const t2 = dayjs(event.end).format(DateFormats.TIME)

    const eventProgress = Math.abs(now.diff(event.start, "minutes")) <= 0 ? 0 :
        now.isAfter(event.start) && (now.isBefore(event.end) || now.isSame(event.end)) ?
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

    const dateTime = event.allDay ? "כל היום" : t1 + " - " + t2 +
        (showingKeyEvent ? " " + getNiceDate(event.date, true) : "");




    if (audioRef?.current?.src !== event.audioUrl && playProgress > 0) {
        setPlayProgress(-1);
    }

    const isSingle = !!single;
    const widthPixels = window.innerWidth * (width / 100);
    console.log("eventProgress", eventProgress)
    return (
        <button
            className={"event-container" + (kioskMode ? " kiosk-nav" : "")}
            tab-marker={tabMarker}
            aria-label={getAccessibleEventText(event)}
            style={{
                width: (isSingle ? widthPixels : widthPixels * 0.5),
                height: height,          
                //marginRight: firstInGroup ? 24 : 0,
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
            <div style={{
                width:"100%", height:"100%",
                marginBottom:10,
                display:"flex",
                background: playProgress >= 0 ?
                `linear-gradient(to left,#D1DADD ${playProgress}%, white ${playProgress}% 100%)` :
                "white",
            }}>
            {showingKeyEvent && event.unread && <UnRead onSetRead={onSetRead} />}


            {/** pin for personal events */
                event.isPersonal === true &&
                <div className="event-personal-pin">
                    {/* <PushPin style={{ color: Colors.EventIcons, fontSize:30 , textShadow: "0 0 10px blue"}} /> */}
                    <img src={myEvent} style={{ width: 45, height: 45 }} />
                </div>
            }

            <div className="title-and-image" style={{ flexDirection: single ? "row-reverse" : "column" }}>


                <div className="event-text">
                    <div style={{ fontSize: titleSize * 1.6 + "em", lineHeight: titleSize * 1.9 + "rem" }}>{event.title}</div>
                    <Spacer height={15} />
                    <div style={{ fontSize: hourSize * 1.1 + "em", lineHeight: hourSize * 1.1 + "rem" }}>{dateTime}</div>
                    <Spacer height={5} />
                    <Text fontSize={0.9 * titleSize + "em"} lineHeight={0.9 * titleSize + "rem"}>{event.location || ""}</Text>
                </div>
                <img src={event.imageUrl ||

                    (event.participants && Object.entries(event.participants).length > 0 ?
                        personalEventImg : genericEventImg
                    )} style={{
                        maxWidth: Design.eventImageSize * imageSize,
                        maxHeight: Design.eventImageSize * imageSize,
                        borderRadius: 10,
                        marginLeft: 15,
                        objectFit: "cover",
                    }} alt="תמונה" />
            </div>


            {eventProgress >= 0 && <div className="event-progress"
                style={{
                    background: `linear-gradient(to left,#5A6F8E ${eventProgress * 100 + 2}%, #8F9FB7 ${eventProgress * 100 + 2}% 100%)`
                }} />
            }

            <div className="event-footer-left">
                {event.guide && <Avatar size={Design.avatarSize} imageSrc={event.guide?.icon} />}
                <Spacer />
                {eventAudioLoading && <CircularProgress size={Design.buttonSize} />}
                {
                    event.audioUrl && !isTv && !eventAudioLoading && (playProgress > 1
                        ? <PlayArrow style={{
                            fontSize: Design.buttonSize,
                        }} /> :
                        < VolumeUp style={{
                            fontSize: Design.buttonSize,
                        }} />)
                }
                {event.participants && Object.entries(event.participants).length > 0 &&
                    <PeopleAlt style={{
                        fontSize: Design.buttonSize,
                    }} />
                }
            </div>


            {
                minutesBefore > 0 && minutesBefore < 120 && <div className="event-time-before">
                    <Text color="white">{getBeforeTimeText(minutesBefore)}</Text>
                </div>
            }
            </div>
            {!single && firstInGroup && <div className="event-left-seperator" />}
            <div className="event-seperator" />
        </button >
    );
}

function getAccessibleEventText(evt: Event): string {
    let ret = evt.title + " בשעה " + timeRange2Text(evt.start, evt.end);
    if (evt.audioUrl) {
        ret += ". לשמיעה יש ללחוץ אנטר"
    }
    //console.log(ret)
    return ret;

}