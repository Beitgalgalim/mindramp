import { Spacer } from './elem';


import { Checkbox } from '@mui/material';
import { ReactComponent as UsersIcon } from './icons/users.svg'
import { ReactComponent as GuideIcon } from './icons/guide.svg'
import { ReactComponent as LocationIcon } from './icons/location.svg'
import { ReactComponent as AudioIcon } from './icons/audio.svg'
import { ReactComponent as SunIcon } from './icons/sun.svg'

import { Event, RecurrentEventFieldKeyValue, ReminderFieldKeyValue } from './event';

import AudioPlayerRecorder from './AudioRecorderPlayer';
import {  Person } from './people-picker';
import NewDatePicker from './newDatePicker';


export default function EventDetails({ event, onClose, onEdit }: { event: Event, onClose:()=>void, onEdit:(event:Event)=>void }) {
    


    return <div className="ev-details">
        <div className="ev-details-line ev-aligntop">
            <img className="ev-details-img" src={event.imageUrl} alt="אין"/>
            <div className="ev-details-title">
                {event.title}
            </div>
        </div>


        <div className="ev-details-line">
            <NewDatePicker
                //style={{width:"80%", textAlign:"start"}}
                start={event.start} end={event.end}
                setStart={(d) => { }}
                setEnd={(d) => { }}
                pickTimes={!event.allDay}
                readOnly={true}
            />
        </div>


        <div className="ev-details-line">
            <div className="ev-details-notes">
                {event.notes}
            </div>
            <Checkbox checked={event.keyEvent} disabled={true} />
            אירוע מיוחד
        </div>


        <div className="ev-details-line">
            <UsersIcon className="ev-details-icon" />
            <div className="ev-details-users">
                {event.participants && Object.entries(event.participants).map(([key, value]: any) => (<Person width={150} name={value.displayName} icon={value.icon} />))}
            </div>

        </div>

        <div className="ev-details-line">
            <GuideIcon className="ev-details-icon" />
            <div className="ev-details-user">
                {event.guide && <Person width={150} name={event.guide.displayName} icon={event.guide.icon} />}
            </div>
        </div>

        <div className="ev-details-line">
            <LocationIcon className="ev-details-icon" />
            <div className="ev-details-user">
                {event.location && <Person width={150} name={event.location} />}
            </div>
        </div>

        <div className="ev-details-line">
            <AudioIcon className="ev-details-icon" />
            {<div className="ev-details-audio-title">{event.audioUrl ? "הוקלט שמע" : "לא הוקלט שמע"}</div>}
            {event.audioUrl && <AudioPlayerRecorder
                showPlayButton={true}
                showRecordButton={false}
                //notify={notify}
                //showRecordButton={true} 
                //showClearButton={audioUrl || audioBlob}
                //showPlayButton={audioUrl || audioBlob} 

                // onCapture={(blob) => {
                //     setAudioBlob(blob)
                //     setClearAudio(false);
                // }} 
                // onClear={() => {
                //     if (audioBlob) {
                //         setAudioBlob(undefined);
                //     } else if (audioUrl) {
                //         setClearAudio(true);
                //     }
                // }}
                //audioBlob={audioBlob} 
                audioUrl={event.audioUrl}
                buttonSize={35} />}

        </div>

        <div className="ev-details-line">
            <SunIcon className="ev-details-icon" />

            <div className="ev-details-label">חוזר:</div>
            <div className="ev-details-label">{event.recurrent ?
                RecurrentEventFieldKeyValue.find(f => f.key == event.recurrent?.freq)?.value :
                "ללא"}</div>
            <Spacer width={30} />
            <div className="ev-details-label">תזכורת:</div>
            <div className="ev-details-label">{event.reminderMinutes ?
                ReminderFieldKeyValue.find(f => f.key == "" + event.reminderMinutes)?.value :
                "ללא"}</div>

        </div>

        <div className="ev-details-buttons">
            <button className="ev-details-button" autoFocus={true} onClick={()=>{
                onEdit(event);
            }}>
                עריכה
            </button>
            <button className="ev-details-button" onClick={onClose}>
                סגור
            </button>

        </div>

    </div>
}