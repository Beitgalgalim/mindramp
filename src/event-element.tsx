import { Dayjs } from "dayjs";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { VBox, Text, Spacer, HBox, HBoxSB, EventProgress, Avatar } from "./elem";
import { DateFormats, getBeforeTimeText } from "./utils/date";
import { Event } from './event';
import { Design } from "./theme";
import { CircularProgress } from "@material-ui/core";
import dayjs from './localDayJs'

import { AccessTime, MicOutlined } from "@mui/icons-material";
export default function EventElement({ event, single, firstInGroup, now, width, audioRef }:
    {
        event: Event, single: boolean, firstInGroup: boolean, now: Dayjs,
        width: number,
        audioRef: MutableRefObject<HTMLAudioElement>,
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
    const widthPixels = window.innerWidth * (width / 100);
    return (
        <div style={{
            flex: "0 0 auto",
            //width: (isSingle ? width : width * 0.7) - 48,
            width: (isSingle ? widthPixels : widthPixels * 0.7) - 48,
            height: isSingle ? Design.singleEventHeight : Design.multiEventHeight,
            background: playProgress >= 0 ?
                `linear-gradient(to left,#D1DADD ${playProgress}%, white ${playProgress}% 100%)` :
                "white",
            borderRadius: 10,
            marginRight: firstInGroup ? 24 : 0,
            marginLeft: 24,
            marginBottom: 30,
            marginTop: 1,
            boxShadow: event.isPersonal === true ? Design.boxShadowPersonal : Design.boxShadow,
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
                        <img src={event.imageUrl} style={{
                            maxWidth: Design.eventImageSize,
                            maxHeight: Design.eventImageSize,
                            borderRadius: 10,
                            objectFit: "cover",
                        }} alt="תמונה"
                        />
                    </div>
                }
                {!isSingle && event.guide && <Avatar size={Design.avatarSize} imageSrc={event.guide?.icon} />}
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
                    {eventAudioLoading && <CircularProgress size={Design.buttonSize} />}
                    {
                        event.audioUrl &&
                        <div style={{
                            height: Design.buttonSize, minWidth: Design.buttonSize,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: "white",
                            backgroundColor: "#6F9CB6",
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