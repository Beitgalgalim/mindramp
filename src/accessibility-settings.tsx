import { useCallback } from 'react';

import { Close } from "@mui/icons-material";
import { HBox } from "./elem";
import { AccessibilitySettingsData, AccessibilitySettingsProps } from "./types";
import Slider from '@mui/material/Slider';
import './css/accessibility-settings.css'
import './css/user-events.css'
import EventElement from "./event-element";
import dayjs from './localDayJs'
import { Event } from "./event";


function getData(data?: AccessibilitySettingsData): AccessibilitySettingsData {
    if (data) {
        return data;
    }
    return {
        imageSize: 1,
        titleSize: 1,
        hoursSize: 1,
    };
}

export default function AccessibilitySettings({
    accSettings,
    onSettingsChange,
    onClose,
}: AccessibilitySettingsProps) {


    const updateSettings = useCallback((fieldName: string, inc: number, initialValue: number) => {
        const newVal = accSettings ? (accSettings as any)[fieldName] + inc : initialValue + inc;
        onSettingsChange({
            ...getData(accSettings),
            [fieldName]: (newVal as number),
        })
    }, [accSettings]);


    return <div className="userEventsContainer mainBG">
        <HBox style={{ justifyContent: "flex-end" }}>
            <Close
                style={{ fontSize: 40 }}
                onClick={() => {
                    onClose();
                }} />

        </HBox>
        <h1>הגדרות נגישות</h1>
        <div className="settingsContainer">
            <div>
                תמונה
            </div>
            <div className="slider">
                <button onClick={() => updateSettings("imageSize", -0.1, 1)}>-</button>

                <Slider
                    min={1}
                    max={1.9}
                    step={0.1}
                    //isRtl={false}
                    value={accSettings ? accSettings.imageSize : 0}
                    onChange={(ev, value) => {
                        console.log("image size", value)
                        onSettingsChange({
                            ...getData(accSettings),
                            imageSize: (value as number),
                        })
                    }}

                />
                <button onClick={() => updateSettings("imageSize", 0.1, 1)}>+</button>

            </div>
            <div>
                נושא
            </div>
            <div className="slider">
                <button onClick={() => updateSettings("titleSize", -0.1, 1)}>-</button>
                <Slider
                    min={1}
                    max={2}
                    step={0.1}
                    //isRtl={false}
                    value={accSettings ? accSettings.titleSize : 0}
                    onChange={(ev, value) => {
                        onSettingsChange({
                            ...getData(accSettings),
                            titleSize: (value as number),
                        })
                    }}

                />
                <button onClick={() => updateSettings("titleSize", 0.1, 1)}>+</button>
            </div>

            <div>
                שעה
            </div>
            <div className="slider">
                <button onClick={() => updateSettings("hoursSize", -0.1, 1)}>-</button>

                <Slider
                    defaultValue={30}
                    marks

                    min={1}
                    max={2}
                    step={0.1}
                    //isRtl={false}
                    value={accSettings ? accSettings.hoursSize : 0}
                    onChange={(ev, value) => {
                        onSettingsChange({
                            ...getData(accSettings),
                            hoursSize: (value as number),
                        })
                    }}

                />
                <button onClick={() => updateSettings("hoursSize", 0.1, 1)}>+</button>

            </div>
        </div>
        <div className="preview-events">
            <EventElement
                isTv={false}
                groupIndex={1}
                kioskMode={false}
                event={Event.fromDbObj({
                    guide: { icon: "https://www.gov.il/BlobFolder/news/ben_gurion_gallery2/he/benGur2.jpg" },
                    audioUrl: "https://noaudio.com",
                    title: "אירוע לדוגמא",
                    location: "אולם ראשי",
                    start: "2022-10-10T10:30",
                    end: "2022-10-10T11:30",
                    imageUrl: "https://firebasestorage.googleapis.com/v0/b/mindramp-58e89.appspot.com/o/media%2Fphotos%2F%D7%90%D7%A8%D7%95%D7%97%D7%AA%20%D7%91%D7%95%D7%A7%D7%A8.jpg?alt=media&token=581e8182-d5d2-4941-88b6-d4b6971f4266",
                })
                }
                single={true}
                firstInGroup={true}
                now={dayjs()}
                width={100}
                showingKeyEvent={false}
                accessibilitySettings={accSettings}
            />

            <EventElement
                isTv={false}
                groupIndex={1}
                kioskMode={false}
                event={Event.fromDbObj({
                    guide: { icon: "https://www.gov.il/BlobFolder/news/ben_gurion_gallery2/he/benGur2.jpg" },
                    audioUrl: "https://noaudio.com",
                    title: "אירוע לדוגמא",
                    location: "אולם ראשי",
                    start: "2022-10-10T10:30",
                    end: "2022-10-10T11:30",
                    imageUrl: "https://firebasestorage.googleapis.com/v0/b/mindramp-58e89.appspot.com/o/media%2Fphotos%2F%D7%90%D7%A8%D7%95%D7%97%D7%AA%20%D7%91%D7%95%D7%A7%D7%A8.jpg?alt=media&token=581e8182-d5d2-4941-88b6-d4b6971f4266",
                })
                }
                single={false}
                firstInGroup={true}
                now={dayjs()}
                width={100}
                showingKeyEvent={false}
                accessibilitySettings={accSettings}
            />
        </div>
    </div >
}