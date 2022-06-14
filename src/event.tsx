import {
     deleteField, DocumentReference
    
} from 'firebase/firestore/lite';
import { EventApi } from '@fullcalendar/common'
import { DateFormats } from "./utils/date";
import dayjs from './localDayJs'
import { MapLike } from "typescript";

export type EventFrequency = "daily" | "weekly" | "biWeekly" | "weekdays" | "custom" | "none";


export interface RecurrentEventField {
    freq?: EventFrequency,
    daysOfWeek?: number[],
    gid?: string,
    exclude?: string[]
}

export interface Participant {
    email: string,
    displayName: string,
    icon?: string,
    optional?:boolean,
}

export const RecurrentEventFieldKeyValue = [
    { key: "daily", value: "יומי" },
    { key: "weekly", value: "שבועי" },
    { key: "biWeekly", value: "אחת לשבועיים" },
    { key: "weekdays", value: "ימות השבוע (א-ה)" },
    //    { key: "custom", value: "מותאם" },
    { key: "none", value: "ללא" },
];

export const ReminderFieldKeyValue = [
    { key: "0", value: "בתחילת הארוע" },
    { key: "15", value: "15 דקות לפני" },
    { key: "30", value: "30 דקות לפני" },
    { key: "60", value: "שעה לפני" },
];


export class Event {
    date: string = "";
    title: string = "";
    start: string = "";
    end: string = "";
    keyEvent?: boolean;
    notes?: string;
    imageUrl?: string;
    guideUrl?:string;
    audioUrl?: string;
    audioPath?: string;
    audioBlob?: Blob;
    recurrent?: RecurrentEventField;
    guide?: Participant;
    participants?: Participant[];
    instanceStatus?: boolean;
    reminderMinutes?:number;

    clearAudio?: boolean;
    isPersonal?: boolean;

    _ref?: DocumentReference | undefined = undefined;
    tag?: string;

    static fromEventAny(evt: Event | EventApi): Event {
        let eventApi = evt as EventApi;
        if ("toPlainObject" in eventApi) {
            return Event.fromAny(eventApi.toPlainObject({ collapseExtendedProps: true }));
        }
        return evt as Event;
    }

    static fromDbObj(doc: any, ref?:DocumentReference, isPersonal:boolean = false): Event {
        const evt: Event = new Event();
        evt.title = doc.title;
        evt.start = dayjs(doc.start).format(DateFormats.DATE_TIME);
        evt.end = dayjs(doc.end).format(DateFormats.DATE_TIME);
        evt.date = doc.date || dayjs(doc.start).format(DateFormats.DATE);

        assignIfExists(evt, "notes", doc);
        assignIfExists(evt, "_ref", doc);
        if (ref) {
            evt._ref = ref;
        }
        assignIfExists(evt, "imageUrl", doc);
        assignIfExists(evt, "recurrent", doc);
        assignIfExists(evt, "instanceStatus", doc);
        assignIfExists(evt, "audioUrl", doc);
        assignIfExists(evt, "audioPath", doc);
        assignIfExists(evt, "audioBlob", doc);
        assignIfExists(evt, "clearAudio", doc);
        assignIfExists(evt, "participants", doc);
        assignIfExists(evt, "guide", doc);
        assignIfExists(evt, "keyEvent", doc);
        assignIfExists(evt, "reminderMinutes", doc);

        evt.isPersonal = isPersonal;

        return evt;
    }

    static fromAny(obj: any) {
        return Event.fromDbObj(obj);
    }

    toDbObj(isCreate: boolean = true): any {
        let eventObj = { ...this };
        eventObj.date = dayjs(this.start).format(DateFormats.DATE);
        eventObj.start = dayjs(this.start).format(DateFormats.DATE_TIME);
        eventObj.end = dayjs(this.end).format(DateFormats.DATE_TIME);

        if (eventObj.end <= eventObj.start) {
            throw ("זמן סיום חייב להיות מאוחר מזמן התחלה");
        }

        if (!eventObj.title || eventObj.title.length === 0) {
            throw ("חסר כותרת לאירוע");
        }

        const clearFieldIfEmpty = (fieldName: string) => {
            const eventProps = eventObj as MapLike<any>;

            if (eventProps[fieldName] === undefined || (Array.isArray(eventProps[fieldName]) && eventProps[fieldName].length === 0)) {
                if (isCreate) {
                    delete eventProps[fieldName];
                } else {
                    eventProps[fieldName] = deleteField();
                }
            }
        };

        clearFieldIfEmpty("notes");
        clearFieldIfEmpty("imageUrl");
        clearFieldIfEmpty("guideUrl");
        clearFieldIfEmpty("recurrent");
        clearFieldIfEmpty("instanceStatus");
        clearFieldIfEmpty("audioUrl");
        clearFieldIfEmpty("audioPath");
        clearFieldIfEmpty("participants");
        clearFieldIfEmpty("guide");
        clearFieldIfEmpty("keyEvent");
        clearFieldIfEmpty("reminderMinutes");
        
        delete eventObj._ref;
        delete eventObj.tag;
        delete eventObj.audioBlob;
        delete eventObj.clearAudio;
        delete eventObj.isPersonal;
        return eventObj;
    }

}

function assignIfExists(evt: any, fieldName: string, doc: any) {
    if (doc[fieldName]) {
        evt[fieldName] = doc[fieldName];
    }
}


