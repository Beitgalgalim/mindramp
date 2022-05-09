import { DocumentReference } from "@firebase/firestore/dist/lite";
import { EventApi } from '@fullcalendar/common'
import { DateFormats } from "./utils/date";
import dayjs from './localDayJs'

export type EventFrequency = "daily" | "weekly" | "biWeekly" | "custom" | "none";


export interface RecurrentEventField {
    freq?: EventFrequency,
    daysOfWeek?: number[],
    gid?: string,
    exclude?: string[]
}

export const RecurrentEventFieldKeyValue = [
    { key: "daily", value: "יומי" },
    { key: "weekly", value: "שבועי" },
    { key: "biWeekly", value: "אחת לשבועיים" },
//    { key: "custom", value: "מותאם" },
    { key: "none", value: "ללא" },
];


export class Event {
    date: string = "";
    title: string = "";
    start: string = "";
    end: string = "";
    notes?: string;
    imageUrl?: string;
    audioUrl?: string;
    audioPath?: string;
    audioBlob?: Blob;
    recurrent?: RecurrentEventField;
    instanceStatus?: boolean;

    clearAudio?: boolean;

    _ref?: DocumentReference | undefined = undefined;
    tag?: string;

    static fromEventAny(evt: Event | EventApi): Event {
        let eventApi = evt as EventApi;
        if ("toPlainObject" in eventApi) {
            return Event.fromAny(eventApi.toPlainObject({ collapseExtendedProps: true }));
        }
        return evt as Event;
    }

    static fromDbObj(doc: any): Event {
        const evt: Event = new Event();
        evt.title = doc.title;
        evt.start = dayjs(doc.start).format(DateFormats.DATE_TIME);
        evt.end = dayjs(doc.end).format(DateFormats.DATE_TIME);
        evt.date = doc.date || dayjs(doc.start).format(DateFormats.DATE);

        assignIfExists(evt, "notes", doc);
        assignIfExists(evt, "_ref", doc);
        assignIfExists(evt, "imageUrl", doc);
        assignIfExists(evt, "recurrent", doc);
        assignIfExists(evt, "instanceStatus", doc);
        assignIfExists(evt, "audioUrl", doc);
        assignIfExists(evt, "audioPath", doc);
        assignIfExists(evt, "audioBlob", doc);
        assignIfExists(evt, "clearAudio", doc);

        return evt;
    }

    static fromAny(obj: any) {
        return Event.fromDbObj(obj);
    }

    toDbObj(): any {
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

        if (!eventObj.notes) {
            delete eventObj.notes;
        }
        if (!eventObj.imageUrl) {
            delete eventObj.imageUrl;
        }
        if (!eventObj.recurrent) {
            delete eventObj.recurrent;
        }
        delete eventObj._ref;
        delete eventObj.tag;
        delete eventObj.audioBlob;
        delete eventObj.clearAudio;


        if (!eventObj.instanceStatus) {
            delete eventObj.instanceStatus;
        }
        if (!eventObj.audioUrl) {
            delete eventObj.audioUrl;
        }
        if (!eventObj.audioPath) {
            delete eventObj.audioPath;
        }
        return eventObj;
    }

}

function assignIfExists(evt: any, fieldName: string, doc: any) {
    if (doc[fieldName]) {
        evt[fieldName] = doc[fieldName];
    }
}


