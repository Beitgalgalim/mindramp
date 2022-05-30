import Login from "./login";
import { User } from '@firebase/auth';

import { UserSettingsProps } from "./types";
import { HBoxC, Spacer, VBoxC } from "./elem";
import { TextField } from '@mui/material';
import { useState } from "react";
import { Button } from "@material-ui/core";
import * as api from './api'


export default function UserSettings({ onDone, user, notify, nickName }: UserSettingsProps) {
    const [editName, setEditName] = useState<string>(nickName);
    const savePersonalization = (value: string | null) => {
        if (value) {
            const state = { name: value }
            localStorage.setItem("state", JSON.stringify(state));
        }
    }

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
                label="כינוי"
                variant="outlined"
                dir="rtl"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
            />

            <Spacer />
            <HBoxC>
                <Button variant="outlined" onClick={() => {
                    savePersonalization(editName);
                    onDone(editName);
                }}>שמור</Button>
                <Spacer />
                <Button variant="outlined" onClick={() => {
                    onDone(nickName);
                }}>בטל</Button>
                <Spacer width={20} />
                {
                    user && <Button variant="outlined" onClick={() => {
                        api.logout();
                    }}>התנתקות</Button>
                }
            </HBoxC>
        </VBoxC>
    </div >
}