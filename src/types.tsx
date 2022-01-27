export const Collections = {
    EVENT_COLLECTION: "event",
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
