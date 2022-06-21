import { useEffect, useState, useRef } from 'react';
import * as api from './api'
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateSelectArg, EventChangeArg, EventClickArg, EventMountArg } from '@fullcalendar/common'
import { Fab } from '@mui/material'
import { Add } from '@mui/icons-material';
import { Event } from './event';

import AddEvent from './edit-event';
import { DateFormats, explodeEvents } from './utils/date';
import dayjs from 'dayjs';
import { EditEvent, EventsProps } from './types';
import { DocumentReference } from '@firebase/firestore/dist/lite';
import { addParticipantsIcon, addRepeatIcon } from './elem';




export default function Events({ connected, notify, media, users }: EventsProps) {
    const [newEvent, setNewEvent] = useState<EditEvent | undefined>(undefined);
    const [events, setEvents] = useState<Event[]>([]);

    let calendarRef = useRef<FullCalendar | null>(null);

    useEffect(() => {
        if (!connected)
            return;
        api.getEvents().then(evts => setEvents(evts));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected]);

    const calendarApi = calendarRef?.current?.getApi();

    function getNewEvent(): any {
        let d = calendarApi ? dayjs(calendarApi.getDate()) : dayjs(dayjs().format(DateFormats.DATE) + " 08:00 AM");
        if (d.hour() === 0) {
            d = d.add(8, "hours");
        }
        if (d.minute() !== 0 && d.minute() !== 30) {
            d = d.subtract(d.minute(), "minutes");
        }

        return {
            title: "",
            start: d.format(DateFormats.DATE_TIME),
            end: d.add(30, "minutes").format(DateFormats.DATE_TIME),
        }
    }


    useEffect(() => {
        const expEvents = explodeEvents(events);
        if (calendarApi) {
            calendarApi.removeAllEvents();
            expEvents.forEach(evt => {

                calendarApi.addEvent(evt);
                // {
                //   title: evt.title, date: evt.date, start: evt.start, end: evt.end, _ref: "xyz"
                // }
            })
        }

    }, [events]);

    const eventPressed = (eventClickArg: EventClickArg) => {
        const gid = eventClickArg.event.extendedProps?.recurrent?.gid
        if (gid) {
            // ask if editing the whole series or only this instance event
            notify.ask("האם לערוך את כל הסדרה?", undefined, [
                {
                    caption: "כל הסדרה",
                    callback: () => {
                        const evt = events.find(e => e._ref?.id === gid);
                        if (evt) {
                            setNewEvent({ event: evt, editAllSeries: true })
                        }
                    }
                },
                {
                    caption: "מופע נוכחי",
                    callback: () => setNewEvent({ event: Event.fromEventAny(eventClickArg.event), editAllSeries: false })
                },
                {
                    caption: "בטל",
                    callback: () => { }
                },
            ])
        } else {
            setNewEvent({ event: Event.fromEventAny(eventClickArg.event) });
        }
    }

    const handleDateSelect = (dateSelectArgs: DateSelectArg) => {
        console.log("click", dateSelectArgs.startStr);
        if (dateSelectArgs.view.type === 'timeGridDay' || dateSelectArgs.view.type === 'timeGridWeek') {
            setNewEvent({
                event: Event.fromAny({
                    title: "",
                    start: dayjs(dateSelectArgs.start),
                    end: dayjs(dateSelectArgs.end),
                    date: dayjs(dateSelectArgs.start).format(DateFormats.DATE)
                })
            });
        } else {
            calendarApi && calendarApi.gotoDate(dateSelectArgs.startStr);
        }
    }

    const eventChanged = (eventChangedArg: EventChangeArg) => {
        const gid = eventChangedArg.event.extendedProps?.recurrent?.gid
        if (gid && !eventChangedArg.event.extendedProps?.instanceStatus) {
            // ask if editing the whole series or only this instance event
            notify.ask("האם לשנות את כל הסדרה?", undefined, [
                {
                    caption: "כל הסדרה",
                    callback: () => {
                        // const evt = events.find(e => e._ref.id === gid);
                        // if (evt) {
                        //     //1
                        // }
                        notify.error("not implemented")
                    }
                },
                {
                    caption: "מופע נוכחי",
                    callback: () => {
                        api.createEventInstance(eventChangedArg.event, eventChangedArg.event.extendedProps?._ref).then(
                            (result) => {
                                notify.success("נשמר בהצלחה");

                                setEvents(evts => {
                                    const newEvents = evts.filter(e => e._ref?.id !== result.series._ref?.id)
                                    newEvents.push(result.series);
                                    newEvents.push(result.instance);
                                    return newEvents;
                                })
                                setNewEvent(undefined);
                            },
                            (err) => notify.error(err)
                        );

                    }
                },
                {
                    caption: "בטל",
                    callback: () => { }
                },
            ])
        } else {
            api.upsertEvent(eventChangedArg.event, eventChangedArg.event.extendedProps?._ref).then(
                (newDoc) => {
                    notify.success("נשמר בהצלחה");
                    setEvents(evts => [...evts.filter(e => e._ref?.id !== newDoc._ref?.id), newDoc]);
                },
                (err) => {
                    notify.error(err);
                    eventChangedArg.revert();
                }
            );
        }
    }

    return (<div
        style={{ display: "inline-grid", width: "100vw", height: "90vh" }}
    >
        {!newEvent && //<div style={{ position: 'absolute', bottom: 50, right: 50, zIndex: 1000 }} >
            <Fab
                color="primary" aria-label="הוסף"
                variant="circular"
                style={{
                    position: "fixed",
                    bottom: 50,
                    right: 50,
                    zIndex: 1000,
                    borderRadius: '50%'
                }}
            >
                <Add onClick={() => { setNewEvent({ event: getNewEvent() }) }} />
            </Fab>
            //</div>
        }
        <FullCalendar

            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            buttonText={{
                today: 'היום',
                month: 'חודש',
                week: 'שבוע',
                day: 'יום',
                list: 'רשימה'
            }}

            initialView='timeGridDay'
            height={"100%"}
            editable={true}
            direction={"rtl"}
            locale={"he"}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            weekText={"שבוע"}
            // slotMinTime={"06:00:00"}
            // slotMaxTime={"22:00:00"}
            initialEvents={[]}
            handleWindowResize={true}
            select={handleDateSelect}
            selectLongPressDelay={300}
            eventChange={eventChanged}
            eventClick={(arg) => eventPressed(arg)}
            eventDidMount={(info: EventMountArg) => {
                if (info && info.event.extendedProps?.recurrent) {
                    addRepeatIcon(info);
                }
                if(info && info.event.extendedProps?.participants) {
                    addParticipantsIcon(info);
                }
            }}
        />
        {
            newEvent && <AddEvent
                notify={notify}
                media={media}
                users={users}
                inEvent={newEvent}
                onCancel={() => setNewEvent(undefined)}
                onSave={async (editEvent: EditEvent, ref: DocumentReference | undefined) => {

                    //Saves new Audio if needed:
                    let audioPathToDelete: string | undefined = undefined;
                    let currentPathIsNew = false;
                    if (editEvent.event.audioBlob != null) {
                        // mark previous audio file if existed, for deletion
                        audioPathToDelete = editEvent.event.audioPath

                        //saves new audio
                        try {
                            const newMedia = await api.addAudio(dayjs().format(DateFormats.DATE_TIME_TS) + ".wav", editEvent.event.audioBlob)
                            editEvent.event.audioPath = newMedia.path;
                            editEvent.event.audioUrl = newMedia.url;
                            currentPathIsNew = true;
                        } catch (err: any) {
                            notify.error(err);
                            return;
                        }
                    } else if (editEvent.event.clearAudio) {
                        // Need to delete the current audio file
                        audioPathToDelete = editEvent.event.audioPath;

                        editEvent.event.audioPath = undefined;
                        editEvent.event.audioUrl = undefined;
                    }

                    if (editEvent.editAllSeries === false && !editEvent.event.instanceStatus) {
                        //update instance only
                        api.createEventInstance(editEvent.event, ref).then(
                            (result) => {
                                if (audioPathToDelete) {
                                    api.deleteFile(audioPathToDelete);
                                }
                                notify.success("נשמר בהצלחה");

                                setEvents(evts => {
                                    const newEvents = evts.filter(e => e._ref?.id !== result.series._ref?.id)
                                    newEvents.push(result.series);
                                    newEvents.push(result.instance);
                                    return newEvents;
                                })
                                setNewEvent(undefined);
                            },
                            (err) => {
                                notify.error(err);
                                if (currentPathIsNew && editEvent.event.audioPath !== undefined) {
                                    //delete the file that was uploaded
                                    api.deleteFile(editEvent.event.audioPath);
                                }
                            }
                        );
                    } else {
                        api.upsertEvent(editEvent.event, ref).then(
                            (evt2) => {
                                if (audioPathToDelete) {
                                    api.deleteFile(audioPathToDelete);
                                }
                                notify.success("נשמר בהצלחה");

                                setEvents(evts => {
                                    const newEvents = evts.filter(e => e._ref?.id !== ref?.id)
                                    newEvents.push(evt2);
                                    return newEvents;
                                })
                                setNewEvent(undefined);
                            },
                            (err) => {
                                notify.error(err);
                                if (currentPathIsNew && editEvent.event.audioPath !== undefined) {
                                    //delete the file that was uploaded
                                    api.deleteFile(editEvent.event.audioPath);
                                }
                            }
                        )
                    }
                }}

                onDelete={(editEvent: EditEvent, ref: DocumentReference) => {
                    notify.ask("האם למחוק אירוע?", "מחיקה",
                        [
                            {
                                caption: "כן",
                                callback: () => {
                                    if (editEvent.editAllSeries === false && !editEvent.event.instanceStatus) {
                                        // deletion of an instance that has no persistance
                                        api.createEventInstanceAsDeleted(editEvent.event.date, ref).then(
                                            (updatedEventSeries) => {
                                                setEvents(evts => evts.map(e => e._ref?.id !== ref?.id ? e : updatedEventSeries));
                                                setNewEvent(undefined);
                                                notify.success("מופע זה נמחק בהצלחה");
                                            },
                                            (err: any) => notify.error(err)
                                        )
                                    } else {
                                        api.deleteEvent(ref, editEvent.editAllSeries === true).then(
                                            (removedIDs) => {
                                                setEvents(evts => evts.filter(e => e._ref?.id && !removedIDs.includes(e._ref?.id)));
                                                setNewEvent(undefined);
                                                notify.success("נמחק בהצלחה")
                                            },
                                            (err: any) => notify.error(err)
                                        );
                                    }
                                }
                            },
                            {
                                caption: "בטל",
                                callback: () => { }
                            }
                        ]

                    )

                }}
            />
        }
    </div>)
}