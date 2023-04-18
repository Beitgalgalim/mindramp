import { useEffect, useState, useRef } from 'react';
import * as api from './api'
import { Checkbox, CircularProgress } from '@mui/material'
import { FilterAlt, NavigateBefore, NavigateNext, Today, VolumeOff, VolumeUp } from '@mui/icons-material';
import { Event } from './event';

import { DateFormats, getDayDesc, getNiceDate } from './utils/date';
import dayjs from 'dayjs';
import { AskBeforeCloseContainer, EventsProps, InstanceType, Roles } from './types';
import { FloatingAdd, Modal, Spacer } from './elem';
import './css/events.css';
import { hasRole } from './utils/common';
import { PeoplePicker, Person } from './people-picker';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction';

import { DateSelectArg, EventApi, EventChangeArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import EventDetails from './event-details';

/*
"title":"סדנת ציור",
"start":"2022-11-15T13:30:00+02:00",
"end":"2022-11-15T14:00:00+02:00",
"id":"UO96dfDuLbi7DYrximps",
"extendedProps":{
    "modifiedAt":"2022-11-13 07:44:52.345",
    "audioPath":"media/audio/2022-10-20T11:11.129.wav",
    "imageUrl":"https://firebasestorage.googleapis.com/v0/b/mindramp-58e89.appspot.com/o/media%2Fphotos%2Fpainting.jpeg?alt=media&token=eb162b59-cdf2-4a98-bdf2-28f4aae03d0f",
    "recurrent":
        {"exclude":["2022-11-13","2022-11-14"],
        "freq":"weekdays","gid":"UO96dfDuLbi7DYrximps"
        },
    "participants":{},
    "audioUrl":"https://firebasestorage.googleapis.com/v0/b/mindramp-58e89.appspot.com/o/media%2Faudio%2F2022-10-20T11%3A11.129.wav?alt=media&token=b172ab2c-75b9-42e4-ab3a-1ab07ece2ed4","tag":"UO96dfDuLbi7DYrximps"}}
*/

function hasParticipants(ev: EventApi) {
    return ev?.extendedProps?.participants && Object.entries(ev.extendedProps.participants).length > 0;
}

function getMarkerIcon(d: string) {
    return (<svg className="event-svg-icon" width="18" height="18" fill="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d={d} />
    </svg>)
}

function hashUser(email: string) {
    let hash = 5381;
    for (var i = 0; i < email.length; i++) {
        hash = ((hash << 5) + hash) + email.charCodeAt(i); /* hash * 33 + c */
    }
    return Math.abs(hash) % 17 + 1;
}


function renderOneEvent(event: EventApi): any {
    const recurrent = event.extendedProps.recurrent;
    const instanceStatus = event.extendedProps?.instanceStatus;
    // const hasParticipants = event.extendedProps?.participants && Object.entries(event.extendedProps.participants).length > 0;
    // const t1 = dayjs(event.start).format(DateFormats.TIME)
    // const t2 = dayjs(event.end).format(DateFormats.TIME)
    const high = dayjs(event.end).diff(event.start, "minute") > 59;

    return <div className={high ? "fc-one-event-container-high" : "fc-one-event-container"}>
        {/* {!event.allDay && <div className="fc-one-event-time">
            <div>
                {t2 + "-" + t1}
            </div>
        </div>
        } */}
        <div className="fc-one-event-title">
            {event.title}
        </div>

        <div className="fc-one-event-markers">
            {(recurrent || instanceStatus) && getMarkerIcon(
                instanceStatus ?
                    "M3 2 L24 23 L23 24 L2 3zM21 12V6c0-1.1-.9-2-2-2h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H5V10h14v2h2zm-5.36 8c.43 1.45 1.77 2.5 3.36 2.5 1.93 0 3.5-1.57 3.5-3.5s-1.57-3.5-3.5-3.5c-.95 0-1.82.38-2.45 1H18V18h-4v-4h1.5v1.43c.9-.88 2.14-1.43 3.5-1.43 2.76 0 5 2.24 5 5s-2.24 5-5 5c-2.42 0-4.44-1.72-4.9-4h1.54z" :
                    "M21 12V6c0-1.1-.9-2-2-2h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H5V10h14v2h2zm-5.36 8c.43 1.45 1.77 2.5 3.36 2.5 1.93 0 3.5-1.57 3.5-3.5s-1.57-3.5-3.5-3.5c-.95 0-1.82.38-2.45 1H18V18h-4v-4h1.5v1.43c.9-.88 2.14-1.43 3.5-1.43 2.76 0 5 2.24 5 5s-2.24 5-5 5c-2.42 0-4.44-1.72-4.9-4h1.54z")
            }
            {/* {hasParticipants && getMarkerIcon("M 16.5 13 c -1.2 0 -3.07 0.34 -4.5 1 c -1.43 -0.67 -3.3 -1 -4.5 -1 C 5.33 13 1 14.08 1 16.25 V 19 h 22 v -2.75 c 0 -2.17 -4.33 -3.25 -6.5 -3.25 Z m -4 4.5 h -10 v -1.25 c 0 -0.54 2.56 -1.75 5 -1.75 s 5 1.21 5 1.75 v 1.25 Z m 9 0 H 14 v -1.25 c 0 -0.46 -0.2 -0.86 -0.52 -1.22 c 0.88 -0.3 1.96 -0.53 3.02 -0.53 c 2.44 0 5 1.21 5 1.75 v 1.25 Z M 7.5 12 c 1.93 0 3.5 -1.57 3.5 -3.5 S 9.43 5 7.5 5 S 4 6.57 4 8.5 S 5.57 12 7.5 12 Z m 0 -5.5 c 1.1 0 2 0.9 2 2 s -0.9 2 -2 2 s -2 -0.9 -2 -2 s 0.9 -2 2 -2 Z m 9 5.5 c 1.93 0 3.5 -1.57 3.5 -3.5 S 18.43 5 16.5 5 S 13 6.57 13 8.5 s 1.57 3.5 3.5 3.5 Z m 0 -5.5 c 1.1 0 2 0.9 2 2 s -0.9 2 -2 2 s -2 -0.9 -2 -2 s 0.9 -2 2 -2 Z")} */}
            {event.extendedProps.audioUrl ? <VolumeUp /> : <VolumeOff/>}
            {/* {event.extendedProps.imageUrl && <img src={event.extendedProps.imageUrl} />} */}
        </div>
    </div>;
}

export default function Events({ notify, media, users, events, refDate, daysOffset, roles,
    onChangeDaysOffset,
    onRemoveEvents,
    onUpsertEvent,
    filter,
    setFilter,
    locations
}: EventsProps) {
    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [updateInProgress, setUpdateInProgress] = useState<boolean>(false);
    const [showEventDetails, setShowEventDetails] = useState<Event | undefined>(undefined);

    let calendarRef = useRef<FullCalendar | null>(null);

    const stopUpdateInProgress = () => setUpdateInProgress(false);

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
        if (calendarRef.current) {
            console.log("reload events into FullCalendar")
            calendarRef.current.getApi().removeAllEvents();
            events.forEach(evt => calendarRef.current && calendarRef.current.getApi().addEvent(evt))
        }
    }, [events]);

    useEffect(() => {
        const newDate = refDate.add(daysOffset, "day");
        calendarApi?.gotoDate(newDate.format(DateFormats.DATE_TIME));
    }, [calendarApi, daysOffset, refDate]);

    const eventPressed = (evt: Event) => {
        setShowEventDetails(evt);
    }


    const handleSave = async (eventToSave: Event, instanceType: InstanceType) => {
        //Saves new Audio if needed:
        setUpdateInProgress(true);
        let audioPathToDelete: string | undefined = undefined;
        let currentPathIsNew = false;
        if (eventToSave.audioBlob != null) {
            // mark previous audio file if existed, for deletion
            audioPathToDelete = eventToSave.audioPath

            //saves new audio
            try {
                const newMedia = await api.addAudio(dayjs().format(DateFormats.DATE_TIME_TS) + ".wav", eventToSave.audioBlob)
                eventToSave.audioPath = newMedia.path;
                eventToSave.audioUrl = newMedia.url;
                currentPathIsNew = true;
            } catch (err: any) {
                notify.error(err);
                setUpdateInProgress(false);
                return;
            }
        } else if (eventToSave.clearAudio) {
            // Need to delete the current audio file
            audioPathToDelete = eventToSave.audioPath;

            eventToSave.audioPath = undefined;
            eventToSave.audioUrl = undefined;
        }

        if (instanceType === InstanceType.Instance && !eventToSave.instanceStatus && eventToSave.id) {
            //update instance only
            api.createEventInstance(eventToSave, eventToSave.id).then(
                (result) => {
                    if (audioPathToDelete) {
                        api.deleteFile(audioPathToDelete);
                    }
                    notify.success("נשמר בהצלחה");
                    onUpsertEvent(result.series, result.instance)
                    setShowEventDetails(undefined);
                },
                (err) => {
                    notify.error(err);
                    if (currentPathIsNew && eventToSave.audioPath !== undefined) {
                        //delete the file that was uploaded
                        api.deleteFile(eventToSave.audioPath);
                    }
                }
            ).finally(stopUpdateInProgress);
        } else {
            // normal or whole series
            api.upsertEvent(eventToSave, eventToSave.id).then(
                (evt2) => {
                    if (audioPathToDelete) {
                        api.deleteFile(audioPathToDelete);
                    }
                    notify.success("נשמר בהצלחה");
                    onUpsertEvent(evt2);
                    setShowEventDetails(undefined);
                },
                (err) => {
                    notify.error(err);
                    if (currentPathIsNew && eventToSave.audioPath !== undefined) {
                        //delete the file that was uploaded
                        api.deleteFile(eventToSave.audioPath);
                    }
                }
            ).finally(stopUpdateInProgress);
        }
    }

    const handleDelete = (eventToDelete: Event, instanceType: InstanceType) => {
        if (eventToDelete.id) {
            setUpdateInProgress(true);
            if (instanceType === InstanceType.Instance && !eventToDelete.instanceStatus) {
                api.createEventInstanceAsDeleted(eventToDelete.date, eventToDelete.id).then(
                    (updatedEventSeries) => {
                        onUpsertEvent(updatedEventSeries);
                        setShowEventDetails(undefined);
                        notify.success("מופע זה נמחק בהצלחה");
                    },
                    (err: any) => notify.error(err)
                ).finally(stopUpdateInProgress)
            } else {
                const isSeries = instanceType === InstanceType.Series;
                const id = isSeries ?
                    eventToDelete.recurrent?.gid :
                    eventToDelete.id;
                if (id) {
                    api.deleteEvent(id, isSeries).then(
                        (removedIDs) => {
                            onRemoveEvents(removedIDs);
                            setShowEventDetails(undefined);
                            notify.success("נמחק בהצלחה")
                        },
                        (err: any) => notify.error(err)
                    ).finally(stopUpdateInProgress);
                }
            }
        }
    }


    const handleDateSelect = (dateSelectArgs: DateSelectArg) => {
        if (dateSelectArgs.view.type === 'timeGridDay' || dateSelectArgs.view.type === 'timeGridWeek') {
            const event = Event.fromAny({
                id: "",
                title: "",
                start: dayjs(dateSelectArgs.start),
                end: dayjs(dateSelectArgs.end),
                allDay: dateSelectArgs.start.getHours() === 0 && dateSelectArgs.start.getMinutes() === 0 &&
                    dateSelectArgs.end.getHours() === 0 && dateSelectArgs.end.getMinutes() === 0,
                date: dayjs(dateSelectArgs.start).format(DateFormats.DATE)
            })
            setShowEventDetails(event)
        } else {
            calendarApi && calendarApi.gotoDate(dateSelectArgs.startStr);
        }
    }

    const eventChanged = (eventChangedArg: EventChangeArg) => {
        const ev = Event.fromEventAny(eventChangedArg.event)
        const gid = ev?.recurrent?.gid
        if (gid && !ev?.instanceStatus) {
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
                        eventChangedArg.revert();
                    }
                },
                {
                    caption: "מופע נוכחי",
                    callback: () => {
                        setUpdateInProgress(true);
                        ev.id && api.createEventInstance(ev, ev.id).then(
                            (result) => {
                                notify.success("נשמר בהצלחה");
                                onUpsertEvent(result.series, result.instance);
                                //setNewEvent(undefined);
                            },
                            (err) => notify.error(err)
                        ).finally(stopUpdateInProgress);

                    }
                },
                {
                    caption: "בטל",
                    callback: () => {
                        eventChangedArg.revert();
                    }
                },
            ])
        } else {
            setUpdateInProgress(true);
            api.upsertEvent(ev, ev.id).then(
                (newDoc) => {
                    notify.success("נשמר בהצלחה");
                    onUpsertEvent(newDoc);
                },
                (err) => {
                    notify.error(err);
                    eventChangedArg.revert();
                }
            ).finally(stopUpdateInProgress);
        }
    }

    const currDate = refDate.add(daysOffset, "day");
    const dayInWeek = currDate.day();

    const days = ["א", "ב", "ג", "ד", "ה", "ו", "ש",];
    const eventDetailsBeforeClose: AskBeforeCloseContainer = { askBeforeClose: undefined };

    const eventDetailsClose = () => {
        if (eventDetailsBeforeClose.askBeforeClose &&
            eventDetailsBeforeClose.askBeforeClose()) {
            notify.ask("האם לצאת ולהתעלם מהשינויים שבוצעו?", undefined, [
                { caption: "המשך עריכה", callback: () => { } },
                { caption: "יציאה ללא שמירה", callback: () => setShowEventDetails(undefined) }
            ])
        } else {
            setShowEventDetails(undefined);
        }
    }


    return (<div className="events-container">

        <div className="events-days-header">
            {days.map((d, i) => <div className="day-header" key={i}>{d + "׳"}</div>)}
        </div>

        <div className="events-days-buttons">
            {
                days.map((d, i) => {
                    const diffThisWeek = i - dayInWeek;
                    const dayDate = currDate.add(diffThisWeek, "days");
                    const today = dayDate.diff(refDate, "days") === 0;
                    return <div className={"day-button" + (!diffThisWeek ? " selected-date" : (today ? " day-today" : ""))} key={i}
                        onClick={() => onChangeDaysOffset(daysOffset + diffThisWeek)}
                    >{dayDate.format("D")}</div>
                })
            }
        </div>

        <div className="events-nav-buttons">
            <div className="date-title">{getNiceDate(currDate) + ", " + getDayDesc(currDate, daysOffset)}</div>
            <div className="events-nav-btn" onClick={() => onChangeDaysOffset(daysOffset + 7)}><NavigateNext /></div>
            <div className="events-nav-btn" onClick={() => onChangeDaysOffset(daysOffset - 7)}><NavigateBefore /></div>
            <div className="events-nav-btn" onClick={() => onChangeDaysOffset(0)}><Today /></div>
            <div className="events-nav-btn" onClick={() => setShowFilter(old => !old)}>
                <FilterAlt />
                {(!filter.publicEvents || !filter.allPrivateEvents) && <div className={"filter-red-dot"} />}
            </div>
        </div>


        {showEventDetails && <Modal className="event-details-container"
            onClose={eventDetailsClose}
            hideCloseButton={true}>
            <EventDetails
                inEvent={showEventDetails}
                eventDetailsBeforeClose={eventDetailsBeforeClose}
                onClose={eventDetailsClose}
                events={events}
                notify={notify}
                media={media}
                users={users}
                locations={locations}
                onSave={handleSave}
                onDelete={handleDelete}
                updateInProgress={updateInProgress}
            />
        </Modal>}

        {showFilter && <Modal className="filter-container" onClose={() => setShowFilter(false)}>
            <div className="filter-title">סינון</div>
            <div className="filter-item filter-checkbox-all"><Checkbox checked={filter.publicEvents} onChange={(e) => setFilter({ ...filter, publicEvents: e.target.checked })} />יומן ציבורי</div>
            <div className="filter-item filter-checkbox-private"><Checkbox checked={filter.allPrivateEvents} onChange={(e) => setFilter({ ...filter, allPrivateEvents: e.target.checked })} />כל היומנים הפרטיים</div>
            {!filter.allPrivateEvents && <div className="filter-users-container">
                <div className="filter-select-users" >
                    <label>בחר יומנים</label>
                    <PeoplePicker
                        users={users.filter(user => !filter.users.some(u => u === user._ref?.id))}
                        placeholder={"הוספת מוזמנים"}

                        onSelect={(userId: string) => {

                            //!e.target.checked 
                            const newUsers = [...filter.users, userId];

                            setFilter({
                                publicEvents: filter.publicEvents,
                                allPrivateEvents: filter.allPrivateEvents,
                                users: newUsers
                            })
                        }}
                    />
                </div>
                <Spacer height={15} />

                <div className="filter-selected-users">
                    {filter.users.map((userId, i) => {
                        const user = users.find(user => user._ref?.id === userId);
                        return (user && <Person
                            key={i}
                            width={170}
                            icon={user.avatar?.url}
                            name={user.displayName}
                            onRemove={() => {
                                setFilter({
                                    ...filter,
                                    users: filter.users.filter(u => u !== userId),
                                })
                            }}
                        />)

                    })}

                </div>
            </div>}
        </Modal>}


        {updateInProgress && <div className="event-center-progress">
            <CircularProgress />
        </div>}
        {!showEventDetails && hasRole(roles, Roles.Editor) && <FloatingAdd onClick={() => setShowEventDetails(getNewEvent())} />}

        <FullCalendar

            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={false}
            dayHeaders={false}
            buttonText={{
                today: 'היום',
                month: 'חודש',
                week: 'שבוע',
                day: 'יום',
                list: 'רשימה'
            }}
            //allDayText="הודעה"
            allDayContent={<div />}

            eventOrder={(ev1: any, ev2: any) => {
                const p1 = hasParticipants(ev1);
                const p2 = hasParticipants(ev2);
                if (p1 && !p2) return 1;
                if (p2 && !p1) return -1;

                return (ev1.title < ev2.title) ? 1 : -1;
            }}
            initialView='timeGridDay'
            height={"100%"}
            direction={"rtl"}
            locale={"he"}
            dayMaxEvents={true}
            weekends={true}
            weekText={"שבוע"}
            slotMinTime={"06:00:00"}
            slotMaxTime={"22:00:00"}
            scrollTime={"07:00:00"}
            initialEvents={[]}
            handleWindowResize={true}
            editable={true}
            selectable={true}
            selectMirror={true}
            //selectAllow={(span: DateSpanApi, movingEvent: EventImpl | null) => true}
            select={handleDateSelect}


            selectLongPressDelay={300}
            eventChange={eventChanged}
            eventClick={(args: EventClickArg) => eventPressed(Event.fromEventAny(args.event))}
            eventContent={(arg: EventContentArg) => renderOneEvent(arg.event)}
            eventClassNames={(args: EventContentArg) => {
                const participants = args.event.extendedProps?.participants
                if (!participants) {
                    return "public-event";
                }
                const participantsArr = Object.entries(participants);

                if (participantsArr.length > 1) {
                    return "multi-user-event";
                }
                if (participantsArr.length === 1) {
                    const hash = hashUser((participantsArr[0][1] as any).email);
                    return "p" + hash;
                }
                return "public-event";
            }}
        />


        {/* onDelete={(editEvent: EditEventArgs, id: string) => {
                    notify.ask("האם למחוק אירוע?", "מחיקה",
                        [
                            {
                                caption: "כן",
                                callback: () => {
                                    setUpdateInProgress(true);
                                    if (editEvent.editAllSeries === false && !editEvent.event.instanceStatus) {
                                        // deletion of an instance that has no persistance
                                        api.createEventInstanceAsDeleted(editEvent.event.date, id).then(
                                            (updatedEventSeries) => {
                                                onUpsertEvent(updatedEventSeries);
                                                setNewEvent(undefined);
                                                notify.success("מופע זה נמחק בהצלחה");
                                            },
                                            (err: any) => notify.error(err)
                                        ).finally(stopUpdateInProgress)
                                    } else {
                                        api.deleteEvent(id, editEvent.editAllSeries === true).then(
                                            (removedIDs) => {
                                                onRemoveEvents(removedIDs);
                                                setNewEvent(undefined);
                                                notify.success("נמחק בהצלחה")
                                            },
                                            (err: any) => notify.error(err)
                                        ).finally(stopUpdateInProgress);
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
            /> */}

    </div>)
}