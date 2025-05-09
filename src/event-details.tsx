import { ComboBox, Spacer } from './elem';


import { Checkbox } from '@mui/material';
import { ReactComponent as UsersIcon } from './icons/users.svg'
import { ReactComponent as GuideIcon } from './icons/guide.svg'
import { ReactComponent as LocationIcon } from './icons/location.svg'
import { ReactComponent as AudioIcon } from './icons/audio.svg'
import { ReactComponent as SunIcon } from './icons/sun.svg'

import { Event, EventFrequency, RecurrentEventFieldKeyValue, ReminderFieldKeyValue } from './event';

import AudioPlayerRecorder from './AudioRecorderPlayer';
import { PeoplePicker, Person } from './people-picker';
import MediaPicker from './media-picker';

import NewDatePicker from './newDatePicker';
import { useState, useCallback, useRef } from 'react';
import { EventDetailsProps, InstanceType, MediaResource, UserInfo, UserType } from './types';
import { AddPhotoAlternateOutlined, Close, Delete, South } from '@mui/icons-material';
import EventsNavigationNew from './events-navigation-new';
import { replaceTime } from './utils/date';

const listStyle = { fontSize: "1em", textAlign: "right" };
const textStyle = {
    ...listStyle,
    width: 120,
    height: 25,
    backgroundColor: "rgba(86, 87, 87, 0.05)",
    borderRadius: 3
};


