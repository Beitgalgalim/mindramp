import Login from "./login";
import { User } from '@firebase/auth';

import { UserSettingsProps } from "./types";
import { HBox, HBoxC, HBoxSB, Spacer, Text, VBoxC } from "./elem";
import { Checkbox, TextField } from '@mui/material';
import { useState, Fragment, useCallback, useEffect } from "react";
import { Button } from "@mui/material";
import * as api from './api'
import { Check, Close, Logout, Notifications, SettingsAccessibility } from "@mui/icons-material";

// const useStyles = makeStyles(() => ({
//     buttonIcon: {
//         margin: 10,
//     }
// }));

export default function UserSettings({ onSaveNickName, onClose, user, notify, nickName,
    notificationOn,
    onNotificationOnChange,
    onAccessibilitySettings,
    onNotificationToken,
    onPushNotification,
    onBetaChange,
    onAccessibleCalendar,
    accessibleCalendar,
    beta,
    isKioskUser,
    isTV
}: UserSettingsProps) {
    const [editName, setEditName] = useState<string>(nickName || "");

    const handleNotificationOnClick = useCallback(() => {
        notify.ask(`האם ל${notificationOn ? "בטל" : "אפשר"} הודעות בדחיפה?`, undefined, [
            {
                caption: "כן", callback: () => {
                    onNotificationOnChange(!notificationOn);
                    // if (notificationOn === false) {
                    //     // Switching to ON
                    //     api.initializeNotification(onPushNotification, onNotificationToken).then(
                    //         () => onNotificationOnChange(!notificationOn),
                    //         // api.updateUserNotification(!notificationOn).then(
                    //         //     () => {
                    //         //         notify.success("עודכן בהצלחה")
                    //         //         onNotificationOnChange(!notificationOn);
                    //         //     },
                    //         //     (err) => notify.error("Error updating notification on server. " + err.message))
                    //         (err: any) => notify.error("Error initializing notification on the device. " + err)
                    //     );
                    // } else {
                    //     api.updateUserNotification(!notificationOn).then(
                    //         () => {
                    //             notify.success("עודכן בהצלחה")
                    //             onNotificationOnChange(!notificationOn);
                    //         },
                    //         (err) => notify.error(err.message));
                    // }
                }
            },
            { caption: "לא", callback: () => { } },
        ])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notificationOn]);

    useEffect(()=>{
        setEditName(nickName || "");
    }, [nickName])


    // const handleSafariNotifClick = () => {
    // if ('safari' in window && 'pushNotification' in window.safari) {
    //   let permissionData = window.safari.pushNotification.permission('<todo>');
    //   let token = api.checkSafariRemotePermission(permissionData);
    //   if (token) {
    //     onNotificationToken(token);
    //   }
    // };
    // };

    //const classes = useStyles();

    return <div style={{ padding: 20 }}>
        <HBox style={{ justifyContent: "flex-end" }}>
            <SettingsAccessibility
                style={{ fontSize: 60 }}
                onClick={onAccessibilitySettings}
            />
            <Spacer width={10} />
            <Close
                style={{ fontSize: 40 }}
                onClick={() => {
                    onClose();
                }} />


        </HBox>

        <VBoxC>
            {!!user && !isKioskUser && <HBoxC style={{ width: "100%" }}>
                <TextField
                    autoFocus
                    label="כינוי"
                    variant="outlined"
                    dir="rtl"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                />
                {editName !== nickName &&
                    <Check
                        style={{ fontSize: 40 }}
                        onClick={() => {
                            onSaveNickName(editName);
                        }} />
                }
            </HBoxC>}

            <Spacer height={20} />
            {/* <HBox style={{ alignItems: "center" }}>
                <Checkbox onChange={() => {
                    onBetaChange(!beta)
                }} checked={beta}
                    style={{ paddingRight: 0 }} />
                <Text fontSize={13}>השתתפות בבטא</Text>
                <Spacer />

            </HBox> */}
            {/* <Spacer height={20} /> */}
            {!isTV && <HBox style={{ alignItems: "center" }}>
                <Checkbox onChange={() => {
                    onAccessibleCalendar(!accessibleCalendar)
                }} checked={!accessibleCalendar}
                    style={{ paddingRight: 0 }} />
                <Text fontSize={13}>תצוגת יומן שאינה מונגשת</Text>
                <Spacer />

            </HBox>}

            <Spacer height={20} />
            <HBoxC>
                {
                    user && <VBoxC>
                        <HBox>
                            <Text>מחובר:</Text>
                            <Spacer />
                            <Text>{user}</Text>
                        </HBox>
                        <Spacer />
                        <HBox>
                            <Button
                                style={{ minWidth: 180 }}
                                //disabled={!notificationOn}
                                variant="outlined"
                                endIcon={<Notifications />}
                                //classes={{ endIcon: classes.buttonIcon }}
                                onClick={() => api.testNotif().then(() => {
                                    notify.success("בקשה לשליחת התראת בדיקה נשלחה, ההתראה תגיע בדקה הקרובה")
                                }).catch(e => {
                                    notify.error("בדיקה נכשלה. שגיאה:" + e.message);
                                })} >
                                בדיקת התראות
                            </Button>
                            <Spacer width={20} />
                            <Button
                                variant="outlined"
                                endIcon={<Logout />}
                                //classes={{ endIcon: classes.buttonIcon }}
                                onClick={() => {
                                    api.logout();
                                }}>התנתקות</Button>

                        </HBox>
                    </VBoxC>
                }
            </HBoxC>

        </VBoxC>
        <Spacer width={20} />
        {
            !user && <Login
                notify={notify}
                onLogin={(u: User) => { }}
                onError={(err: Error) => notify.error(err.toString())}
                onForgotPwd={() => {
                    api.forgotPwd().then((info:any)=>{
                        notify.success("להחלפת סיסמא, יש לשלוח הודעת ווטסאפ למספר: " +
                        info.phone +
                        ". דוגמא: 'סיסמא myNewPassword' להחלפה לסיסמא myNewPassword. יש לבחור סיסמא לפחות בת 6 תווים."
                        , undefined, 10000);
                    })
                }}
            />
        }
    </div >
}