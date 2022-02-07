import { DocumentReference } from "@firebase/firestore/dist/lite";
import { Event } from './event';
export const Collections = {
    EVENT_COLLECTION: "event",
    MEDIA_COLLECTION: "media",
}


export interface MsgButton {
    caption: string,
    callback: CallableFunction
}

export interface NotificationMessage {
    title?: string,
    body?: string,
    open: boolean,
    buttons?: MsgButton[],
    details?: string,
    progress?: boolean,
    top?: number,
    severity?: "success" | "error" | "info";
}

export type setDateFunc = (d: string) => void;

export interface MediaResource {
    name: string,
    url: string,
    type: "icon" | "photo",
    path: string,
    _ref?: DocumentReference
}


export interface EditEvent {
    event: Event,
    editAllSeries?: boolean
}

export type Callback = () => void;

export interface WithUser {
    user: string | null | undefined;
};

export interface Connected {
    connected: boolean;
};

export interface WithMedia {
    media: MediaResource[];
};

interface WindowSize {
    w: number,
    h: number
}
export interface WithWindowSize {
    windowSize: WindowSize;
};

export interface Notifying {
    notify: {
        success(body: string, title?: string): void;
        error(body: string, title?: string): void;
        ask(body: string, title: string | undefined, buttons: MsgButton[], details?: string): void;
        clear(): void;
        inProgress(): void;
    }
}

export interface AdminProps extends Connected, Notifying, WithUser { }
export interface EventsProps extends Connected, Notifying, WithMedia { }
export interface UserEventsProps extends Connected, WithUser, WithWindowSize { }
export interface EditEventsProps extends WithMedia {
    inEvent: EditEvent;
    onSave: (editEvent: EditEvent, ref: DocumentReference | undefined) => void;
    onCancel: Callback;
    onDelete?: (editEvent: EditEvent, ref: DocumentReference) => void;
}

export interface DatePickerProps {
    start: string;
    end: string;
    setStart: setDateFunc;
    setEnd: setDateFunc;
}