export default function EventDetails({
    inEvent, events, eventDetailsBeforeClose, onClose, onSave, onDelete,
    notify, media, users, locations, updateInProgress
}: EventDetailsProps) {
    const scrollElem = useRef<HTMLDivElement | null>(null);
    const [atBottom, setAtBottom] = useState<boolean>(false);
    const [editEvent, setEditEvent] = useState<Event | null>(inEvent.id ? null : inEvent);
    const [inSeries, setInSeries] = useState<Event | null>(null);
    const [instanceType, setInstanceType] = useState<InstanceType>(InstanceType.Normal);
    const [showAddMedia, setShowAddMedia] = useState<boolean>(false);

    const event = editEvent || inEvent;


    const handleEdit = useCallback(() => {
        if (inEvent.recurrent?.gid) {
            if (inEvent.instanceStatus) {
                setEditEvent(inEvent);
                setInSeries(null);
                setInstanceType(InstanceType.Instance);
            } else {
                // ask if editing the whole series or only this instance event
                notify.ask("האם לערוך את כל הסדרה?", undefined, [
                    {
                        caption: "כל הסדרה",
                        callback: () => {
                            const seriesEvent = events.find(e => e.id === inEvent.recurrent?.gid);
                            if (seriesEvent) {
                                setEditEvent(seriesEvent);
                                setInSeries(seriesEvent);
                                setInstanceType(InstanceType.Series);
                            }
                        }
                    },
                    {
                        caption: "מופע נוכחי",
                        callback: () => {
                            setEditEvent(inEvent);
                            setInSeries(null);
                            setInstanceType(InstanceType.Instance);
                        }
                    },
                    {
                        caption: "בטל",
                        callback: () => { }
                    },
                ])
            }
        } else {
            setEditEvent(inEvent);
            setInSeries(null);
            setInstanceType(InstanceType.Normal);
        }
    }, [inEvent, notify, events]);

    const isDirty = useCallback(() => {
        if (!editEvent) return false;
        if (inEvent?.id === undefined) {
            // new event - dirty if anything other than date is set:
            return (Object.entries(editEvent).length > 3 || editEvent.title != "");
        }
        const compareTo = inSeries || inEvent;

        for (const [key, value] of Object.entries(editEvent)) {
            if ((compareTo as any)[key] !== value) {
                return true;
            }
        }
        return false;

    }, [inSeries, inEvent, editEvent]);

    eventDetailsBeforeClose.askBeforeClose = () => {
        return isDirty();
    }

    const handleSave = useCallback(() => {
        if (!editEvent) return;

        const objToSave = new Event();
        delete objToSave.id
        for (const [key, value] of Object.entries(editEvent)) {
            if (value) {
                (objToSave as any)[key] = value;
            }
        }
        const compareTo = inSeries || inEvent;
        if (!!compareTo.audioUrl && compareTo.audioUrl !== objToSave.audioUrl) {
            objToSave.clearAudio = true;
        }

        

        if (objToSave.allDay) {
            delete objToSave.keyEvent;
            delete objToSave.reminderMinutes;

            objToSave.start= replaceTime(objToSave.start, "00:00");
            objToSave.end = replaceTime(objToSave.end, "23:59");
        }

        // Check if Audio exists and if not - warn
        if (!objToSave.audioUrl && !objToSave.audioBlob) {
            notify.ask(
                "בפגישה אין הקלטה המתארת את התוכן. האם לשמור בכל זאת?",
                "שמירה ללא הקלטה",
            [
                {caption: "המשך שמירה", callback: ()=>onSave(objToSave, instanceType)},
                {caption: "המשך עריכה", callback:()=>{}}
                
            ]);
            return;
        }

        onSave(objToSave, instanceType);

    }, [inSeries, inEvent, editEvent, instanceType, onSave]);

    const handleDelete = useCallback(() => {
        const buttons = [];
        if (inEvent.recurrent?.gid) {
            buttons.push({
                caption: "מופע זה בלבד",
                callback: () => onDelete(inEvent, InstanceType.Instance),
            });
            buttons.push({
                caption: "כל הסדרה",
                callback: () => {
                    onDelete(inEvent, InstanceType.Series)
                }
            });
        } else {
            buttons.push({
                caption: "מחיקה",
                callback: () => onDelete(inEvent, InstanceType.Normal),
            });
        }
        buttons.push({
            caption: "ביטול",
            callback: () => { }
        });

        notify.ask("האם למחוק אירוע?", "מחיקה", buttons);
    }, [inEvent, notify, onDelete]);

    const getParticipant = (email: string): [string, any] => {
        const selectedUser = users.find((u: UserInfo) => u._ref?.id === email);
        if (selectedUser) {
            const newParticipant = {
                displayName: selectedUser.displayName,
                email,
                ...(selectedUser.avatar && { icon: selectedUser.avatar.url }),
            }
            return [Event.getParticipantKey(email), newParticipant];
        }
        return ["", undefined];
    }


    const updateEvent = (fieldName: string, value: any) => {
        setEditEvent(ee => ee ? { ...ee, [fieldName]: value } as Event : ee);
    }

    const headerButtons = editEvent ?
        [{ widthPercent: 49, caption: "אירוע" }, { widthPercent: 49, caption: "הודעה יומית" }] :
        [{
            widthPercent: 100, caption: (event.allDay ?
                "הודעה יומית" :
                "אירוע")
        }];

    const handleScroll = (e: any) => {
        const el = e?.currentTarget;
        //console.log("scroll ", el.scrollHeight, el.scrollTop, el.offsetHeight);
        if (scrollElem && (el.scrollHeight - el.scrollTop - 5 < el.offsetHeight)) {
            setAtBottom(true);
        } else {
            setAtBottom(false);
        }
    }

    const needScroll = scrollElem.current && (scrollElem.current.scrollHeight > scrollElem.current.offsetHeight);
    const participants = event.participants ? Object.entries(event.participants) : [];

    return <div className="ev-details">
        <div className="ev-details-header">
            <EventsNavigationNew
                height={"60px"}
                currentNavigation={event.allDay ? (editEvent ? 1 : 0) : 0}
                onNavigate={(offset: number) => {
                    updateEvent("allDay", offset === 1);
                }}
                buttons={headerButtons}
                kiosk={false}
            />
        </div>

        <div className="ev-details-scroll-container"
            ref={scrollElem} onScroll={handleScroll}>

            {showAddMedia && <MediaPicker media={media} title={"בחירת תמונה"}
                onSelect={(rm: MediaResource) => {
                    updateEvent("imageUrl", rm.url);
                    setShowAddMedia(false);
                }}
                onCancel={() => setShowAddMedia(false)}
            />}

            <div className="ev-details-line ev-aligntop">
                {event.imageUrl || !editEvent ?
                    <div className="relative">
                        {event.imageUrl ? <img className="ev-details-img" src={event.imageUrl} alt="אין" /> : <div className="ev-details-img">ללא</div>}
                        {editEvent && <div className="ev-details-remove-img" onClick={() => updateEvent("imageUrl", undefined)}><Delete /></div>}
                    </div> :
                    <div className="ev-details-img" onClick={() => setShowAddMedia(true)}>
                        <AddPhotoAlternateOutlined style={{ fontSize: 35 }} />
                    </div>
                }

                <input className="ev-details-title"
                    type="text" value={event.title}
                    readOnly={!editEvent}
                    autoFocus={!!editEvent}
                    onChange={(e) => updateEvent("title", e?.currentTarget?.value)} />

            </div>


            <div className="ev-details-line">
                <NewDatePicker
                    fontSize="1em"
                    start={event.start} end={event.end}
                    setStart={(d) => updateEvent("start", d)}
                    setEnd={(d) => updateEvent("end", d)}
                    pickTimes={!event.allDay}
                    isDateRange={event.allDay}
                    readOnly={!editEvent}
                />
            </div>

            <div className="ev-details-line">
                <textarea className="ev-details-notes"
                    readOnly={!editEvent}
                    onChange={(e) => updateEvent("notes", e?.currentTarget?.value)} >{event.notes}</textarea>
                <div className="ev-details-check-boxes-list">
                    {!event.allDay && <div className="ev-details-check-box">
                        <Checkbox checked={event.keyEvent} disabled={!editEvent} onChange={(e) => updateEvent("keyEvent", e.currentTarget.checked)} />
                        <div >אירוע מיוחד</div>
                    </div>}

                    <div className="ev-details-check-box">
                        <Checkbox checked={event.showOnSharedScreen} disabled={!editEvent || participants.length === 0} onChange={(e) => updateEvent("showOnSharedScreen", e.currentTarget.checked)} />
                        <div>הצג במסך משותף</div>
                    </div>

                    {event.allDay && <div className="ev-details-check-box">
                        <Checkbox checked={event.overrideAll == true} disabled={!editEvent} onChange={(e) => updateEvent("overrideAll", e.currentTarget.checked)} />
                        <div >בטל אירועים שבמקביל</div>
                    </div>}
                </div>
            </div>

            {/**Users */}
            <div className="ev-details-line">
                <UsersIcon className="ev-details-icon" />
                <div className="ev-details-users-container">
                    {editEvent && <PeoplePicker 
                        users={users}
                        listStyle={listStyle}
                        textStyle={textStyle}
                        type={UserType.PARTICIPANT}
                        placeholder="הוסף משתתפים"
                        onSelect={(person: string) => {
                            const [key, participant] = getParticipant(person)
                            if (key && key.length > 0) {
                                let newParticipants = editEvent.participants;
                                if (newParticipants) {
                                    newParticipants = { ...newParticipants, [key]: participant };
                                } else {
                                    newParticipants = { [key]: participant };
                                }
                                updateEvent("participants", newParticipants);
                            }
                        }} />}
                    {editEvent && <Spacer />}
                    <div className="ev-details-users">
                        {event.participants && participants.map(([key, value]: any) => {
                            console.log("part:", key, value)
                            return <Person
                                width={150} name={value.displayName} icon={value.icon}
                                onRemove={editEvent ? () => {
                                    if (editEvent.participants) {
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                        const { [key]: _, ...newParticipants } = editEvent.participants;
                                        updateEvent("participants", newParticipants);
                                    }

                                } : undefined}

                            />
                        })}
                    </div>
                </div>

            </div>
            {/**Guide */}
            <div className="ev-details-line">
                <GuideIcon className="ev-details-icon" />
                <div className="ev-details-users-container">
                    {editEvent && <PeoplePicker users={users} type={UserType.GUIDE} placeholder="בחר מדריך"
                        listStyle={listStyle}
                        textStyle={textStyle}

                        onSelect={(person: string) => {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const [key, participant] = getParticipant(person);
                            updateEvent("guide", participant);
                        }} />}
                    {editEvent && <Spacer />}
                    <div className="ev-details-user">
                        {event.guide && <Person width={150} name={event.guide.displayName} icon={event.guide.icon}
                            onRemove={editEvent ? () => updateEvent("guide", undefined) : undefined} />}
                    </div>
                </div>
            </div>
            {/**Location */}
            <div className="ev-details-line">
                <LocationIcon className="ev-details-icon" />
                <div className="ev-details-users-container">
                    {editEvent && <ComboBox
                        listStyle={listStyle}
                        textStyle={textStyle}
                        allowFreeText={true}
                        listWidth={150}
                        hideExpandButton={!editEvent}
                        placeholder={"בחירת מיקום"}
                        items={locations.map(l => l.name)}
                        value={event.location || ""}
                        onSelect={(newLocation: string) => updateEvent("location", newLocation)}
                        onChange={(newLocation: string) => updateEvent("location", newLocation)}
                    />}
                    {editEvent && <Spacer />}
                    <div className="ev-details-user">
                        {event.location && <Person hideIcon={true} width={150} name={event.location} onRemove={editEvent ? () => updateEvent("location", undefined) : undefined} />}
                    </div>
                </div>
            </div>

            <div className="ev-details-line">
                <AudioIcon className="ev-details-icon" />
                {<div className="ev-details-audio-title">{event.audioUrl ? "הוקלט שמע" : "לא הוקלט שמע"}</div>}
                {<AudioPlayerRecorder
                    showPlayButton={!!event.audioUrl || !!event.audioBlob}
                    showRecordButton={!!editEvent}
                    notify={notify}
                    showClearButton={!!editEvent && (!!event.audioUrl || !!event.audioBlob)}

                    onCapture={(blob) => {
                        updateEvent("audioBlob", blob);
                        updateEvent("audioUrl", undefined);
                    }}
                    onClear={() => {
                        if (event.audioBlob) {
                            updateEvent("audioBlob", undefined);
                        } else if (event.audioUrl) {
                            updateEvent("audioUrl", undefined);
                        }
                    }}
                    audioBlob={event.audioBlob}
                    audioUrl={event.audioUrl}
                    buttonSize={35} />}
            </div>

            <div className="ev-details-line">
                <SunIcon className="ev-details-icon" />

                <div className="ev-details-label">חוזר:</div>
                <Spacer />
                {editEvent ? <ComboBox
                    listStyle={listStyle}
                    textStyle={textStyle}
                    listWidth={150}
                    allowFreeText={false}
                    value={event.recurrent ? event.recurrent.freq : "none"}
                    items={RecurrentEventFieldKeyValue}
                    onSelect={(newValue: string) => {
                        if (newValue === "none") {
                            updateEvent("recurrent", undefined);
                            return;
                        }
                        if (event.recurrent?.freq !== newValue) {
                            updateEvent("recurrent", { ...event.recurrent, freq: newValue as EventFrequency });
                        }
                    }}

                /> :
                    <div className="ev-details-label">{event.recurrent ?
                        RecurrentEventFieldKeyValue.find(f => f.key === event.recurrent?.freq)?.value :
                        "ללא"}</div>
                }
                <Spacer width={30} />
                {!event.allDay && <div className="ev-details-label">תזכורת:</div>}
                <Spacer />
                {!event.allDay && (
                    editEvent ? <ComboBox
                        listStyle={listStyle}
                        textStyle={textStyle}
                        listWidth={150}
                        allowFreeText={false}
                        value={event.reminderMinutes === undefined ? "none" : event.reminderMinutes + ""}
                        items={ReminderFieldKeyValue}
                        onSelect={(newValue: string) => {
                            const newIntValue = parseInt(newValue);
                            updateEvent("reminderMinutes", isNaN(newIntValue) ? undefined : newIntValue);
                        }}

                    /> : <div className="ev-details-label">{event.reminderMinutes ?
                        ReminderFieldKeyValue.find(f => f.key === "" + event.reminderMinutes)?.value :
                        "ללא"}</div>
                )}

            </div>
            {needScroll && !atBottom && <div className="modal-more-indicator" ><South style={{ fontSize: 35 }} /></div>}
        </div>
        <div className="ev-details-buttons">
            {!editEvent && <button className="ev-details-button" autoFocus={true} onClick={handleEdit} >עריכה</button>}
            {editEvent && <button className="ev-details-button" autoFocus={true} onClick={handleSave} disabled={!isDirty() || updateInProgress}>שמירה</button>}
            {!editEvent && <button className="ev-details-button" onClick={handleDelete} disabled={updateInProgress}>מחיקה</button>}
            <button className="ev-details-button" onClick={onClose}>
                סגירה
            </button>
        </div>
    </div >
}