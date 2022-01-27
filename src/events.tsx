import React, { useEffect, useState, useRef } from 'react';
import * as api from './api'
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Fab, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import AddEvent from './add-event';


export default function Events({ notify, connected }: { notify: any , connected:boolean}) {
    const [newEvent, setNewEvent] = useState<Date | null | undefined>(undefined);

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

    const dayPressed = (newEventDate: Date) => {
        setNewEvent(newEventDate)
    }

    const eventPressed = (event: any) => {
        notify.success("event clicked", event.title);
    }

    return (<div>
        {!newEvent && <div style={{ position: 'absolute', bottom: 50, right: 50, zIndex: 1000 }} >
            <Fab >
                <Add onClick={() => { setNewEvent(new Date) }} />
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

            initialView='dayGridMonth'
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            initialEvents={[]}
            // select={this.handleDateSelect}
            // eventContent={renderEventContent} // custom render function
            // eventClick={(event) => {
            //   event.jsEvent.cancelBubble = true;
            //   event.jsEvent.preventDefault();
            //   eventPressed(event.event);


            // }}
            // eventsSet={this.handleEvents} // called after events are initialized/added/changed/removed

            //eventChange={function(){}}
            //eventRemove={function(){}}
            dayCellDidMount={(arg) => arg?.el.addEventListener('click', () => dayPressed(arg.date))}
            eventDidMount={(arg) => arg?.el.addEventListener('click', (e) => {
                e.cancelBubble = true;
                e.preventDefault();
                eventPressed(arg.event);
            })}
        />
        {
            newEvent && <AddEvent date={newEvent} onCancel={() => setNewEvent(undefined)}
                onSave={(newEvent: any) => {
                    api.addEvent(newEvent).then(
                        () => {
                            notify.success("נשמר בהצלחה");
                            if (calendarRef && calendarRef.current) {
                                const calendarApi = calendarRef.current.getApi();
                                calendarApi.addEvent(newEvent);
                            }
                            setNewEvent(undefined);
                        },
                        (err) => notify.error(err.message)
                    )
                }} />
        }
    </div>)
}