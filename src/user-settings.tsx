import Login from "./login";
import { User } from '@firebase/auth';

import { UserSettingsProps } from "./types";
import { HBox, HBoxC, Spacer, Text, VBoxC } from "./elem";
import { Checkbox, TextField } from '@mui/material';
import { useState, Fragment, useCallback } from "react";
import { Button, makeStyles } from "@material-ui/core";
import * as api from './api'
import { Cancel, Logout, Notifications, Save } from "@mui/icons-material";

const useStyles = makeStyles(() => ({
    buttonIcon: {
        margin: 10,
    }
}));

export default function UserSettings({ onDone, user, notify, nickName,
    notificationOn,
    onNotificationOnChange,
    onNotificationToken,
    onPushNotification,
}: UserSettingsProps) {
    const [editName, setEditName] = useState<string>(nickName);
    const savePersonalization = (value: string | null) => {
        if (value) {
            const state = { name: value }
            localStorage.setItem("state", JSON.stringify(state));
        }
    }

    const handleNotificationOnClick = useCallback(() => {
        notify.ask(`האם ל${notificationOn ? "בטל" : "אפשר"} הודעות בדחיפה?`, undefined, [
            {
                caption: "כן", callback: () => {
                    if (notificationOn === false) {
                        api.initializeNotification(onPushNotification, onNotificationToken);
                    }
                    api.updateUserNotification(!notificationOn).then(
                        () => {
                            notify.success("עודכן בהצלחה")
                            onNotificationOnChange(!notificationOn);
                        },
                        (err) => notify.error(err.message));

                }
            },
            { caption: "לא", callback: () => { } },
        ])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notificationOn]);


    const handleSafariNotifClick = () => {
        // if ('safari' in window && 'pushNotification' in window.safari) {
        //   let permissionData = window.safari.pushNotification.permission('<todo>');
        //   let token = api.checkSafariRemotePermission(permissionData);
        //   if (token) {
        //     onNotificationToken(token);
        //   }
        // };
    };

    const classes = useStyles();

    return <div>
        <Spacer height={35} />
        {
            !user && <Login
                onLogin={(u: User) => { }}
                onError={(err: Error) => notify.error(err.toString())}
                onForgotPwd={() => {
                    //todo
                }}
            />
        }
        <VBoxC>
            <TextField
                autoFocus
                label="כינוי"
                variant="outlined"
                dir="rtl"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
            />

            <Spacer height={20} />
            {!("safari" in window) && <HBox style={{ alignItems: "center" }}>
                <Checkbox onChange={(evt) => {
                    handleNotificationOnClick()
                }} checked={notificationOn}
                    style={{ paddingRight: 0 }} />
                <Text fontSize={13}>אפשר התראות</Text>
                <Spacer />
                <Button
                    disabled={!notificationOn}
                    variant="outlined"
                    endIcon={<Notifications />}
                    classes={{ endIcon: classes.buttonIcon }}
                    onClick={() => api.testNotif()} >
                    בדיקת התראות
                </Button>
            </HBox>}
            <Spacer height={20} />
            <HBoxC>
                <Button
                    variant="outlined"
                    endIcon={<Save />}
                    classes={{ endIcon: classes.buttonIcon }}
                    onClick={() => {
                        savePersonalization(editName);
                        onDone(editName);
                    }}>שמור</Button>
                <Spacer />
                <Button
                    variant="outlined"
                    endIcon={<Cancel />}
                    classes={{ endIcon: classes.buttonIcon }}

                    onClick={() => {
                        onDone(nickName);
                    }}>בטל</Button>

                {
                    user && <Fragment>
                        <Spacer width={20} />
                        <Button
                            variant="outlined"
                            endIcon={<Logout />}
                            classes={{ endIcon: classes.buttonIcon }}
                            onClick={() => {
                                api.logout();
                            }}>התנתקות</Button>
                    </Fragment>
                }
            </HBoxC>

        </VBoxC>
    </div >
}