import { useEffect, useState, useRef } from 'react';
import * as api from './api'
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateSelectArg, EventChangeArg, EventClickArg, EventApi } from '@fullcalendar/common'
import { Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
import AddEvent from './edit-event';
import { DateFormats } from './utils/date';
import dayjs from 'dayjs';
import { MediaResource, NewEvent } from './types';

function getNewEvent(): NewEvent {
    const d = dayjs().format(DateFormats.DATE);
    return {
        title: "",
        start: dayjs(d).add(8, "hour").toDate(),
        end: dayjs(d).add(9, "hour").toDate(),
    }
}


export default function Events({ notify, connected, media }: { notify: any, connected: boolean, media:MediaResource[] }) {
    const [newEvent, setNewEvent] = useState<EventApi | NewEvent | null | undefined>(undefined);

    let calendarRef = useRef<FullCalendar | null>(null);

    useEffect(() => {
        if (!connected)
            return;
        api.getEvents().then(evts => evts.forEach(evt => {
            if (calendarRef && calendarRef.current) {
                const calendarApi = calendarRef.current.getApi();
                calendarApi.addEvent(evt);
                // {
                //   title: evt.title, date: evt.date, start: evt.start, end: evt.end, _ref: "xyz"
                // }

            }
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected]);

    const calendarApi = calendarRef?.current?.getApi();


    const eventPressed = (eventClickArg: EventClickArg) => {
        const ref = eventClickArg.event.extendedProps?._ref;
        if (ref) {
            setNewEvent(eventClickArg.event);
        } else {
            setNewEvent(eventClickArg.event);
        }
    }

    const handleDateSelect = (dateSelectArgs: DateSelectArg) => {
        console.log("click", dateSelectArgs.startStr);
        if (dateSelectArgs.view.type === 'timeGridDay') {
            setNewEvent({
                title: "",
                start: dateSelectArgs.start,
                end: dateSelectArgs.end
            });
        } else {
            calendarApi && calendarApi.gotoDate(dateSelectArgs.startStr);
        }
    }

    const eventChanged = (eventChangedArg: EventChangeArg) => {
        //const ref = eventChangedArg.event.extendedProps?._ref;
        //console.log("changed", ref.id)
        api.upsertEvent(eventChangedArg.event).then(
            () => notify.success("נשמר בהצלחה"),
            (err) => {
                notify.error(err.message);
                eventChangedArg.revert();
            }
        );
    }

    return (<div>
        {!newEvent && <div style={{ position: 'absolute', bottom: 50, right: 50, zIndex: 1000 }} >
            <Fab >
                <Add onClick={() => { setNewEvent(getNewEvent()) }} />
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

            initialView='timeGridDay'
            editable={true}
            direction={"rtl"}
            locale={"he"}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            initialEvents={[]}
            handleWindowResize={true}
            select={handleDateSelect}
            eventChange={eventChanged}
            eventClick={(arg) => eventPressed(arg)}
        />
        {
            newEvent && <AddEvent
                media={media}
                inEvent={newEvent}
                onCancel={() => setNewEvent(undefined)}
                onSave={(evt: any) => {
                    api.upsertEvent(evt).then(
                        (evt2) => {
                            notify.success("נשמר בהצלחה");
                            if (calendarRef && calendarRef.current) {
                                const calendarApi = calendarRef.current.getApi();
                                const evtObj:any = newEvent;
                                if (evtObj.remove) {
                                    evtObj.remove();
                                }
                                calendarApi.addEvent(evt2);
                            }
                            setNewEvent(undefined);
                        },
                        (err) => notify.error(err.message)
                    )
                }}

                onDelete={(evt: EventApi) => api.deleteEvent(evt).then(
                    () => {
                        evt.remove();
                        setNewEvent(undefined);
                    },
                    (err: Error) => notify.error(err.message)
                )}
            />
        }
    </div>)
}