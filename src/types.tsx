import { DocumentReference } from "@firebase/firestore/dist/lite";
import { Event } from './event';
import { User } from '@firebase/auth';
import { Dayjs } from "dayjs";
import { MessagePayload } from "@firebase/messaging";

export function isDev(): boolean {
    return process.env.NODE_ENV === 'development' && (process.env as any).REACT_APP_PRODDATA !== "true";
}
export const Collections =
    //(window as any).devMode === true ?
    isDev() ?
        {
            EVENT_COLLECTION: "event_dev",
            MEDIA_COLLECTION: "media_dev",
            GUIDES_COLLECTION: "guides_dev",
            USERS_COLLECTION: "users_dev",
            PERSONAL_EVENT_COLLECTION: "personal_event_dev",
            USER_PERSONAL_SUBCOLLECTION: "personal",
        }
        :
        {
            EVENT_COLLECTION: "event",
            MEDIA_COLLECTION: "media",
            GUIDES_COLLECTION: "guides",
            USERS_COLLECTION: "users",
            PERSONAL_EVENT_COLLECTION: "personal_event_dev",
            USER_PERSONAL_SUBCOLLECTION: "personal",
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

export interface GuideInfo {
    name: string,
    url: string,
    path: string,
    _ref?: DocumentReference
}

export interface AvatarInfo {
    path: string,
    url: string,
}

export enum UserType {
    PARTICIPANT = 1,
    GUIDE = 2,
}

export interface UserInfo {
    fname: string,
    lname: string,
    displayName: string,
    avatar: AvatarInfo,
    type: UserType,
    _ref?: DocumentReference
}

export interface NotificationToken {
    token: string,
    isSafari: boolean,
    ts: string,
}

export interface UserPersonalInfo {
    _ref: DocumentReference,
    phone?: string,
    notificationOn?: boolean,
    tokens?: NotificationToken[]
}


export interface MediaResource {
    name: string,
    url: string,
    type: "icon" | "photo" | "audio",
    path: string,
    _ref?: DocumentReference
}

export interface EditEvent {
    event: Event,
    editAllSeries?: boolean
}

export interface MessageInfo {
    title: string,
    body: string,
    unread: boolean,
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

export interface WithReload {
    reload?: CallableFunction;
};

export interface WithGuides {
    guides: GuideInfo[];
}

export interface WithUsers {
    users: UserInfo[];
}

interface WindowSize {
    w: number,
    h: number
}
export interface WithWindowSize {
    windowSize: WindowSize;
};

interface Notify {
    success(body: string, title?: string): void;
    error(body: string, title?: string): void;
    ask(body: string, title: string | undefined, buttons: MsgButton[], details?: string): void;
    clear(): void;
    inProgress(): void;
}

export interface Notifying {
    notify: Notify;
}

export type onPushNotificationHandler = (msgPayload: MessagePayload) => void

export interface AdminProps extends Connected, Notifying, WithUser { }
export interface EventsProps extends Connected, Notifying, WithMedia, WithUsers { }
export interface UserEventsProps extends Connected, WithUser, WithWindowSize, Notifying {
    notificationOn: boolean,
    onNotificationOnChange: (on: boolean) => void,
    onNotificationToken: (token: string) => void,
    onPushNotification: onPushNotificationHandler,
}
export interface MediaProps extends Notifying, WithMedia, WithReload { }
export interface GuidesProps extends Notifying, WithGuides, WithReload { }

export interface LoginProps {
    onForgotPwd: () => void,
    onLogin: (u: User) => void,
    onError: (e: Error) => void,
    onCancel?: Callback;
}

export interface UserSettingsProps extends WithUser, Notifying {
    onDone: (newNick: string, isTV:boolean) => void,
    nickName: string,
    isTV: boolean,
    notificationOn: boolean,
    onNotificationOnChange: (on: boolean) => void,
    onNotificationToken: (token: string) => void,
    onPushNotification: onPushNotificationHandler,
}

export interface EventsHeaderProps extends WithUser {
    onLogoDoubleClicked: Callback,
    nickName: string,
    height: number | string,
    showDateTime: Dayjs,
    centered: boolean,
    onNotificationClick: Callback,
    showingNotifications: boolean,
    newNotificationCount:number,
}


export interface MessageProps {
    msg: MessageInfo;
    onSetRead: Callback,
}


export interface EditEventsProps extends WithMedia, Notifying, WithUsers {
    inEvent: EditEvent;
    onSave: (editEvent: EditEvent, ref: DocumentReference | undefined) => void;
    onCancel: Callback;
    onDelete?: (editEvent: EditEvent, ref: DocumentReference) => void;
}

export interface EditGuideInfoProps {
    guide_info: GuideInfo;
    afterSaved: (guide_info: GuideInfo) => void;
}

export interface DatePickerProps {
    start: string;
    end: string;
    setStart: setDateFunc;
    setEnd: setDateFunc;
    style?: any
}

export interface RecorderProps {
    notify?: Notify;
    buttonSize?: number;
    showRecordButton: boolean;
    showPlayButton: boolean;
    showClearButton?: boolean;
    audioUrl?: string;
    audioBlob?: Blob;
    onCapture?: (blob: Blob) => void;
    onClear?: Callback;
    onPlayProgress?: (percent: number) => void;
}

export interface HourLinesProps extends WithWindowSize {
    sliceWidth: number;
    height: number;
    hours: string[];
    sliceEachHour: number;
    vertical: boolean;
}