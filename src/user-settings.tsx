import Login from "./login";
import { User } from '@firebase/auth';

import { UserSettingsProps } from "./types";
import { HBoxC, Spacer, VBoxC } from "./elem";
import { TextField } from '@mui/material';
import { useState, Fragment } from "react";
import { Button, makeStyles } from "@material-ui/core";
import * as api from './api'
import { Cancel, Save } from "@mui/icons-material";

const useStyles = makeStyles(() => ({
    buttonIcon: {
        margin: 10,
    }
}));

export default function UserSettings({ onDone, user, notify, nickName }: UserSettingsProps) {
    const [editName, setEditName] = useState<string>(nickName);
    const savePersonalization = (value: string | null) => {
        if (value) {
            const state = { name: value }
            localStorage.setItem("state", JSON.stringify(state));
        }
    }

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
                        <Button variant="outlined" onClick={() => {
                            api.logout();
                        }}>התנתקות</Button>
                    </Fragment>
                }
            </HBoxC>
        </VBoxC>
    </div >
}