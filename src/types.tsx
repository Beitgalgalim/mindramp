import { DocumentReference } from "@firebase/firestore/dist/lite";

export const Collections = {
    EVENT_COLLECTION: "event",
    MEDIA_COLLECTION: "media",
}


export interface MsgButton {
    caption: string,
    callback: CallableFunction
}



export interface NotificationMessage {
    title?:string, 
    body?:string, 
    open:boolean, 
    buttons?:MsgButton[],
    details?:string,
    progress?:boolean,
    top?:number,
    severity?:"success" | "error" | "info";
  }

  export interface NewEvent {
    title:string, 
    start: Date,
    end: Date,
    extendedProps?:any,
  }

  export type setDateFunc = (d: Date) => void;

  export interface MediaResource {
      name: string,
      url: string,
      type: "icon" | "photo",
      path: string,
      _ref?:DocumentReference
  }

  export interface RecurrentEventField {
      freq: "daily" | "weekly" | "custom" | "none",
      daysOfWeek?:number[],
      gid?:string,
      exclude?:string[]
  }

  export interface EditEvent {
      event:any,
      editAllSeries?: boolean
  }