import { DocumentReference } from "@firebase/firestore/dist/lite";
import { Event } from './event';
import { User } from '@firebase/auth';
import { Dayjs } from "dayjs";
import { MessagePayload } from "@firebase/messaging";
import { MutableRefObject } from "react";

export function isDev(): boolean {
    //if (window.location.hostname.includes("preview")) return true;
    if (window.location.search.includes("devMode")) return true;

    return process.env.NODE_ENV === 'development' && (process.env as any).REACT_APP_PRODDATA !== "true";
}
export const Collections =
    //(window as any).devMode === true ?
    isDev() ?
        {
            EVENT_COLLECTION: "event_dev",
            MEDIA_COLLECTION: "media_dev",
            USERS_COLLECTION: "users_dev",
            LOCATIONS_COLLECTION: "locations_dev",
            USER_PERSONAL_SUBCOLLECTION: "personal",
            USER_SYSTEM_SUBCOLLECTION: "system",
        }
        :
        {
            EVENT_COLLECTION: "event",
            MEDIA_COLLECTION: "media",
            USERS_COLLECTION: "users",
            LOCATIONS_COLLECTION: "locations",
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
    KIOSK = 3,
}

export interface Role {
    id: string,
    implicit: boolean, // is this role directly assigned or implicitly as a result of another role asigned
}

export interface RoleRecord {
    id: string,
    members: string[],
    assignRoles: string[],
    displayName: string,
    description: string,
}

export const Roles = {
    Admin: "admin",
    UserAdmin: "user-admin",
    ContentAdmin: "content-admin",
    Editor: "editor",
    Kiosk: "kiosk",
};

export interface UserInfo {
    fname: string,
    lname: string,
    displayName: string,
    phone?: string,
    avatar?: AvatarInfo,
    type: UserType,
    showInKiosk?: boolean;
    _ref?: DocumentReference
}

export interface ImageInfo extends MediaResource {
    keywords?: string[]
}

export interface LocationInfo {
    name: string,
    _ref?: DocumentReference
}

export interface NotificationToken {
    token: string,
    isSafari: boolean,
    ts: string,
}

export interface UserDocument {
    email: string,
    phone?: string,
    avatar?: AvatarInfo,
    nickName?:string,
    fname:string,
    lname:string,
    type?: UserType;
}

export interface AccessibilitySettingsData {
    imageSize: number,
    titleSize: number,
    hoursSize: number,
}

export interface UserElementProps {
    event: Event, single: boolean, firstInGroup: boolean, now: Dayjs,
    accessibilitySettings?: AccessibilitySettingsData
    width: number,
    audioRef?: MutableRefObject<HTMLAudioElement>,
    showingKeyEvent: boolean,
    onSetRead?: () => void,
    itemHeightPixels?: number,
    tabMarker?: string,
    kioskMode: boolean,
    groupIndex: number,
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

export interface NotificationViewProps {
    keyEvents:Event[],
    messages:MessageInfo[],
    kioskMode:boolean,
    onMessageSetRead: (msg:MessageInfo)=>void,
    onKeyEventSetRead: (keyEvt:Event)=>void,
    accSettings?: AccessibilitySettingsData,
    audioRef:MutableRefObject<HTMLAudioElement>,
    refDate:Dayjs,
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

export interface WithRoles {
    roles: Role[];
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

export interface KioskProps {
    onSelectUser: (user: string | undefined, avatarUrl: string | undefined) => void,
}
export interface EventsProps extends Notifying, WithMedia, WithUsers, WithRoles {
    events: any[],
    beta: boolean,
    refDate: Dayjs, // normally this is now
    daysOffset: number, // the offset in days from refDate
    audioRef: MutableRefObject<HTMLAudioElement>
    onChangeDaysOffset: (newOffet: number) => void,
    onRemoveEvents: (id: string[]) => void,
    onUpsertEvent: (event: Event, event2?:Event) => void,
}
export interface UserEventsProps extends Connected, WithUser, WithWindowSize, Notifying, WithRoles {
    isGuide: boolean,
    notificationOn: boolean,
    onNotificationOnChange: (on: boolean) => void,
    onNotificationToken: (token: string) => void,
    onPushNotification: onPushNotificationHandler,
    onGoHome: () => void,
    kioskMode: boolean,
    avatarUrl:string | undefined,
    nickName:string | undefined,
    onNickNameUpdate: (newNickName:string)=> void,
}
export interface MediaProps extends Notifying, WithMedia, WithReload { }
export interface UsersProps extends Notifying, WithUsers, WithReload, WithUser, WithRoles {
}

export interface LoginProps extends Notifying {
    onForgotPwd: () => void,
    onLogin: (u: User) => void,
    onError: (e: Error) => void,
    onCancel?: Callback;
}

export interface UserSettingsProps extends WithUser, Notifying {
    onSaveNickName: (newNick: string) => void,
    onClose: Callback,
    nickName: string | undefined,
    onAccessibilitySettings: () => void,
    notificationOn: boolean,
    onNotificationOnChange: (on: boolean) => void,
    onNotificationToken: (token: string) => void,
    onPushNotification: onPushNotificationHandler,
    onBetaChange: (on: boolean) => void,
    onAccessibleCalendar: (on: boolean) => void,
    beta: boolean,
    accessibleCalendar:boolean,
    isKioskUser:boolean,
}

export interface AccessibilitySettingsProps {
    onClose: Callback,
    accSettings: AccessibilitySettingsData | undefined,
    onSettingsChange: (accSettings: AccessibilitySettingsData) => void,
}

export interface EventsHeaderProps extends WithUser, WithRoles {
    onLogoDoubleClicked: Callback,
    onLogoTripleClicked?: Callback,
    nickName: string | undefined,
    isGuide: boolean,
    height: number | string,
    showDateTime: Dayjs,
    centered: boolean,
    notificationOn: boolean,
    onNotificationClick: Callback,
    showingNotifications: boolean,
    newNotificationCount: number,
    kioskMode: boolean,
    onGoHome: () => void,
    firstElemRef: any,
    avatarUrl: string | undefined,
}


export interface MessageProps {
    msg: MessageInfo;
    onSetRead: Callback,
}


export interface EditEventsProps extends WithMedia, Notifying, WithUsers {
    inEvent: EditEventArgs;
    onSave: (editEvent: EditEventArgs, id?: string) => void;
    onCancel: Callback;
    onDelete?: (editEvent: EditEventArgs, id: string) => void;
    events: Event[];
    updateInProgress:boolean;
}

export interface EditImageProps extends Notifying {
    imageInfo: ImageInfo
    onSave: (imageInfo: ImageInfo, file?: File) => void,
    onDelete: (imageInfo: ImageInfo) => void,
    onCancel?: Callback,
}

export interface EditUserProps extends WithUser, Notifying, WithRoles {
    userInfo: UserInfo;
    afterSaved: () => void;
    roleRecords: RoleRecord[];
}

export interface DatePickerProps {
    start: string;
    end: string;
    setStart: setDateFunc;
    setEnd: setDateFunc;
    style?: any;
    allDay?: boolean;
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