import { DocumentReference } from "@firebase/firestore/dist/lite";
import { Event } from './event';
import { User } from '@firebase/auth';
import { Dayjs } from "dayjs";
import { MessagePayload } from "@firebase/messaging";

export function isDev(): boolean {
    if (window.location.hostname.includes("preview")) return true;

    return process.env.NODE_ENV === 'development' && (process.env as any).REACT_APP_PRODDATA !== "true";
}
export const Collections =
    //(window as any).devMode === true ?
    isDev() ?
        {
            EVENT_COLLECTION: "event_dev",
            MEDIA_COLLECTION: "media_dev",
            USERS_COLLECTION: "users_dev",
            PERSONAL_EVENT_COLLECTION: "personal_event_dev",
            USER_PERSONAL_SUBCOLLECTION: "personal",
            USER_SYSTEM_SUBCOLLECTION: "system",
        }
        :
        {
            EVENT_COLLECTION: "event",
            MEDIA_COLLECTION: "media",
            USERS_COLLECTION: "users",
            PERSONAL_EVENT_COLLECTION: "personal_event",
            USER_PERSONAL_SUBCOLLECTION: "personal",
            USER_SYSTEM_SUBCOLLECTION: "system",
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
    avatar?: AvatarInfo,
    type: UserType,
    _ref?: DocumentReference
}

export interface NotificationToken {
    token: string,
    isSafari: boolean,
    ts: string,
}

export interface UserPersonalInfo {
    email: string,
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

export interface EditEventArgs {
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
export interface UsersProps extends Notifying, WithUsers, WithReload { }

export interface LoginProps {
    onForgotPwd: () => void,
    onLogin: (u: User) => void,
    onError: (e: Error) => void,
    onCancel?: Callback;
}

export interface UserSettingsProps extends WithUser, Notifying {
    onSaveNickName: (newNick: string) => void,
    onClose:Callback,
    nickName: string,
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
    notificationOn: boolean,
    onNotificationClick: Callback,
    showingNotifications: boolean,
    newNotificationCount:number,
}


export interface MessageProps {
    msg: MessageInfo;
    onSetRead: Callback,
}


export interface EditEventsProps extends WithMedia, Notifying, WithUsers {
    inEvent: EditEventArgs;
    onSave: (editEvent: EditEventArgs, ref: DocumentReference | undefined) => void;
    onCancel: Callback;
    onDelete?: (editEvent: EditEventArgs, ref: DocumentReference) => void;
    events:Event[];
}

export interface EditUserProps extends Notifying {
    userInfo : UserInfo;
    afterSaved: () => void;
}

export interface DatePickerProps {
    start: string;
    end: string;
    setStart: setDateFunc;
    setEnd: setDateFunc;
    style?: any;
    allDay?:boolean;
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