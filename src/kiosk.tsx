import { useCallback, useState, useEffect } from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import { PersonOutlined } from '@mui/icons-material';
import Typography from '@material-ui/core/Typography';

import * as api from './api'
import { KioskProps, UserInfo } from './types';
import { HBox, Spacer, VBoxC } from './elem';
import { Checkbox, FormControlLabel } from '@mui/material';
import { Person } from './people-picker';
import "./css/kiosk.css"

function KioskPerson(props:any) {
    return <button className="kiosk-person" onClick={props.onPress}>
        {props.icon ? <img className="kiosk-person-img" src={props.icon} /> : <PersonOutlined className="kiosk-person-img"/>}
        <span>{props.name}</span>
    </button>
}


export default function Kiosk({ onSelectUser }:
    KioskProps) {
    const [users, setUsers] = useState<UserInfo[]>([]);

    useEffect(() => {
        api.getKioskUsers().then((users: UserInfo[]) => setUsers(users));
    }, []);

    return <div >
        <h1>יומן בית הגלגלים - בחירת משתמשים</h1>
        <div className="kiosk-container">
        {users.map((user, i) => (<KioskPerson
            key={i}
            name={user.fname + " " + user.lname}
            icon={user.avatar?.url}
            onPress={()=>onSelectUser(user._ref?.id)}
        />))}
        </div>
    </div>
}