import {
    deleteField, DocumentReference

} from 'firebase/firestore/lite';
import { EventApi } from '@fullcalendar/core'
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
    optional?: boolean,
    uidata?: {
        available?: boolean,
        availabilityDescription?: string;
    }
}

export interface LocationsFieldKeyValue {
    key: string
    value: string
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
    { key: "none", value: "ללא" },
    { key: "0", value: "בתחילת הארוע" },
    { key: "5", value: "5 דקות לפני" },
    { key: "10", value: "10 דקות לפני" },
    { key: "15", value: "15 דקות לפני" },
    { key: "30", value: "30 דקות לפני" },
    { key: "60", value: "שעה לפני" },
];


export class Event {
    id?:string = "";
    date: string = "";
    title: string = "";
    start: string = "";
    end: string = "";
    keyEvent?: boolean;
    allDay?: boolean;
    notes?: string;
    imageUrl?: string;
    guideUrl?: string;
    audioUrl?: string;
    audioPath?: string;
    audioBlob?: Blob;
    location?: string
    recurrent?: RecurrentEventField;
    guide?: Participant;
    participants?: any;
    instanceStatus?: boolean;
    reminderMinutes?: number;

    clearAudio?: boolean;
    isPersonal?: boolean;
    unread?: boolean;
    modifiedAt?:string;

    _ref?: DocumentReference | undefined = undefined;
    tag?: string;

    static fromEventAny(evt: Event | EventApi): Event {
        let eventApi = evt as EventApi;
        if ("toPlainObject" in eventApi) {
            const res = Event.fromAny(eventApi.toPlainObject({ collapseExtendedProps: true }));
            res.id = eventApi.id;
            res.allDay = eventApi.allDay;
            return res;
        }
        return evt as Event;
    }

    static fromDbObj(doc: any, ref?: DocumentReference, isPersonal: boolean = false): Event {
        const evt: Event = new Event();
        evt.title = doc.title;
        evt.start = dayjs(doc.start).format(DateFormats.DATE_TIME);
        evt.end = dayjs(doc.end).format(DateFormats.DATE_TIME);
        evt.date = doc.date || dayjs(doc.start).format(DateFormats.DATE);

        assignIfExists(evt, "notes", doc);
        assignIfExists(evt, "_ref", doc);
        if (ref) {
            evt._ref = ref;
            evt.id = ref.id;
        }
        assignIfExists(evt, "tag", doc);
        if (evt.tag) {
            evt.id = evt.tag;
        }
        assignIfExists(evt, "imageUrl", doc);
        assignIfExists(evt, "recurrent", doc);
        assignIfExists(evt, "location", doc)
        assignIfExists(evt, "instanceStatus", doc);
        assignIfExists(evt, "audioUrl", doc);
        assignIfExists(evt, "audioPath", doc);
        assignIfExists(evt, "audioBlob", doc);
        assignIfExists(evt, "clearAudio", doc);
        assignIfExists(evt, "participants", doc);
        assignIfExists(evt, "guide", doc);
        assignIfExists(evt, "keyEvent", doc);
        assignIfExists(evt, "allDay", doc);
        assignIfExists(evt, "reminderMinutes", doc);
        assignIfExists(evt, "modifiedAt", doc);
        evt.isPersonal = isPersonal;

        return evt;
    }

    static fromAny(obj: any) {
        return Event.fromDbObj(obj);
    }

    static equals(src: any, comp: any): boolean {
        return src.date === comp.date && src.title === comp.title;
    }

    static getParticipantKey(email?: string): string {
        if (email) {
            return email.replaceAll(".", "").replace("@", "");
        }
        return ""
    }

    static getParticipantsAsArray(participants?:any): Participant[] {
        const ret = [] as Participant[];
        if (participants) {
            for (const [key, value] of Object.entries(participants)) {
                ret.push(value as Participant);
            }
        }
        return ret;
    }

    toDbObj(isCreate: boolean = true): any {
        let eventObj = { ...this };
        eventObj.date = dayjs(this.start).format(DateFormats.DATE);
        eventObj.start = dayjs(this.start).format(DateFormats.DATE_TIME);
        eventObj.end = dayjs(this.end).format(DateFormats.DATE_TIME);

        if (eventObj.end < eventObj.start || !eventObj.allDay && eventObj.end < eventObj.start) {
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

        const setEmptyMapIfEmpty = (fieldName: string) => {
            const eventProps = eventObj as MapLike<any>;

            if (eventProps[fieldName] === undefined) {
                eventProps[fieldName] = {};
            }
        };

        clearFieldIfEmpty("notes");
        clearFieldIfEmpty("imageUrl");
        clearFieldIfEmpty("guideUrl");
        clearFieldIfEmpty("recurrent");
        clearFieldIfEmpty("location");
        clearFieldIfEmpty("instanceStatus");
        clearFieldIfEmpty("audioUrl");
        clearFieldIfEmpty("audioPath");

        if (eventObj.participants) {
            for (const [key, value] of Object.entries(eventObj.participants)) {
                delete eventObj.participants[key].uidata;
            }
        }

        setEmptyMapIfEmpty("participants");

        clearFieldIfEmpty("guide");
        clearFieldIfEmpty("keyEvent");
        clearFieldIfEmpty("allDay");
        clearFieldIfEmpty("reminderMinutes");

        delete eventObj._ref;
        delete eventObj.id;
        delete eventObj.tag;
        delete eventObj.audioBlob;
        delete eventObj.clearAudio;
        delete eventObj.isPersonal;
        delete eventObj.unread;
        delete eventObj.modifiedAt;
        return eventObj;
    }

}

function assignIfExists(evt: any, fieldName: string, doc: any) {
    if (doc[fieldName]) {
        evt[fieldName] = doc[fieldName];
    }
}


