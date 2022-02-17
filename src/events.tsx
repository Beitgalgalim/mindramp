import { useEffect, useState, useRef } from 'react';
import * as api from './api'
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateSelectArg, EventChangeArg, EventClickArg, EventMountArg } from '@fullcalendar/common'
import { Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Event } from './event';

import AddEvent from './edit-event';
import { DateFormats, explodeEvents } from './utils/date';
import dayjs from 'dayjs';
import { EditEvent, EventsProps } from './types';
import { DocumentReference } from '@firebase/firestore/dist/lite';
import { addRepeatIcon } from './elem';




export default function Events({ connected, notify, media }: EventsProps) {
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
        const d = calendarApi ? calendarApi.getDate() : dayjs().format(DateFormats.DATE);
        return {
            title: "",
            start: dayjs(d).add(8, "hour").toDate(),
            end: dayjs(d).add(9, "hour").toDate(),
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
                            (err) => notify.error(err.message)
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
                    notify.error(err.message);
                    eventChangedArg.revert();
                }
            );
        }
    }

    return (<div>
        {!newEvent && <div style={{ position: 'absolute', bottom: 50, right: 50, zIndex: 1000 }} >
            <Fab >
                <Add onClick={() => { setNewEvent({ event: getNewEvent() }) }} />
            </Fab>
        </div>
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
            editable={true}
            direction={"rtl"}
            locale={"he"}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            weekText={"שבוע"}
            initialEvents={[]}
            handleWindowResize={true}
            select={handleDateSelect}
            eventChange={eventChanged}
            eventClick={(arg) => eventPressed(arg)}
            eventDidMount={(info: EventMountArg) => {
                if (info && info.event.extendedProps?.recurrent) {
                    addRepeatIcon(info);
                }
            }}
        />
        {
            newEvent && <AddEvent
                notify={notify}
                media={media}
                inEvent={newEvent}
                onCancel={() => setNewEvent(undefined)}
                onSave={async (editEvent: EditEvent, ref: DocumentReference | undefined) => {

                    //Saves new Audio if needed:
                    let audioPathToDelete:string | undefined = undefined;
                    if (editEvent.event.audioBlob != null) {
                        // mark previous audio file if existed, for deletion
                        audioPathToDelete = editEvent.event.audioPath

                        //saves new audio
                        try {
                            const newMedia = await api.addAudio(dayjs().format(DateFormats.DATE_TIME_TS) + ".wav", editEvent.event.audioBlob)
                            editEvent.event.audioPath = newMedia.path;
                            editEvent.event.audioUrl = newMedia.url;
                        } catch (err: any) {
                            notify.error(err.message);
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
                            (err) => notify.error(err.message)
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
                            (err) => notify.error(err.message)
                        )
                    }
                }}

                onDelete={(editEvent: EditEvent, ref: DocumentReference) => {
                    // delete non-recurrent event
                    api.deleteEvent(ref, editEvent.editAllSeries === true).then(
                        (removedIDs) => {
                            setEvents(evts => evts.filter(e => e._ref?.id && !removedIDs.includes(e._ref?.id)));
                            setNewEvent(undefined);
                        },
                        (err: Error) => notify.error(err.message)
                    );
                }}
            />
        }
    </div>)
}